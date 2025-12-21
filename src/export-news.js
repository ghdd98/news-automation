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

// 주요 언론사 목록
const MAJOR_SOURCES = [
    'hankyung.com', '한국경제',
    'mk.co.kr', '매일경제',
    'sedaily.com', '서울경제',
    'yonhapnews', 'yna.co.kr', '연합뉴스',
    'etnews.com', '전자신문',
    'thelec.kr', '더일렉',
    'mt.co.kr', '머니투데이',
    'asiae.co.kr', '아시아경제',
    'chosun.com', '조선일보', 'biz.chosun',
    'donga.com', '동아일보',
    'joongang.co.kr', '중앙일보',
    'news1.kr', '뉴스1',
    'newsis.com', '뉴시스'
];

function isMajorSource(link) {
    if (!link) return false;
    const lowerLink = link.toLowerCase();
    return MAJOR_SOURCES.some(source => lowerLink.includes(source.toLowerCase()));
}

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

    // 분류
    const domesticNews = preFiltered.filter(n => !n.isGlobal);
    const globalNewsFiltered = preFiltered.filter(n => n.isGlobal);

    // 주요 언론사만 필터링
    const majorSourceNews = domesticNews.filter(n => isMajorSource(n.link));

    // 텍스트 생성
    const timestamp = new Date().toLocaleString('ko-KR');
    let output = `========================================\n`;
    output += `📰 주요 언론사 뉴스 목록\n`;
    output += `생성 시간: ${timestamp}\n`;
    output += `총 ${majorSourceNews.length}개 (주요 언론사만)\n`;
    output += `========================================\n\n`;

    output += `[ 주요 언론사 뉴스 - ${majorSourceNews.length}개 ]\n`;
    output += `─────────────────────────────────────\n`;
    output += `※ 한국경제, 매일경제, 서울경제, 연합뉴스, 전자신문, 더일렉 등\n\n`;

    majorSourceNews.forEach((item, i) => {
        const priority = item.priorityKeyword ? `[${item.priorityKeyword}]` : '';
        // 언론사 이름 추출
        let source = '';
        if (item.link.includes('hankyung')) source = '한경';
        else if (item.link.includes('mk.co.kr')) source = '매경';
        else if (item.link.includes('sedaily')) source = '서경';
        else if (item.link.includes('yna.co.kr') || item.link.includes('yonhap')) source = '연합';
        else if (item.link.includes('etnews')) source = '전자';
        else if (item.link.includes('thelec')) source = '더일렉';
        else if (item.link.includes('mt.co.kr')) source = '머투';
        else if (item.link.includes('asiae')) source = '아경';
        else if (item.link.includes('chosun')) source = '조선';
        else if (item.link.includes('donga')) source = '동아';
        else if (item.link.includes('joongang')) source = '중앙';
        else if (item.link.includes('news1')) source = '뉴스1';
        else if (item.link.includes('newsis')) source = '뉴시스';

        output += `${i + 1}. [${source}] ${item.title} ${priority}\n`;
        output += `   ${item.link}\n\n`;
    });

    output += `\n\n`;

    // 해외 뉴스
    output += `[ 해외 뉴스 - ${globalNewsFiltered.length}개 ]\n`;
    output += `─────────────────────────────────────\n\n`;

    globalNewsFiltered.forEach((item, i) => {
        const priority = item.priorityKeyword ? `[${item.priorityKeyword}]` : '';
        output += `${i + 1}. ${item.title} ${priority}\n`;
        output += `   ${item.link}\n\n`;
    });

    // 파일 저장
    const filename = `major_news_${new Date().toISOString().slice(0, 10)}.txt`;
    fs.writeFileSync(filename, output, 'utf-8');

    console.log(`\n✅ 저장 완료: ${filename}`);
    console.log(`   주요 언론사: ${majorSourceNews.length}개`);
    console.log(`   해외 뉴스: ${globalNewsFiltered.length}개`);
}

exportFilteredNews();
