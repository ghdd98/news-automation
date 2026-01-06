/**
 * Groq API 클라이언트
 * 3단계 AI 파이프라인용 모델 관리
 */

import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Groq 클라이언트 초기화
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// ==================== Stage별 모델 정의 ====================

// Stage 1: 노이즈 필터링 (1-3점 제거)
const STAGE1_MODELS = [
    'llama-3.1-8b-instant',  // 메인 (14.4K RPD)
    'allam-2-7b'             // 백업 (7K RPD)
];

// Stage 2: 4-5점 경계 분석
const STAGE2_MODELS = [
    'qwen/qwen3-32b',                             // 메인 (1K RPD, 60 RPM)
    'meta-llama/llama-4-scout-17b-16e-instruct',  // 백업1 (1K RPD)
    'moonshotai/kimi-k2-instruct-0905'            // 백업2 (1K RPD)
];

// Stage 3: 최종 분류 - Groq 모델 (1차 그룹)
const STAGE3_GROQ_PRIMARY = [
    'openai/gpt-oss-120b',                          // 1. 메인 (1K RPD)
    'openai/gpt-oss-20b',                           // 2. 백업 (1K RPD)
    'openai/gpt-oss-safeguard-20b',                 // 3. 백업 (1K RPD)
    'moonshotai/kimi-k2-instruct',                  // 4. kimi-k2 기본 (1K RPD)
    'moonshotai/kimi-k2-instruct-0905',             // 5. kimi-k2 0905 버전 (1K RPD)
    'llama-3.3-70b-versatile',                      // 6. 안정+강성능 (1K RPD)
    'qwen/qwen3-32b',                               // 7. ArenaHard 높음 (1K RPD)
];

// Stage 3: 최종 분류 - Groq 모델 (2차 그룹, Gemini 후 사용)
const STAGE3_GROQ_SECONDARY = [
    'meta-llama/llama-4-maverick-17b-128e-instruct', // 8. MMLU Pro 59.6 (1K RPD)
    'meta-llama/llama-4-scout-17b-16e-instruct',     // 9. MMLU Pro 52.2 (1K RPD)
    'llama-3.1-8b-instant',                          // 10. 최소품질/최대안정 (14.4K RPD)
];

// Gemini 백업 모델 (7번째 - Groq 1차 그룹 후 사용)
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemmaModel = genAI.getGenerativeModel({ model: 'gemma-3-27b-it' });

// ==================== 헬퍼 함수 ====================

/**
 * 지연 함수
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// 모든 모델을 순서대로 하나의 리스트로 관리 (고용량 모델 우선)
const ALL_MODELS = [
    // 최우선: 14.4K RPD로 가장 여유
    { type: 'groq', name: 'llama-3.1-8b-instant' },          // 14.4K RPD!
    // Production Models
    { type: 'groq', name: 'llama-3.3-70b-versatile' },       // Llama 3.3 70B
    { type: 'groq', name: 'openai/gpt-oss-120b' },           // GPT OSS 120B
    { type: 'groq', name: 'openai/gpt-oss-20b' },            // GPT OSS 20B
    // Preview Models
    { type: 'groq', name: 'openai/gpt-oss-safeguard-20b' },  // Safety GPT OSS 20B
    { type: 'groq', name: 'moonshotai/kimi-k2-instruct-0905' }, // Kimi K2
    { type: 'groq', name: 'qwen/qwen3-32b' },                // Qwen3-32B
    { type: 'groq', name: 'meta-llama/llama-4-maverick-17b-128e-instruct' },
    { type: 'groq', name: 'meta-llama/llama-4-scout-17b-16e-instruct' },
    // Google Gemma (마지막 백업)
    { type: 'gemma', name: 'gemma-3-27b-it' },
];

// 현재 사용 중인 모델 인덱스 (한도 초과 시 다음으로 이동)
let currentModelIndex = 0;

/**
 * 단순화된 AI 호출 (모든 모델을 순서대로 시도)
 */
async function callGroqWithFallback(models, prompt, maxRetries = 3) {
    // 현재 인덱스부터 모든 모델 시도
    for (let idx = currentModelIndex; idx < ALL_MODELS.length; idx++) {
        const modelInfo = ALL_MODELS[idx];

        for (let retry = 0; retry < maxRetries; retry++) {
            try {
                let text = '';

                if (modelInfo.type === 'groq') {
                    // Groq API 호출
                    const response = await groq.chat.completions.create({
                        model: modelInfo.name,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.3,
                        max_tokens: 500
                    });
                    text = response.choices[0]?.message?.content || '';
                } else if (modelInfo.type === 'gemma') {
                    // Google Gemma API 호출
                    const result = await gemmaModel.generateContent(prompt);
                    text = result.response.text();
                }

                if (text.trim()) {
                    return text; // 성공!
                }

            } catch (error) {
                const errorMsg = error.message || String(error);
                const errorCode = error.status || error.code || '';

                // 첫 번째 에러는 항상 상세 출력 (디버깅용)
                if (idx === currentModelIndex && retry === 0) {
                    console.log(`   🔍 [DEBUG] 모델: ${modelInfo.name}`);
                    console.log(`   🔍 [DEBUG] 에러코드: ${errorCode}`);
                    console.log(`   🔍 [DEBUG] 에러메시지: ${errorMsg.slice(0, 100)}`);
                }

                // 모델 관련 에러 또는 Rate limit 에러 시 다음 모델로
                if (errorMsg.includes('429') || errorMsg.includes('rate') ||
                    errorMsg.includes('quota') || errorMsg.includes('limit') ||
                    errorMsg.includes('exceeded') || errorMsg.includes('400') ||
                    errorMsg.includes('404') || errorMsg.includes('not found') ||
                    errorMsg.includes('invalid') || errorMsg.includes('unsupported') ||
                    errorCode === 400 || errorCode === 404 || errorCode === 429) {
                    console.log(`   ⚠️ ${modelInfo.name} 에러, 다음 모델로 전환...`);
                    currentModelIndex = idx + 1;
                    break; // 다음 모델로
                }

                // 일시적 에러 시 재시도
                if (retry < maxRetries - 1) {
                    console.log(`   ⏳ ${modelInfo.name} 에러 (${retry + 1}/${maxRetries}), 2초 후 재시도...`);
                    await sleep(2000);
                } else {
                    // 재시도 다 소진 시 다음 모델로
                    console.log(`   ⚠️ ${modelInfo.name} 재시도 실패, 다음 모델로...`);
                    currentModelIndex = idx + 1;
                }
            }
        }
    }

    // 모든 모델 실패 (llama-3.1-8b-instant도 실패하면 심각한 문제)
    throw new Error('모든 AI 모델 호출 실패 (11개 모델 전부 실패)');
}

/**
 * JSON 파싱 (안전하게)
 */
function parseJsonSafely(text) {
    try {
        // JSON 블록 추출
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        // 파싱 실패
    }
    return null;
}

// ==================== Stage별 분석 함수 ====================

/**
 * Stage 1: 노이즈 필터링 (1-3점 제거)
 * @param {Object} newsItem - 뉴스 아이템
 * @returns {Promise<{score: number, pass: boolean}>}
 */
export async function stage1Analysis(newsItem) {
    const prompt = `당신은 한국 경제/산업 뉴스 분석가입니다.

다음 뉴스가 경제/산업/기업/투자에 관련된 유용한 뉴스인지 판단하세요.

제목: ${newsItem.title}
설명: ${newsItem.description || '(없음)'}

점수 기준:
- 1-3점: 무관한 뉴스 (스포츠, 연예, 사건사고, 광고, 날씨 등)
- 4점 이상: 경제/산업/기업 관련 뉴스

반드시 아래 JSON 형식으로만 응답하세요:
{"score": 숫자, "reason": "간단한 이유"}`;

    try {
        const response = await callGroqWithFallback(STAGE1_MODELS, prompt);
        const parsed = parseJsonSafely(response);

        if (parsed && typeof parsed.score === 'number') {
            return {
                score: Math.min(10, Math.max(1, parsed.score)),
                pass: parsed.score >= 4
            };
        }
    } catch (error) {
        console.error(`   Stage1 분석 실패: ${newsItem.title.slice(0, 30)}...`);
    }

    // 분석 실패 시 통과 (안전하게)
    return { score: 4, pass: true };
}

/**
 * Stage 2: 경계 분석 (4점 제거, 5+ 통과)
 * @param {Object} newsItem - 뉴스 아이템
 * @returns {Promise<{score: number, pass: boolean}>}
 */
export async function stage2Analysis(newsItem) {
    const prompt = `당신은 한국 경제/산업 뉴스 전문 분석가입니다.

다음 뉴스의 투자/취업 준비에 대한 유용성을 정밀하게 분석하세요.

제목: ${newsItem.title}
설명: ${newsItem.description || '(없음)'}

점수 기준 (4점과 5점의 경계를 꼼꼼히 판단):
- 4점: 산업 관련이지만 단순 이벤트/인사이동/일반 소식 → 제외
- 5점: 투자/취업에 참고할 만한 정보 포함 → 통과
- 6점 이상: 확실히 유용한 정보 → 통과

반드시 아래 JSON 형식으로만 응답하세요:
{"score": 숫자, "reason": "판단 근거"}`;

    try {
        const response = await callGroqWithFallback(STAGE2_MODELS, prompt);
        const parsed = parseJsonSafely(response);

        if (parsed && typeof parsed.score === 'number') {
            return {
                score: Math.min(10, Math.max(1, parsed.score)),
                pass: parsed.score >= 5
            };
        }
    } catch (error) {
        console.error(`   Stage2 분석 실패: ${newsItem.title.slice(0, 30)}...`);
    }

    // 분석 실패 시 통과 (안전하게)
    return { score: 5, pass: true };
}

/**
 * Stage 3: 최종 분류 (핵심 vs 참고)
 * @param {Object} newsItem - 뉴스 아이템
 * @returns {Promise<{score: number, keywords: string[], category: string}>}
 */
export async function stage3Analysis(newsItem) {
    const prompt = `당신은 취업준비생을 위한 한국 경제/산업 뉴스 분석 전문가입니다.

## 분석 대상
제목: ${newsItem.title}
설명: ${newsItem.description || '(없음)'}
산업: ${newsItem.industry || '(미분류)'}

## 점수 기준 (1-10점)

### 1-3점: 무관한 뉴스 → 제외
- 스포츠, 연예, 정치(단순 정쟁), 사건사고
- 광고성/홍보성 콘텐츠
- 단순 이벤트/경품/할인 소식
- 추적 산업(반도체, 자동차, 조선, 방산, IT)과 무관

### 4점: 경계 뉴스 → 제외
- 산업 관련이지만 투자/취업에 실질적 도움 없음
- 단순 인사이동, 사소한 행사 참가
- 인터뷰/칼럼/의견 기사
- 이미 알려진 정보의 반복

### 5-6점: 참고 뉴스 → 저장
- 산업 동향 파악에 유용
- 신제품/서비스 출시
- 1000억원 미만 투자/계약
- 채용 계획/공고
- 컨퍼런스/전시회 주요 발표

### 7-8점: 중요 뉴스 → 핵심 저장
- 분기/연간 실적 발표
- 대형 수주 (수천억~조원)
- 공장/설비 증설 발표
- 핵심 기술/특허 획득
- 주요 파트너십 체결
- 임원급 인사 변동

### 9-10점: 핵심 뉴스 → 핵심 저장
- 시장에 큰 영향 미치는 뉴스
- M&A, 합병, 분할
- 정부 대규모 정책 (보조금, 규제)
- CEO 교체, 대규모 구조조정
- 조 단위 투자/수주

## 응답 형식
반드시 아래 JSON으로만 응답:
{"score": 숫자, "keywords": ["키워드1", "키워드2"], "reason": "한줄 판단근거"}`;

    try {
        const response = await callGroqWithFallback(STAGE3_MODELS, prompt);
        const parsed = parseJsonSafely(response);

        if (parsed && typeof parsed.score === 'number') {
            const score = Math.min(10, Math.max(1, parsed.score));
            const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [];

            return {
                score,
                keywords,
                category: score >= 7 ? 'critical' : 'reference'
            };
        }
    } catch (error) {
        console.error(`   Stage3 분석 실패: ${newsItem.title.slice(0, 30)}...`);
    }

    // 분석 실패 시 참고로 분류
    return { score: 5, keywords: [], category: 'reference' };
}

// 모델 목록 export (테스트용)
export { STAGE1_MODELS, STAGE2_MODELS, STAGE3_GROQ_PRIMARY, STAGE3_GROQ_SECONDARY };
