import dotenv from 'dotenv';
dotenv.config();

import { collectNaverNews } from './collectors/naverApi.js';
import { collectGoogleNews } from './collectors/googleRss.js';
import { preFilterNews } from './filters/preFilter.js';

async function debugShipbuildingFilter() {
    console.log('\n========================================');
    console.log('🔍 조선 산업 필터링 디버그');
    console.log('========================================\n');

    const testKeywords = {
        조선: ['삼성중공업', 'LNG운반선', '현대중공업', 'HD현대']
    };

    console.log('📡 [수집 단계]...');
    const [naverNews, googleNews] = await Promise.all([
        collectNaverNews(testKeywords),
        collectGoogleNews(testKeywords)
    ]);

    console.log(`\n📊 수집 결과: 네이버 ${naverNews.length}개 + 구글 ${googleNews.length}개`);

    const allNews = [...naverNews, ...googleNews];

    console.log('\n📡 [필터링 단계]...');
    const filtered = preFilterNews(allNews);

    console.log(`\n📊 필터링 결과: ${allNews.length}개 → ${filtered.length}개`);

    // 필터링 통과한 뉴스의 언론사 확인
    console.log('\n✅ 필터링 통과한 뉴스:');
    filtered.slice(0, 20).forEach((news, idx) => {
        console.log(`\n[${idx + 1}] ${news.title.slice(0, 50)}...`);
        console.log(`    언론사: ${news.publisher || '(없음)'}`);
        console.log(`    링크: ${news.link?.slice(0, 60)}...`);
    });

    // 필터링에서 탈락한 뉴스 샘플
    const rejected = allNews.filter(n => !filtered.includes(n));
    console.log(`\n❌ 필터링에서 탈락한 뉴스 샘플 (10개):`);
    rejected.slice(0, 10).forEach((news, idx) => {
        console.log(`\n[${idx + 1}] ${news.title.slice(0, 50)}...`);
        console.log(`    언론사: ${news.publisher || '(없음)'}`);
        console.log(`    링크: ${news.link?.slice(0, 60)}...`);
    });

    console.log('\n✅ 디버그 완료');
}

debugShipbuildingFilter();
