import dotenv from 'dotenv';
dotenv.config();

import { collectNaverNews } from './collectors/naverApi.js';
import { collectGoogleNews } from './collectors/googleRss.js';

async function debugShipbuildingNews() {
    console.log('\n========================================');
    console.log('🔍 조선 산업 뉴스 디버그');
    console.log('========================================\n');

    // 조선 키워드 일부만 테스트
    const testKeywords = {
        조선: ['삼성중공업', 'LNG운반선', '현대중공업', '한화오션']
    };

    console.log('📡 [네이버 API] 조선 산업 테스트...');
    const naverNews = await collectNaverNews(testKeywords);

    console.log('\n📊 수집된 뉴스:');
    naverNews.slice(0, 10).forEach((news, idx) => {
        console.log(`\n[${idx + 1}] ${news.title}`);
        console.log(`    링크: ${news.link}`);
        console.log(`    발행: ${news.pubDate}`);
    });

    console.log('\n📡 [구글 RSS] 조선 산업 테스트...');
    const googleNews = await collectGoogleNews(testKeywords);

    console.log('\n📊 수집된 뉴스:');
    googleNews.slice(0, 10).forEach((news, idx) => {
        console.log(`\n[${idx + 1}] ${news.title}`);
        console.log(`    언론사: ${news.publisher}`);
        console.log(`    링크: ${news.link}`);
        console.log(`    발행: ${news.pubDate}`);
    });

    console.log('\n✅ 디버그 완료');
}

debugShipbuildingNews();
