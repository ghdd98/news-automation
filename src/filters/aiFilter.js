/**
 * 단일 Stage AI 파이프라인 필터 (최종 간소화 버전)
 * - 하나의 Stage로 1-4점 제외 + 핵심/참고 분류 동시 처리
 * - gpt-oss-120b → 20b → safeguard-20b → llama-4-scout fallback
 */

import { stage3Analysis } from '../utils/groqClient.js';
import dotenv from 'dotenv';

dotenv.config();

// ==================== 헬퍼 함수 ====================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 단일 Stage 파이프라인 ====================

/**
 * 단일 Stage: 필터링 + 분류 동시 처리
 * - 1-4점: 제외
 * - 5-6점: 참고 뉴스
 * - 7-10점: 핵심 뉴스
 */
async function runSingleStage(newsItems) {
  console.log(`\n⭐ [AI 분석] 단일 Stage 시작 (${newsItems.length}개)`);
  console.log(`   📍 모델: gpt-oss-120b → 20b → safeguard-20b → llama-4-scout`);
  console.log(`   📍 기준: 1-4점 제외, 5-6점 참고, 7+ 핵심`);

  const critical = [];
  const reference = [];
  let excluded = 0;
  let processed = 0;

  for (const item of newsItems) {
    try {
      const result = await stage3Analysis(item);

      // 1-4점은 제외
      if (result.score < 5) {
        excluded++;
        processed++;
        if (processed % 50 === 0) {
          console.log(`   처리 중... ${processed}/${newsItems.length} (핵심: ${critical.length}, 참고: ${reference.length}, 제외: ${excluded})`);
        }
        await sleep(2000);
        continue;
      }

      const enrichedItem = {
        ...item,
        score: result.score,
        keywords: result.keywords
      };

      // 설명이 없는 경우 표시
      if (!item.description || item.description.trim().length < 10) {
        enrichedItem.keywords = [...(enrichedItem.keywords || []), '내용확인필요⚠️'];
      }

      // 7점 이상 = 핵심, 5-6점 = 참고
      if (result.category === 'critical') {
        critical.push(enrichedItem);
      } else {
        reference.push(enrichedItem);
      }

      processed++;
      if (processed % 50 === 0) {
        console.log(`   처리 중... ${processed}/${newsItems.length} (핵심: ${critical.length}, 참고: ${reference.length}, 제외: ${excluded})`);
      }

      // Rate limit 준수 (분당 30개 = 2초 간격)
      await sleep(2000);

    } catch (error) {
      console.error(`   AI 분석 에러: ${item.title.slice(0, 30)}...`);
      // 에러 시 참고로 분류
      reference.push({ ...item, score: 5, keywords: [] });
      processed++;
    }
  }

  console.log(`   ✅ AI 분석 완료: ${newsItems.length}개 처리`);
  console.log(`   🔥 핵심: ${critical.length}개, 📎 참고: ${reference.length}개, 🗑️ 제외: ${excluded}개`);

  return { critical, reference, excluded };
}

// ==================== 메인 함수 ====================

/**
 * 단일 Stage AI 파이프라인 실행
 */
export async function filterAndSummarizeWithAI(newsItems) {
  console.log('\n========================================');
  console.log('🤖 단일 Stage AI 파이프라인 시작');
  console.log(`   📊 입력: ${newsItems.length}개 뉴스`);
  console.log('========================================');

  const startTime = Date.now();

  // 단일 Stage 실행
  const result = await runSingleStage(newsItems);

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  console.log('\n========================================');
  console.log('✅ 단일 Stage AI 파이프라인 완료');
  console.log(`   ⏱️ 소요 시간: ${Math.floor(elapsed / 60)}분 ${elapsed % 60}초`);
  console.log(`   📊 입력: ${newsItems.length}개`);
  console.log(`   🔥 핵심: ${result.critical.length}개`);
  console.log(`   📎 참고: ${result.reference.length}개`);
  console.log(`   🗑️ 제외: ${result.excluded}개`);
  console.log('========================================\n');

  return {
    critical: result.critical.sort((a, b) => b.score - a.score),
    reference: result.reference.sort((a, b) => b.score - a.score)
  };
}

export default { filterAndSummarizeWithAI };
