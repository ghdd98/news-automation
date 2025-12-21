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

async function showPassedNews() {
    console.log('\n========================================');
    console.log('✅ 필터 통과한 뉴스 예시 (검토용)');
    console.log('========================================\n');

    console.log('📡 뉴스 수집 중...\n');
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

    console.log(`\n✅ 총 ${preFiltered.length}개 기사가 필터를 통과했습니다.`);
    console.log(`   (이 중 원하지 않는 기사가 있는지 검토해 주세요)\n`);

    // 국내 뉴스만 표시 (해외는 이미 기업명으로 검색됨)
    const domesticNews = preFiltered.filter(item => !item.isGlobal);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 [통과한 국내 뉴스] 무작위 30개 예시');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 무작위로 30개 선택
    const shuffled = domesticNews.sort(() => Math.random() - 0.5);

    shuffled.slice(0, 30).forEach((item, i) => {
        const desc = item.description || '';
        const companies = item.companies && item.companies.length > 0
            ? item.companies.map(c => c.name).join(', ')
            : '없음';

        console.log(`\n${i + 1}. ─────────────────────────────────────`);
        console.log(`   📌 ${item.title}`);
        console.log(`   🔗 ${item.link}`);
        console.log(`   🏢 매칭 기업: ${companies}`);
        console.log(`   📅 ${item.pubDate || '날짜 없음'}`);
        if (desc.length > 0) {
            console.log(`   📝 ${desc.substring(0, 150)}${desc.length > 150 ? '...' : ''}`);
        }
    });

    console.log('\n\n========================================');
    console.log('📊 통과한 뉴스 통계');
    console.log('========================================');
    console.log(`   국내 뉴스: ${domesticNews.length}개`);
    console.log(`   해외 뉴스: ${preFiltered.length - domesticNews.length}개`);
    console.log(`   총: ${preFiltered.length}개`);
    console.log('========================================\n');
    console.log('❓ 위 기사 중 원하지 않는 것이 있으면 알려주세요!');
}

showPassedNews();
