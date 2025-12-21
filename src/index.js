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
import { filterAndSummarizeWithAI } from './filters/aiFilter.js';

// 저장
import { saveToNotion } from './exporters/notion.js';
import { saveToObsidian } from './exporters/obsidian.js';

// 설정
import INDUSTRY_KEYWORDS from './config/keywords.js';

/**
 * 메인 실행 함수
 */
async function main() {
    console.log('\n========================================');
    console.log('📰 뉴스 자동화 시스템 시작');
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

        // 5. 3단계: 사전 필터링 (광고성/무관 기사 제거)
        console.log('\n🎯 [사전 필터링]');
        const preFiltered = preFilterNews(companyFiltered);

        // 6. 4단계: AI 분석 (본문 분석)
        console.log('\n🤖 [AI 분석 단계]');
        const { critical, reference } = await filterAndSummarizeWithAI(preFiltered);

        // 6. 저장
        console.log('\n💾 [저장 단계]');

        if (process.env.NOTION_DATABASE_ID) {
            await saveToNotion(critical, true);
            await saveToNotion(reference, false);
        } else {
            console.log('⚠️ NOTION_DATABASE_ID가 설정되지 않아 Notion 저장을 건너뜁니다.');
        }

        await saveToObsidian(critical, reference);

        // 완료 보고
        console.log('\n========================================');
        console.log('✅ 뉴스 자동화 완료!');
        console.log(`   🔥 핵심 뉴스: ${critical.length}건`);
        console.log(`   📎 참고 뉴스: ${reference.length}건`);
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ 실행 중 오류 발생:', error);
        process.exit(1);
    }
}

main();
