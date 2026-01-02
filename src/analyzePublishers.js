import dotenv from 'dotenv';
dotenv.config();

import { collectGoogleNews } from './collectors/googleRss.js';

async function analyzeGooglePublishers() {
    console.log('\n========================================');
    console.log('🔍 구글 RSS Publisher 분석');
    console.log('========================================\n');

    // 몇 가지 산업만 샘플로 테스트
    const testKeywords = {
        조선: ['삼성중공업', '현대중공업', 'LNG운반선'],
        방산: ['한화에어로스페이스', 'LIG넥스원'],
        반도체: ['삼성전자', 'SK하이닉스']
    };

    const googleNews = await collectGoogleNews(testKeywords);

    // Publisher 통계
    const publisherCounts = {};
    googleNews.forEach(news => {
        const pub = news.publisher || '(없음)';
        publisherCounts[pub] = (publisherCounts[pub] || 0) + 1;
    });

    // 정렬하여 출력
    const sorted = Object.entries(publisherCounts)
        .sort((a, b) => b[1] - a[1]);

    console.log('\n📊 구글 RSS Publisher 통계 (상위 30개):');
    console.log('─'.repeat(50));
    sorted.slice(0, 30).forEach(([pub, count], idx) => {
        console.log(`${String(idx + 1).padStart(2)}. ${pub}: ${count}개`);
    });

    console.log('\n✅ 분석 완료');
}

analyzeGooglePublishers();
