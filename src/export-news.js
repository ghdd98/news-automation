import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';

// 수집기
import { collectNaverNews } from './collectors/naverApi.js';
import { collectGoogleNews, collectGlobalNews } from './collectors/googleRss.js';
import { collectNaverRss } from './collectors/naverRss.js';

// 필터
import { deduplicateNews } from './filters/deduplicator.js';
import { filterByKeywords } from './filters/keywordFilter.js';
import { filterByCompany } from './filters/companyFilter.js';
import { preFilterNews } from './filters/preFilter.js';

// 설정
import INDUSTRY_KEYWORDS from './config/keywords.js';

async function exportFilteredNews() {
    console.log('\n📰 필터링된 뉴스 텍스트 파일 생성 중...\n');

    // 수집 + 필터링
    const [naverNews, googleNews, globalNews, rssNews] = await Promise.all([
        collectNaverNews(INDUSTRY_KEYWORDS),
        collectGoogleNews(INDUSTRY_KEYWORDS),
        collectGlobalNews(),
        collectNaverRss()
    ]);

    const allNews = [...naverNews, ...googleNews, ...globalNews, ...rssNews];
    const uniqueNews = deduplicateNews(allNews);
    const keywordFiltered = filterByKeywords(uniqueNews);
    const companyFiltered = filterByCompany(keywordFiltered);
    const preFiltered = preFilterNews(companyFiltered);

    // preFiltered는 이미 주요 언론사 필터링이 적용된 상태임
    const domesticNews = preFiltered.filter(n => !n.isGlobal);
    const globalNewsFiltered = preFiltered.filter(n => n.isGlobal);

    // 텍스트 생성
    const timestamp = new Date().toLocaleString('ko-KR');
    let output = `========================================\n`;
    output += `📰 주요 언론사 뉴스 목록 (최종 필터링)\n`;
    output += `생성 시간: ${timestamp}\n`;
    output += `총 ${preFiltered.length}개 (국내: ${domesticNews.length}, 해외: ${globalNewsFiltered.length})\n`;
    output += `========================================\n\n`;

    output += `[ 국내 뉴스 - ${domesticNews.length}개 ]\n`;
    output += `─────────────────────────────────────\n`;

    domesticNews.forEach((item, i) => {
        const priority = item.priorityKeyword ? `[${item.priorityKeyword}]` : '';
        const publisher = item.publisher ? `[${item.publisher}]` : '';
        output += `${i + 1}. ${publisher} ${item.title} ${priority}\n`;
        output += `   ${item.link}\n\n`;
    });

    output += `\n\n`;

    output += `[ 해외 뉴스 - ${globalNewsFiltered.length}개 ]\n`;
    output += `─────────────────────────────────────\n`;

    globalNewsFiltered.forEach((item, i) => {
        const priority = item.priorityKeyword ? `[${item.priorityKeyword}]` : '';
        const publisher = item.publisher ? `[${item.publisher}]` : '';
        output += `${i + 1}. ${publisher} ${item.title} ${priority}\n`;
        output += `   ${item.link}\n\n`;
    });

    // 파일 저장
    const filename = `major_news_${new Date().toISOString().slice(0, 10)}.txt`;
    fs.writeFileSync(filename, output, 'utf-8');

    console.log(`\n✅ 저장 완료: ${filename}`);
    console.log(`   국내: ${domesticNews.length}개`);
    console.log(`   해외: ${globalNewsFiltered.length}개`);
}

exportFilteredNews();
