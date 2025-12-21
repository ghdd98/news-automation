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

/**
 * 수집 테스트 (AI 분석 전까지만)
 */
async function testCollection() {
    console.log('\n========================================');
    console.log('📰 뉴스 수집 테스트 (AI 분석 제외)');
    console.log(`⏰ ${new Date().toLocaleString('ko-KR')}`);
    console.log('========================================\n');

    try {
        // 1. 뉴스 수집 (4개 소스)
        console.log('\n📡 [수집 단계]');
        const [naverNews, googleNews, globalNews, rssNews] = await Promise.all([
            collectNaverNews(INDUSTRY_KEYWORDS),
            collectGoogleNews(INDUSTRY_KEYWORDS),
            collectGlobalNews(),
            collectNaverRss()
        ]);

        console.log('\n📊 수집 결과:');
        console.log(`   🇰🇷 네이버 API: ${naverNews.length}개`);
        console.log(`   🇰🇷 Google RSS: ${googleNews.length}개`);
        console.log(`   🌐 Global RSS: ${globalNews.length}개`);
        console.log(`   🇰🇷 언론사 RSS: ${rssNews.length}개`);

        const allNews = [...naverNews, ...googleNews, ...globalNews, ...rssNews];
        console.log(`   ─────────────────`);
        console.log(`   총 수집: ${allNews.length}개`);

        // 2. 중복 제거
        console.log('\n🔄 [중복 제거]');
        const uniqueNews = deduplicateNews(allNews);

        // 3. 1단계: 키워드 필터링
        console.log('\n🔍 [필터링 단계]');
        const keywordFiltered = filterByKeywords(uniqueNews);

        // 4. 2단계: 기업명 필터링
        const companyFiltered = filterByCompany(keywordFiltered);

        // 5. 3단계: 사전 필터링
        console.log('\n🎯 [사전 필터링]');
        const preFiltered = preFilterNews(companyFiltered);

        // 결과 요약
        console.log('\n========================================');
        console.log('📊 테스트 결과 요약');
        console.log('========================================');
        console.log(`   초기 수집:     ${allNews.length}개`);
        console.log(`   중복 제거 후:  ${uniqueNews.length}개`);
        console.log(`   키워드 필터:   ${keywordFiltered.length}개`);
        console.log(`   기업명 매칭:   ${companyFiltered.length}개`);
        console.log(`   사전 필터:     ${preFiltered.length}개`);
        console.log(`   → AI 분석 대상: ${preFiltered.length}개`);
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ 오류:', error);
    }
}

testCollection();
