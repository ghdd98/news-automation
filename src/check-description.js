import dotenv from 'dotenv';
dotenv.config();

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

async function checkDescriptions() {
    console.log('\n🔍 Description 누락 여부 확인 중...\n');

    // 수집
    const [naverNews, googleNews, globalNews, rssNews] = await Promise.all([
        collectNaverNews(INDUSTRY_KEYWORDS),
        collectGoogleNews(INDUSTRY_KEYWORDS),
        collectGlobalNews(),
        collectNaverRss()
    ]);

    const allNews = [...naverNews, ...googleNews, ...globalNews, ...rssNews];
    const uniqueNews = deduplicateNews(allNews);

    // 필터링 적용 (최종 필터링된 결과만 확인하면 되므로)
    const keywordFiltered = filterByKeywords(uniqueNews);
    const companyFiltered = filterByCompany(keywordFiltered);
    const preFiltered = preFilterNews(companyFiltered);

    const emptyDesc = preFiltered.filter(item => !item.description || item.description.trim() === '');
    const shortDesc = preFiltered.filter(item => item.description && item.description.trim().length < 20);

    console.log(`\n📊 결과:`);
    console.log(`- 전체 통과 뉴스: ${preFiltered.length}개`);
    console.log(`- 설명(Description) 없음: ${emptyDesc.length}개`);
    console.log(`- 설명이 너무 짧음 (<20자): ${shortDesc.length}개`);

    if (emptyDesc.length > 0) {
        console.log('\n❌ [설명 없는 뉴스 예시]');
        emptyDesc.slice(0, 5).forEach(item => {
            console.log(`- [${item.source}] ${item.title}`);
            console.log(`  Link: ${item.link}`);
        });
    }

    if (shortDesc.length > 0) {
        console.log('\n⚠️ [설명이 짧은 뉴스 예시]');
        shortDesc.slice(0, 5).forEach(item => {
            console.log(`- [${item.source}] ${item.title} (${item.description.length}자)`);
            console.log(`  Desc: ${item.description}`);
        });
    }

    if (emptyDesc.length === 0 && shortDesc.length === 0) {
        console.log('\n✅ 모든 뉴스에 설명이 포함되어 있습니다.');
    }
}

checkDescriptions();
