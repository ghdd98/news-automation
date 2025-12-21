import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 모델 폴백 설정 (안정적인 1.5 Flash를 1순위로 사용)
const MODELS = [
  { name: 'gemini-1.5-flash', instance: null }, // RPD 1,500회 (안정적)
  { name: 'gemini-2.0-flash-exp', instance: null } // 최신 모델 (보조)
];

// 모델 인스턴스 초기화
MODELS.forEach(m => {
  m.instance = genAI.getGenerativeModel({ model: m.name });
});

let currentModelIndex = 0;

// 본문 캐시 (같은 URL 재요청 방지)
const contentCache = new Map();

/**
 * 뉴스 본문 가져오기 (캐시 + 재시도)
 */
async function fetchArticleContent(url, retries = 2) {
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
 * AI로 뉴스 평가 (모델 폴백 지원)
 */
async function analyzeWithAI(newsItem, articleContent) {
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

  // 현재 모델부터 시도
  for (let modelIdx = currentModelIndex; modelIdx < MODELS.length; modelIdx++) {
    const currentModel = MODELS[modelIdx];

    for (let retry = 0; retry < 3; retry++) {
      try {
        const result = await currentModel.instance.generateContent(prompt);
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
        const errorMsg = error.message || '';

        // Rate limit 에러 시 모델 전환
        if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate')) {
          if (modelIdx < MODELS.length - 1) {
            console.log(`   ⚠️ ${currentModel.name} 한도 초과, ${MODELS[modelIdx + 1].name}로 전환...`);
            currentModelIndex = modelIdx + 1;
            break; // 다음 모델로 전환
          } else {
            // 모든 모델 한도 초과 - 대기 후 재시도
            console.log(`   ⏳ 모든 모델 한도 초과, ${(retry + 1) * 30}초 대기...`);
            await sleep((retry + 1) * 30000);
          }
        } else if (retry < 2) {
          await sleep(2000);
        } else {
          console.error('AI 분석 오류:', errorMsg);
          return { score: 4, keywords: [] };
        }
      }
    }
  }

  return { score: 4, keywords: [] };
}

/**
 * 3단계: AI 기반 필터링 (모델 폴백 지원)
 */
export async function filterAndSummarizeWithAI(newsItems) {
  const critical = [];
  const reference = [];
  let excluded = 0;

  console.log(`🤖 [3단계 AI] ${newsItems.length}개 뉴스 분석 시작...`);
  console.log(`   📍 사용 모델: ${MODELS[currentModelIndex].name}`);

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
        console.log(`   처리 중... ${processed}/${newsItems.length} (핵심: ${critical.length}, 참고: ${reference.length}, 제외: ${excluded}) [${MODELS[currentModelIndex].name}]`);
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
