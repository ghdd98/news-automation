/**
 * 2단계 AI 파이프라인 필터 (간소화 버전)
 * - Stage 1: 경계 분석 (1-4점 제거, 5+ 통과) - qwen3-32b
 * - Stage 2: 최종 분류 (핵심 vs 참고) - gpt-oss-120b
 */

import { stage2Analysis, stage3Analysis } from '../utils/groqClient.js';
import dotenv from 'dotenv';

dotenv.config();

// ==================== 헬퍼 함수 ====================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 2단계 파이프라인 ====================

/**
 * Stage 1: 경계 분석 (1-4점 제거, 5+ 통과)
 * 기존 Stage 2를 Stage 1로 변경
 */
async function runStage1(newsItems) {
  console.log(`\n🎯 [Stage 1] 경계 분석 시작 (${newsItems.length}개)`);
  console.log(`   📍 모델: qwen/qwen3-32b (백업: llama-4-scout, kimi-k2)`);
  console.log(`   📍 기준: 1-4점 제거, 5점 이상 통과`);

  const passed = [];
  const excluded = [];
  let processed = 0;

  for (const item of newsItems) {
    try {
      const result = await stage2Analysis(item);

      if (result.pass) {
        passed.push({ ...item, stage1Score: result.score });
      } else {
        excluded.push(item);
      }

      processed++;
      if (processed % 30 === 0) {
        console.log(`   처리 중... ${processed}/${newsItems.length} (통과: ${passed.length}, 제외: ${excluded.length})`);
      }

      // Rate limit 준수 (분당 60개 = 1초 간격)
      await sleep(1000);

    } catch (error) {
      console.error(`   Stage1 에러: ${item.title.slice(0, 30)}...`);
      // 에러 시 안전하게 통과
      passed.push({ ...item, stage1Score: 5 });
    }
  }

  console.log(`   ✅ Stage 1 완료: ${newsItems.length}개 → ${passed.length}개 통과 (${excluded.length}개 제외)`);

  return { passed, excluded };
}

/**
 * Stage 2: 최종 분류 (핵심 vs 참고)
 * 기존 Stage 3를 Stage 2로 변경
 */
async function runStage2(newsItems) {
  console.log(`\n⭐ [Stage 2] 최종 분류 시작 (${newsItems.length}개)`);
  console.log(`   📍 모델: gpt-oss-120b (백업: 20b, safeguard-20b, llama-4-scout)`);
  console.log(`   📍 기준: 7+ = 핵심, 5-6 = 참고`);

  const critical = [];
  const reference = [];
  let processed = 0;

  for (const item of newsItems) {
    try {
      const result = await stage3Analysis(item);

      const enrichedItem = {
        ...item,
        score: result.score,
        keywords: result.keywords
      };

      // 설명이 없는 경우 표시
      if (!item.description || item.description.trim().length < 10) {
        enrichedItem.keywords = [...(enrichedItem.keywords || []), '내용확인필요⚠️'];
      }

      if (result.category === 'critical') {
        critical.push(enrichedItem);
      } else {
        reference.push(enrichedItem);
      }

      processed++;
      if (processed % 20 === 0) {
        console.log(`   처리 중... ${processed}/${newsItems.length} (핵심: ${critical.length}, 참고: ${reference.length})`);
      }

      // Rate limit 준수 (분당 30개 = 2초 간격)
      await sleep(2000);

    } catch (error) {
      console.error(`   Stage2 에러: ${item.title.slice(0, 30)}...`);
      // 에러 시 참고로 분류
      reference.push({ ...item, score: 5, keywords: [] });
    }
  }

  console.log(`   ✅ Stage 2 완료: 핵심 ${critical.length}개, 참고 ${reference.length}개`);

  return { critical, reference };
}

// ==================== 메인 함수 ====================

/**
 * 2단계 AI 파이프라인 실행
 */
export async function filterAndSummarizeWithAI(newsItems) {
  console.log('\n========================================');
  console.log('🤖 2단계 AI 파이프라인 시작');
  console.log(`   📊 입력: ${newsItems.length}개 뉴스`);
  console.log('========================================');

  const startTime = Date.now();

  // Stage 1: 경계 분석 (1-4점 제거)
  const stage1Result = await runStage1(newsItems);

  // Stage 2: 최종 분류 (핵심 vs 참고)
  const stage2Result = await runStage2(stage1Result.passed);

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  console.log('\n========================================');
  console.log('✅ 2단계 AI 파이프라인 완료');
  console.log(`   ⏱️ 소요 시간: ${Math.floor(elapsed / 60)}분 ${elapsed % 60}초`);
  console.log(`   📊 입력: ${newsItems.length}개`);
  console.log(`   🎯 Stage 1 통과: ${stage1Result.passed.length}개`);
  console.log(`   🔥 핵심: ${stage2Result.critical.length}개`);
  console.log(`   📎 참고: ${stage2Result.reference.length}개`);
  console.log('========================================\n');

  return {
    critical: stage2Result.critical.sort((a, b) => b.score - a.score),
    reference: stage2Result.reference.sort((a, b) => b.score - a.score)
  };
}

export default { filterAndSummarizeWithAI };
