import dotenv from 'dotenv';
import fs from 'fs/promises';
dotenv.config();

// 수집기 (2개 소스: 네이버 API + Google RSS 국내)
import { collectNaverNews } from './collectors/naverApi.js';
import { collectGoogleNews } from './collectors/googleRss.js';
import { collectAllCategoryNews } from './collectors/categoryRss.js';
// 카테고리 뉴스: 경제, 정치, 사회, 해외

// 필터
import { deduplicateNews, deduplicateWithClustering } from './filters/deduplicator.js';
import { preFilterNews } from './filters/preFilter.js';
import { filterAndSummarizeWithAI } from './filters/aiFilter.js';

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
        // 1. 뉴스 수집 (2개 소스: 네이버 API, Google RSS 국내)
        console.log('\n📡 [산업별 뉴스 수집 단계]');
        const [naverNews, googleNews, categoryNews] = await Promise.all([
            collectNaverNews(INDUSTRY_KEYWORDS),
            collectGoogleNews(INDUSTRY_KEYWORDS),
            collectAllCategoryNews()
        ]);

        console.log('\n📊 산업별 수집 결과:');
        console.log(`   🇰🇷 네이버 API: ${naverNews.length}개`);
        console.log(`   🇰🇷 Google RSS: ${googleNews.length}개`);

        const allNews = [...naverNews, ...googleNews];
        console.log(`   ─────────────────`);
        console.log(`   총 산업별 수집: ${allNews.length}개`);

        // 2. 중복 제거
        console.log('\n🔄 [중복 제거]');
        const uniqueNews = deduplicateNews(allNews);

        // 3. 사전 필터링 (광고성/무관 기사 제거, 주요 언론사 필터)
        console.log('\n🎯 [사전 필터링]');
        const preFiltered = preFilterNews(uniqueNews);

        // 3.5. 클러스터링 중복 제거 (유사 뉴스 그룹화, 그룹당 최대 2개)
        console.log('\n📊 [클러스터링 중복 제거]');
        const clusteredNews = deduplicateWithClustering(preFiltered, 2);

        // 4. AI 분석 (3단계 파이프라인: Groq)
        console.log('\n🤖 [AI 분석 단계 - 3단계 파이프라인]');
        const { critical, reference } = await filterAndSummarizeWithAI(clusteredNews);

        // 6. 저장
        console.log('\n💾 [저장 단계]');

        // 6-1. JSON 데이터 저장 (웹 대시보드용)
        const outputDir = 'data';
        await fs.mkdir(outputDir, { recursive: true });

        // 날짜별 백업 및 최신 파일 생성 (한국 시간 기준)
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
        const todayStr = koreaTime.toISOString().split('T')[0];
        const resultData = {
            date: todayStr,
            updatedAt: new Date().toISOString(),
            stats: {
                total: allNews.length,
                top: critical.length,
                ref: reference.length,
                categories: {
                    economy: categoryNews.economy.length,
                    politics: categoryNews.politics.length,
                    society: categoryNews.society.length,
                    global: categoryNews.global.length
                }
            },
            news: {
                top: critical,
                reference: reference
            },
            categories: categoryNews
        };

        // 최신 파일 (웹앱이 읽을 것)
        await fs.writeFile(`${outputDir}/latest_news.json`, JSON.stringify(resultData, null, 2), 'utf-8');
        // 백업 파일 (히스토리용)
        await fs.writeFile(`${outputDir}/news_${todayStr}.json`, JSON.stringify(resultData, null, 2), 'utf-8');
        console.log(`✅ JSON 데이터 저장 완료: data/latest_news.json`);


        // 6-2. 데이터 청소 (15일 이상 된 파일 삭제)
        try {
            const files = await fs.readdir(outputDir);
            const today = new Date();
            const RETENTION_DAYS = 15;

            for (const file of files) {
                if (!file.startsWith('news_') || !file.endsWith('.json')) continue;

                const datePart = file.replace('news_', '').replace('.json', '');
                const fileDate = new Date(datePart);
                const diffTime = Math.abs(today - fileDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > RETENTION_DAYS) {
                    await fs.unlink(`${outputDir}/${file}`);
                    console.log(`🗑️ 오래된 파일 삭제 완료: ${file}`);
                }
            }
        } catch (cleanupError) {
            console.error('⚠️ 데이터 청소 중 오류 발생:', cleanupError.message);
        }

        // Notion/Obsidian 자동 저장 제거됨
        // 웹 대시보드(localhost:3000)에서 체크박스로 선택 후 저장하는 방식으로 변경
        // if (process.env.NOTION_DATABASE_ID) { ... }
        // await saveToObsidian(critical, reference);
        console.log('ℹ️ Notion/Obsidian 자동 저장은 비활성화되었습니다.')
        console.log('   → 웹 대시보드에서 필요한 뉴스만 선택하여 저장하세요.');

        // 완료 보고
        console.log('\n========================================');
        console.log('✅ 뉴스 자동화 완료!');
        console.log(`   🔥 핵심 뉴스: ${critical.length}건`);
        console.log(`   📎 참고 뉴스: ${reference.length}건`);
        console.log('   ─────────────────');
        console.log(`   📊 경제: ${categoryNews.economy.length}건`);
        console.log(`   🏛️ 정치: ${categoryNews.politics.length}건`);
        console.log(`   👥 사회: ${categoryNews.society.length}건`);
        console.log(`   🌐 해외: ${categoryNews.global.length}건`);
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ 실행 중 오류 발생:', error);
        process.exit(1);
    }
}

main();
