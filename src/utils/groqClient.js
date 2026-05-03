/**
 * AI 뉴스 분석 클라이언트
 * Groq (성능순 fallback) + Google Gemma 4 백업
 * 모델 성능순: gpt-oss-120b → llama-3.3-70b → qwen3-32b → gpt-oss-20b → llama-4-scout → llama-3.1-8b → gemma-4-26b
 */

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// ==================== API 클라이언트 초기화 ====================

// Groq 클라이언트
let groq = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// Google Gemma 4 클라이언트
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemmaModel = genAI.getGenerativeModel({ model: 'gemma-4-26b-a4b-it' });

// ==================== 모델 목록 (성능순) ====================

// 벤치마크 성능순 정렬 (2026.05 기준)
// 1. gpt-oss-120b: MMLU-Pro 90%, 최고 추론 성능 (Production)
// 2. llama-3.3-70b: 안정적 범용 성능 (Production)
// 3. qwen3-32b: 우수한 가성비, 빠른 추론 (Preview)
// 4. gpt-oss-20b: 경량 GPT-OSS (Production)
// 5. llama-4-scout: 멀티모달, 긴 컨텍스트 (Preview)
// 6. llama-3.1-8b: 초경량, 최저 지연시간 (Production)
// 7. gemma-4-26b: 최종 백업 (Google API, RPM 15 / RPD 1.5K)
const ALL_MODELS = [
    { type: 'groq', name: 'openai/gpt-oss-120b' },
    { type: 'groq', name: 'llama-3.3-70b-versatile' },
    { type: 'groq', name: 'qwen/qwen3-32b' },
    { type: 'groq', name: 'openai/gpt-oss-20b' },
    { type: 'groq', name: 'meta-llama/llama-4-scout-17b-16e-instruct' },
    { type: 'groq', name: 'llama-3.1-8b-instant' },
    { type: 'gemma', name: 'gemma-4-26b-a4b-it' },
];

let currentModelIndex = 0;

// ==================== 헬퍼 함수 ====================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parseJsonSafely(text) {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) { }
    return null;
}

// ==================== AI 호출 ====================

async function callWithFallback(prompt, maxRetries = 3) {
    for (let idx = currentModelIndex; idx < ALL_MODELS.length; idx++) {
        const model = ALL_MODELS[idx];

        for (let retry = 0; retry < maxRetries; retry++) {
            try {
                let text = '';

                if (model.type === 'groq') {
                    if (!groq) {
                        currentModelIndex = idx + 1;
                        break;
                    }
                    const response = await groq.chat.completions.create({
                        model: model.name,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.3,
                        max_tokens: 500
                    });
                    text = response.choices[0]?.message?.content || '';
                } else if (model.type === 'gemma') {
                    const result = await gemmaModel.generateContent(prompt);
                    text = result.response.text();
                }

                if (text.trim()) return text;

            } catch (error) {
                const msg = error.message || '';
                const code = error.status || error.code || '';

                // 디버그 로그 (첫 에러만)
                if (idx === currentModelIndex && retry === 0) {
                    console.log(`   🔍 ${model.name}: ${code} ${msg.slice(0, 50)}`);
                }

                // 모델 에러 → 다음 모델
                if (msg.includes('429') || msg.includes('rate') || msg.includes('limit') ||
                    msg.includes('400') || msg.includes('404') || msg.includes('invalid') ||
                    code === 400 || code === 404 || code === 429) {
                    currentModelIndex = idx + 1;
                    break;
                }

                // 재시도
                if (retry < maxRetries - 1) {
                    await sleep(2000);
                } else {
                    currentModelIndex = idx + 1;
                }
            }
        }
    }
    throw new Error('모든 AI 모델 실패');
}

// ==================== 뉴스 분석 ====================

/**
 * 뉴스 분석 (1-10점 + 키워드)
 */
export async function stage3Analysis(newsItem) {
    const prompt = `뉴스 중요도 1-10점.

제목: ${newsItem.title}
설명: ${(newsItem.description || '').slice(0, 100)}

1-4 제외: 정치/사회/연예/스포츠, 광고/홍보, 행사/인터뷰/수상/CSR, 채용/인사(CEO/구조조정 제외), 단순출시(수치없음), 주가/전망 코멘트.
※범죄/폭력/성범죄/살인/갈취/재판/구형/사망/산재/사건사고는 기업명 있어도 1-4 기본.
예외(참고 5-6 가능): 리콜/결함/당국조사·제재·과징금 OR 생산/조업중단·공급차질 OR 손실(억/조)/대형소송 명시 OR CES/MWC 등 주요 테크행사 신기술발표.

7+ 핵심: 실적/가이던스, 수주/계약/공급, 증설/공장/라인/양산, M&A/지분/합병·분할, 정책/규제/보조금/제재.
(가능하면 수치(억/조/%/대) 또는 상대/지분/시행시점 중 1개 이상 명시일 때만 7+)

JSON: {"s":점수,"k":["키워드"]}`;

    try {
        const response = await callWithFallback(prompt);
        const parsed = parseJsonSafely(response);

        if (parsed && (typeof parsed.s === 'number' || typeof parsed.score === 'number')) {
            const score = Math.min(10, Math.max(1, parsed.s || parsed.score));
            const keywords = Array.isArray(parsed.k) ? parsed.k.slice(0, 5) :
                Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [];
            return { score, keywords, category: score >= 7 ? 'critical' : 'reference' };
        }
    } catch (error) {
        console.error(`   분석 실패: ${newsItem.title.slice(0, 30)}...`);
    }

    return { score: 5, keywords: [], category: 'reference' };
}

export { ALL_MODELS };
