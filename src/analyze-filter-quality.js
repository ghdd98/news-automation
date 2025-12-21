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

async function analyzeFilterQuality() {
    console.log('\n🔍 필터링 품질 분석 시작...\n');
    console.log('='.repeat(60));

    // 1. 수집
    const [naverNews, googleNews, globalNews, rssNews] = await Promise.all([
        collectNaverNews(INDUSTRY_KEYWORDS),
        collectGoogleNews(INDUSTRY_KEYWORDS),
        collectGlobalNews(),
        collectNaverRss()
    ]);

    const allNews = [...naverNews, ...googleNews, ...globalNews, ...rssNews];
    console.log(`\n📰 수집 완료: ${allNews.length}개`);

    // 2. 중복 제거
    const uniqueNews = deduplicateNews(allNews);
    const duplicatesRemoved = allNews.length - uniqueNews.length;
    console.log(`🔄 중복 제거: ${duplicatesRemoved}개 제거 → ${uniqueNews.length}개 남음`);

    // 3. 키워드 필터
    const keywordFiltered = filterByKeywords(uniqueNews);
    const keywordExcluded = uniqueNews.filter(n => !keywordFiltered.includes(n));
    console.log(`🔍 키워드 필터: ${keywordExcluded.length}개 제외 → ${keywordFiltered.length}개 통과`);

    // 4. 기업명 필터
    const companyFiltered = filterByCompany(keywordFiltered);
    const companyExcluded = keywordFiltered.filter(n => !companyFiltered.includes(n));
    console.log(`🏢 기업명 필터: ${companyExcluded.length}개 제외 → ${companyFiltered.length}개 통과`);

    // 5. 사전 필터 (주요 언론사 + 키워드)
    const preFiltered = preFilterNews(companyFiltered);
    const preExcluded = companyFiltered.filter(n => !preFiltered.find(p => p.link === n.link));
    console.log(`🎯 사전 필터: ${preExcluded.length}개 제외 → ${preFiltered.length}개 통과`);

    // ========== 품질 분석 보고서 생성 ==========
    let report = `========================================\n`;
    report += `📊 필터링 품질 분석 보고서\n`;
    report += `생성 시간: ${new Date().toLocaleString('ko-KR')}\n`;
    report += `========================================\n\n`;

    // 통계 요약
    report += `[ 📈 필터링 통계 ]\n`;
    report += `─────────────────────────────────────\n`;
    report += `수집: ${allNews.length}개\n`;
    report += `├─ 중복 제거: -${duplicatesRemoved}개\n`;
    report += `├─ 키워드 필터: -${keywordExcluded.length}개\n`;
    report += `├─ 기업명 필터: -${companyExcluded.length}개 (스포츠/연예 제외)\n`;
    report += `└─ 사전 필터: -${preExcluded.length}개 (비주류 언론사/키워드 미매칭)\n`;
    report += `최종 통과: ${preFiltered.length}개\n\n`;

    // 키워드 필터에서 제외된 샘플
    report += `\n[ 🔍 키워드 필터 제외 샘플 (${Math.min(20, keywordExcluded.length)}/${keywordExcluded.length}개) ]\n`;
    report += `─────────────────────────────────────\n`;
    report += `※ 산업 키워드(자동차, 반도체, 조선 등)가 없어서 제외됨\n\n`;
    keywordExcluded.slice(0, 20).forEach((item, i) => {
        report += `${i + 1}. ${item.title}\n`;
        report += `   출처: ${item.source || 'unknown'}\n\n`;
    });

    // 사전 필터에서 제외된 샘플 (비주류 언론사)
    report += `\n[ 🎯 사전 필터 제외 샘플 (${Math.min(30, preExcluded.length)}/${preExcluded.length}개) ]\n`;
    report += `─────────────────────────────────────\n`;
    report += `※ 주요 언론사가 아니거나, 우선순위 키워드/기업명이 없어서 제외됨\n\n`;
    preExcluded.slice(0, 30).forEach((item, i) => {
        const source = item.publisher || item.source || 'unknown';
        report += `${i + 1}. [${source}] ${item.title}\n`;
        report += `   Link: ${item.link}\n\n`;
    });

    // 최종 통과 뉴스 샘플
    report += `\n[ ✅ 최종 통과 샘플 (${Math.min(20, preFiltered.length)}/${preFiltered.length}개) ]\n`;
    report += `─────────────────────────────────────\n`;
    preFiltered.slice(0, 20).forEach((item, i) => {
        const priority = item.priorityKeyword ? `[${item.priorityKeyword}]` : '';
        report += `${i + 1}. ${item.title} ${priority}\n`;
    });

    // 파일 저장
    const filename = `filter_quality_report_${new Date().toISOString().slice(0, 10)}.txt`;
    fs.writeFileSync(filename, report, 'utf-8');

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ 품질 분석 보고서 저장: ${filename}`);
    console.log(`${'='.repeat(60)}\n`);

    return { preFiltered, preExcluded, keywordExcluded };
}

analyzeFilterQuality();
