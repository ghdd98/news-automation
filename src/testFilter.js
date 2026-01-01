/**
 * 필터링 테스트 스크립트 (AI 분석 제외)
 * - 수집 → 중복 제거 → 사전 필터링까지만 실행
 * - 제목과 description만 저장
 */

import dotenv from 'dotenv';
import fs from 'fs/promises';
dotenv.config();

// 수집기
import { collectNaverNews } from './collectors/naverApi.js';
import { collectGoogleNews } from './collectors/googleRss.js';

// 필터
import { deduplicateNews } from './filters/deduplicator.js';
import { preFilterNews } from './filters/preFilter.js';

// 설정
import INDUSTRY_KEYWORDS from './config/keywords.js';

async function testFiltering() {
    console.log('\n========================================');
    console.log('🧪 필터링 테스트 (AI 분석 제외)');
    console.log(`⏰ ${new Date().toLocaleString('ko-KR')}`);
    console.log('========================================\n');

    try {
        // 1. 뉴스 수집
        console.log('📡 [1단계] 뉴스 수집 중...');
        const [naverNews, googleNews] = await Promise.all([
            collectNaverNews(INDUSTRY_KEYWORDS),
            collectGoogleNews(INDUSTRY_KEYWORDS)
        ]);

        console.log(`\n📊 수집 결과:`);
        console.log(`   네이버 API: ${naverNews.length}개`);
        console.log(`   Google RSS: ${googleNews.length}개`);

        const allNews = [...naverNews, ...googleNews];
        console.log(`   총 수집: ${allNews.length}개`);

        // 2. 중복 제거
        console.log('\n🔄 [2단계] 중복 제거 중...');
        const uniqueNews = deduplicateNews(allNews);

        // 3. 사전 필터링 (AI 분석 없이)
        console.log('\n🎯 [3단계] 사전 필터링 중...');
        const filtered = preFilterNews(uniqueNews);

        // 4. 결과 저장 (제목 + description만)
        console.log('\n💾 [4단계] 테스트 결과 저장 중...');

        const outputDir = 'data';
        await fs.mkdir(outputDir, { recursive: true });

        // 간단한 형식으로 저장
        const testResult = {
            testDate: new Date().toISOString(),
            stats: {
                collected: allNews.length,
                afterDedup: uniqueNews.length,
                afterPreFilter: filtered.length
            },
            news: filtered.map((item, index) => ({
                index: index + 1,
                title: item.title,
                description: item.description || '(설명 없음)',
                publisher: item.publisher || '(언론사 없음)',
                industry: item.industry || '(산업 미분류)'
            }))
        };

        await fs.writeFile(
            `${outputDir}/filter_test_result.json`,
            JSON.stringify(testResult, null, 2),
            'utf-8'
        );

        console.log(`\n✅ 테스트 완료!`);
        console.log(`   📁 결과 파일: data/filter_test_result.json`);
        console.log(`\n📊 요약:`);
        console.log(`   수집: ${allNews.length}개`);
        console.log(`   중복 제거 후: ${uniqueNews.length}개`);
        console.log(`   사전 필터링 후: ${filtered.length}개`);
        console.log(`\n   → AI 분석 대상: ${filtered.length}개 (이전보다 줄어들면 성공!)`);

        // 상위 10개 미리보기
        console.log('\n📰 상위 10개 뉴스 미리보기:');
        filtered.slice(0, 10).forEach((item, i) => {
            console.log(`   ${i + 1}. [${item.industry || '?'}] ${item.title.slice(0, 50)}...`);
        });

    } catch (error) {
        console.error('❌ 테스트 오류:', error.message);
        console.error(error.stack);
    }
}

testFiltering();
