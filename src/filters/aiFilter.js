import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 모델 폴백 설정 (27b → 12b → 4b → 1b 순서로 시도)
const MODELS = [
  { name: 'gemma-3-27b-it', instance: null }, // 메인 (고성능)
  { name: 'gemma-3-12b-it', instance: null }, // 1차 백업
  { name: 'gemma-3-4b-it', instance: null },  // 2차 백업 (경량)
  { name: 'gemma-3-1b-it', instance: null }   // 3차 백업 (초경량)
];

let currentModelIndex = 0; // 현재 사용 중인 모델 인덱스

// 모델 인스턴스 초기화
MODELS.forEach(m => {
  m.instance = genAI.getGenerativeModel({ model: m.name });
});

/**
 * 2단계: AI 분석 (개별 뉴스)
 */
async function analyzeWithAI(newsItem, content) {
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
- 핵심 파트너십/계약 체결

**5-6점**: 알아두면 유용한 정보
- 신제품/서비스 출시
- 일반 투자 유치
- 산업 동향/전망 분석 (시장 성장률, 수요 변화 등)
- 정부 정책 변화 (보조금, 규제 등)
- 업계 경쟁 구도 분석
- 채용 계획/공고
- 글로벌 시장 트렌드

**4점**: 참고 수준 (저장됨)
- 일반 기업 소식 (단순 홍보)
- 컨퍼런스/행사 참가 소식
- 인터뷰/인물 기사

**1-3점**: 제외 (저장 안 됨)
- 연예/스포츠/정치 뉴스
- 광고성 콘텐츠
- 단순 이벤트/행사/경품
- 추적 대상 산업과 완전히 무관

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
      // 1. Description 확인
      // 본문 크롤링은 수행하지 않음 (사용자 요청: 속도/토큰 절약 + 누락 시 표시)
      let articleContent = null;
      const delay = 2000; // 2초 대기 (빠른 처리)

      const desc = item.description ? item.description.trim() : '';
      if (desc.length < 10) {
        // 설명이 없으면 AI에게 알릴 대체 텍스트 사용
        articleContent = "본문 요약 내용이 없습니다. 제목을 바탕으로 유추하세요.";
      } else {
        articleContent = desc;
      }

      const analysis = await analyzeWithAI(item, articleContent);

      // 설명이 없었던 경우, 키워드에 표시 추가
      if (desc.length < 10) {
        analysis.keywords.push("내용확인필요⚠️");
      }

      const enrichedItem = {
        ...item,
        score: analysis.score,
        keywords: analysis.keywords
      };

      if (analysis.score >= 7) {
        critical.push(enrichedItem);
      } else if (analysis.score >= 5) {  // 변경: 4점 → 5점 이상만 Reference
        reference.push(enrichedItem);
      } else {
        excluded++;  // 1-4점은 제외
      }

      processed++;
      if (processed % 10 === 0) {
        console.log(`   처리 중... ${processed}/${newsItems.length} (핵심: ${critical.length}, 참고: ${reference.length}, 제외: ${excluded}) [${MODELS[currentModelIndex].name}]`);
      }

      await sleep(delay);
    } catch (error) {
      console.error(`분석 실패: ${item.title}`, error.message);
      reference.push({ ...item, score: 4, keywords: [] });
    }
  }

  // 캐시 정리 (removed)

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
