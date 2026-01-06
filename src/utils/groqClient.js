/**
 * Groq API 클라이언트
 * AI 파이프라인용 모델 관리 (Groq + Gemma 백업)
 */

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// ==================== API 클라이언트 초기화 ====================

// Groq 클라이언트 (API 키가 있을 때만 초기화)
let groq = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });
}

// Gemini API - Gemma 모델들 (Groq 실패 시 백업)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemmaModels = {
    'gemma-3-27b-it': genAI.getGenerativeModel({ model: 'gemma-3-27b-it' }),
    'gemma-3-12b-it': genAI.getGenerativeModel({ model: 'gemma-3-12b-it' }),
    'gemma-3-4b-it': genAI.getGenerativeModel({ model: 'gemma-3-4b-it' }),
};

// ==================== 헬퍼 함수 ====================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 모델 사용 순서 (사용자 지정)
const ALL_MODELS = [
    // 1-3: GPT-OSS 모델
    { type: 'groq', name: 'openai/gpt-oss-120b' },
    { type: 'groq', name: 'openai/gpt-oss-20b' },
    { type: 'groq', name: 'openai/gpt-oss-safeguard-20b' },
    // 4-5: Kimi 모델
    { type: 'groq', name: 'moonshotai/kimi-k2-instruct' },
    { type: 'groq', name: 'moonshotai/kimi-k2-instruct-0905' },
    // 6: Llama 3.3
    { type: 'groq', name: 'llama-3.3-70b-versatile' },
    // 7: Qwen
    { type: 'groq', name: 'qwen/qwen3-32b' },
    // 8: Google Gemma (중간 백업)
    { type: 'gemma', name: 'gemma-3-27b-it' },
    // 9-10: Llama 4
    { type: 'groq', name: 'meta-llama/llama-4-maverick-17b-128e-instruct' },
    { type: 'groq', name: 'meta-llama/llama-4-scout-17b-16e-instruct' },
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
                    // Groq API 키가 없으면 스킵
                    if (!groq) {
                        console.log(`   ⚠️ GROQ_API_KEY 없음, 다음 모델로...`);
                        currentModelIndex = idx + 1;
                        break;
                    }
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
                    const model = gemmaModels[modelInfo.name];
                    const result = await model.generateContent(prompt);
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
    const prompt = `뉴스 분석. 중요도 1-10점 평가.

제목: ${newsItem.title}
설명: ${(newsItem.description || '').slice(0, 100)}

점수기준:
1-4: 무관/광고/정치정쟁/연예
5-6: 참고(동향,신제품,소규모투자)
7-8: 중요(실적,대형수주,설비증설)
9-10: 핵심(M&A,정부정책,조단위투자)

JSON만 응답: {"s":점수,"k":["키워드1","키워드2"]}`;

    try {
        const response = await callGroqWithFallback(STAGE3_MODELS, prompt);
        const parsed = parseJsonSafely(response);

        // 새 형식: {"s": 점수, "k": ["키워드"]} 또는 기존 형식 지원
        if (parsed && (typeof parsed.s === 'number' || typeof parsed.score === 'number')) {
            const score = Math.min(10, Math.max(1, parsed.s || parsed.score));
            const keywords = Array.isArray(parsed.k) ? parsed.k.slice(0, 5) :
                Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [];

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
export { ALL_MODELS };
