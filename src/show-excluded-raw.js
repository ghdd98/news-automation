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

// 설정
import INDUSTRY_KEYWORDS from './config/keywords.js';

// 제외 패턴
const EXCLUDE_PATTERNS = [
    /\[광고\]/i, /\[AD\]/i, /\[PR\]/i, /\[후원\]/i, /\[협찬\]/i,
    /이벤트 참여/, /경품 응모/, /할인 쿠폰/, /세일 기간/, /특가 행사/,
    /드라마 출연/, /예능 프로그램/, /아이돌 그룹/, /걸그룹/, /보이그룹/,
    /연기자/, /연기력/, /연예인/, /셀럽/, /스타 화보/, /팬덤/,
    /콘서트 개최/, /팬미팅/, /앨범 발매/, /음원 차트/,
    /축구 경기/, /야구 경기/, /농구 경기/, /올림픽 출전/, /월드컵/,
    /포토뉴스/, /\[포토\]/, /\[영상\]/, /\[움짤\]/,
    /오늘의 운세/, /오늘의 날씨/, /별자리 운세/,
    /맛집 추천/, /여행지 추천/, /패션 스타일/, /뷰티 팁/,
    /아파트 분양/, /청약 일정/, /전세 시세/, /월세 가격/,
    /국회 본회의/, /여당 의원/, /야당 대표/, /대통령 발언/,
    /수능 시험/, /대입 전형/, /입시 설명회/,
    /복권 당첨/, /로또 번호/
];

const BUSINESS_KEYWORDS = [
    '실적', '매출', '영업이익', '순이익', '분기', '연간', '흑자', '적자',
    '수주', '계약', '협약', 'MOU', '파트너십', '조원', '억원',
    '인수', '합병', 'M&A', '분할', '상장', 'IPO', '지분',
    '투자', '증자', '배당', '펀딩', '주가', '시가총액',
    '신사업', '신제품', '출시', '개발', '생산', '양산',
    '공장', '설비', '증설', '수출', '납품',
    '대표이사', 'CEO', '사장', '회장', '임원', '인사', '채용',
    '기술', '특허', 'R&D', 'AI', '인공지능', '자율주행', '배터리', '반도체',
    '시장', '점유율', '업계', '산업', '전망', '분석'
];

function hasExcludePattern(text) {
    for (const pattern of EXCLUDE_PATTERNS) {
        if (pattern.test(text)) {
            return pattern.toString();
        }
    }
    return null;
}

function hasBusinessKeyword(text) {
    const lowerText = text.toLowerCase();
    for (const keyword of BUSINESS_KEYWORDS) {
        if (lowerText.includes(keyword.toLowerCase())) {
            return keyword;
        }
    }
    return null;
}

async function showExcludedNewsRaw() {
    console.log('\n========================================');
    console.log('🗑️ 제외된 뉴스 RSS 원본 데이터 예시');
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

    // 분류
    const titleOnlyExcluded = [];
    const withDescExcluded = [];
    const noBusinessExcluded = [];

    for (const item of companyFiltered) {
        const fullText = `${item.title} ${item.description || ''}`;
        const hasDesc = item.description && item.description.length >= 30;

        // 광고성 패턴 체크
        const excludeReason = hasExcludePattern(fullText);
        if (excludeReason) {
            if (hasDesc) {
                withDescExcluded.push({ ...item, reason: excludeReason });
            } else {
                titleOnlyExcluded.push({ ...item, reason: excludeReason });
            }
            continue;
        }

        // 비즈니스 키워드 없음
        if (!item.isGlobal) {
            const hasBusinessContent = hasBusinessKeyword(fullText);
            const hasCompany = item.companies && item.companies.length > 0;

            if (!hasBusinessContent && !hasCompany) {
                noBusinessExcluded.push({ ...item, reason: '비즈니스 키워드 없음' });
            }
        }
    }

    // === 제목만 있는 제외 뉴스 ===
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 [제목만 있는 뉴스] 제외된 예시');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    titleOnlyExcluded.slice(0, 10).forEach((item, i) => {
        console.log(`\n${i + 1}. ─────────────────────────────────────`);
        console.log(`   🚫 제외 이유: ${item.reason}`);
        console.log(`\n   📄 RSS 원본:`);
        console.log(`   {`);
        console.log(`     "title": "${item.title}",`);
        console.log(`     "link": "${item.link}",`);
        console.log(`     "pubDate": "${item.pubDate || '없음'}",`);
        console.log(`     "description": "${item.description || '(비어있음)'}"`);
        console.log(`   }`);
    });

    // === 제목 + 설명 있는 제외 뉴스 ===
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 [제목 + 설명 있는 뉴스] 제외된 예시');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    withDescExcluded.slice(0, 10).forEach((item, i) => {
        const desc = item.description || '';
        console.log(`\n${i + 1}. ─────────────────────────────────────`);
        console.log(`   🚫 제외 이유: ${item.reason}`);
        console.log(`\n   📄 RSS 원본:`);
        console.log(`   {`);
        console.log(`     "title": "${item.title}",`);
        console.log(`     "link": "${item.link}",`);
        console.log(`     "pubDate": "${item.pubDate || '없음'}",`);
        console.log(`     "description": "${desc.substring(0, 200)}${desc.length > 200 ? '...' : ''}"`);
        console.log(`   }`);
    });

    // === 비즈니스 무관 제외 뉴스 ===
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 [비즈니스 무관] 제외된 예시');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    noBusinessExcluded.slice(0, 10).forEach((item, i) => {
        const desc = item.description || '';
        console.log(`\n${i + 1}. ─────────────────────────────────────`);
        console.log(`   🚫 제외 이유: ${item.reason}`);
        console.log(`\n   📄 RSS 원본:`);
        console.log(`   {`);
        console.log(`     "title": "${item.title}",`);
        console.log(`     "link": "${item.link}",`);
        console.log(`     "pubDate": "${item.pubDate || '없음'}",`);
        if (desc.length > 0) {
            console.log(`     "description": "${desc.substring(0, 200)}${desc.length > 200 ? '...' : ''}"`);
        } else {
            console.log(`     "description": "(비어있음)"`);
        }
        console.log(`   }`);
    });

    console.log('\n\n========================================');
    console.log(`📊 총 제외: ${titleOnlyExcluded.length + withDescExcluded.length + noBusinessExcluded.length}개`);
    console.log(`   - 제목만 있음: ${titleOnlyExcluded.length}개`);
    console.log(`   - 설명 포함: ${withDescExcluded.length}개`);
    console.log(`   - 비즈니스 무관: ${noBusinessExcluded.length}개`);
    console.log('========================================\n');
}

showExcludedNewsRaw();
