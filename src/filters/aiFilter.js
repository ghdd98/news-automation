import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

// 본문 캐시 (같은 URL 재요청 방지)
const contentCache = new Map();

/**
 * 뉴스 본문 가져오기 (캐시 + 재시도)
 */
async function fetchArticleContent(url, retries = 2) {
    // 캐시 확인
    if (contentCache.has(url)) {
        return contentCache.get(url);
    }

    for (let i = 0; i <= retries; i++) {
        try {
            const response = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            const selectors = [
                'article', '.article-body', '.news-content', '.article_body',
                '#articleBodyContents', '.newsct_article', '#newsEndContents',
                '.news_end', '.article_txt', '#articeBody', '.view_cont'
            ];

            for (const selector of selectors) {
                const content = $(selector).text().trim();
                if (content && content.length > 100) {
                    const result = content.substring(0, 2500);
                    contentCache.set(url, result);
                    return result;
                }
            }

            const fallback = $('body').text().trim().substring(0, 1500);
            contentCache.set(url, fallback);
            return fallback;
        } catch (error) {
            if (i < retries) await sleep(500);
        }
    }

    contentCache.set(url, null);
    return null;
}

/**
 * AI로 뉴스 평가 (재시도 로직 포함)
 */
async function analyzeWithAI(newsItem, articleContent, retries = 2) {
    const content = articleContent || newsItem.description || '';

    const prompt = `당신은 취업준비생을 위한 기업 분석가입니다.
아래 뉴스의 중요도를 평가하세요.

[제목] ${newsItem.title}
[본문] ${content}

## 점수 기준

**9-10점**: 기업 가치에 직접적 영향
- 대규모 수주 (수천억~조원)
- 분기/연간 실적 발표
- M&A, 합병, 분할
- CEO 교체, 대규모 구조조정

**7-8점**: 사업 방향에 중요한 영향
- 신사업 진출 발표
- 공장/설비 증설 계획
- 핵심 기술/특허 발표
- 주요 임원 인사

**5-6점**: 알아두면 유용한 정보
- 신제품/서비스 출시
- 일반 투자 유치
- 업계 동향 분석
- 채용 계획/공고

**4점**: 참고 수준
- 일반 기업 소식
- 컨퍼런스/행사 참가
- 업계 전망 기사

**1-3점**: 제외 (기업분석에 무관)
- 연예/스포츠/정치 뉴스
- 광고성 콘텐츠
- 단순 이벤트/행사
- 추적 대상 기업과 무관

JSON 형식으로만 답변:
{"score": 숫자, "keywords": ["키워드1", "키워드2", "키워드3"]}`;

    for (let i = 0; i <= retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    score: Math.min(10, Math.max(1, parsed.score || 4)),
                    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : []
                };
            }

            return { score: 4, keywords: [] };
        } catch (error) {
            if (error.message.includes('429') && i < retries) {
                // Rate limit - 더 오래 대기
                console.log(`   ⏳ Rate limit, ${(i + 1) * 10}초 대기...`);
                await sleep((i + 1) * 10000);
            } else if (i === retries) {
                console.error('AI 분석 오류:', error.message);
                return { score: 4, keywords: [] };
            }
        }
    }

    return { score: 4, keywords: [] };
}

/**
 * 3단계: AI 기반 필터링 (최적화됨)
 */
export async function filterAndSummarizeWithAI(newsItems) {
    const critical = [];
    const reference = [];
    let excluded = 0;

    console.log(`🤖 [3단계 AI] ${newsItems.length}개 뉴스 분석 시작...`);

    let processed = 0;
    for (const item of newsItems) {
        try {
            const articleContent = await fetchArticleContent(item.link);
            const analysis = await analyzeWithAI(item, articleContent);

            const enrichedItem = {
                ...item,
                score: analysis.score,
                keywords: analysis.keywords
            };

            if (analysis.score >= 7) {
                critical.push(enrichedItem);
            } else if (analysis.score >= 4) {
                reference.push(enrichedItem);
            } else {
                excluded++;
            }

            processed++;
            if (processed % 10 === 0) {
                console.log(`   처리 중... ${processed}/${newsItems.length} (핵심: ${critical.length}, 참고: ${reference.length}, 제외: ${excluded})`);
            }

            await sleep(7000);
        } catch (error) {
            console.error(`분석 실패: ${item.title}`, error.message);
            reference.push({ ...item, score: 4, keywords: [] });
        }
    }

    // 캐시 정리
    contentCache.clear();

    console.log(`✅ [3단계 AI] 완료`);
    console.log(`   🔥 핵심: ${critical.length}개`);
    console.log(`   📎 참고: ${reference.length}개`);
    console.log(`   🗑️ 제외: ${excluded}개`);

    return {
        critical: critical.sort((a, b) => b.score - a.score),
        reference: reference.sort((a, b) => b.score - a.score)
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default { filterAndSummarizeWithAI };
