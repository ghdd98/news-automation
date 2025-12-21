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

// ==================== 사전 필터 로직 (분석용) ====================
const EXCLUDE_PATTERNS = [
    /\[광고\]/i, /\[AD\]/i, /\[PR\]/i, /\[후원\]/i, /\[협찬\]/i,
    /\[제휴\]/i, /\[파트너\]/i, /sponsored/i, /advertisement/i,
    /이벤트/, /경품/, /할인/, /쿠폰/, /세일/, /특가/, /무료체험/,
    /응모/, /당첨/, /추첨/, /증정/, /사은품/, /프로모션/,
    /쇼핑/, /구매/, /최저가/, /핫딜/, /타임세일/,
    /드라마/, /예능/, /아이돌/, /걸그룹/, /보이그룹/, /가수/,
    /배우/, /연기/, /연예인/, /셀럽/, /스타/, /팬덤/,
    /콘서트/, /팬미팅/, /앨범/, /음원/, /차트/, /컴백/,
    /축구/, /야구/, /농구/, /배구/, /골프대회/, /테니스/,
    /올림픽/, /월드컵/, /리그/, /경기결과/, /선수/, /감독/,
    /포토뉴스/, /화보/, /움짤/, /직캠/, /영상뉴스/,
    /\[포토\]/, /\[영상\]/, /\[움짤\]/, /\[화보\]/,
    /오늘의 운세/, /오늘의 날씨/, /별자리/, /타로/,
    /맛집/, /레시피/, /요리/, /카페/, /여행/, /호텔/,
    /패션/, /뷰티/, /화장품/, /다이어트/,
    /아파트 분양/, /청약/, /전세/, /월세/,
    /대출 금리/, /예금 금리/, /적금 추천/, /재테크/,
    /국회/, /여당/, /야당/, /대통령/, /선거/, /투표/, /공천/,
    /수능/, /대입/, /입시/, /학원/, /과외/
];

const BUSINESS_KEYWORDS = [
    '실적', '매출', '영업이익', '순이익', '분기', '연간', '흑자', '적자',
    '수주', '계약', '협약', 'MOU', '파트너십', '제휴', '조원', '억원',
    '인수', '합병', 'M&A', '분할', '상장', 'IPO', '지분',
    '투자', '증자', '배당', '펀딩', '투자유치',
    '주가', '시가총액', '급등', '급락', '상한가',
    '신사업', '신제품', '출시', '개발', '생산', '양산',
    '공장', '설비', '증설', '생산능력', '수출', '납품',
    '대표이사', 'CEO', '사장', '회장', '임원', '인사', '조직개편', '채용',
    '기술', '특허', 'R&D', 'AI', '인공지능', '자율주행', '배터리', '반도체',
    '시장', '점유율', '경쟁', '업계', '산업', '전망', '분석'
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

/**
 * 필터 품질 분석
 */
async function analyzeFilterQuality() {
    console.log('\n========================================');
    console.log('🔬 사전 필터 품질 분석');
    console.log(`⏰ ${new Date().toLocaleString('ko-KR')}`);
    console.log('========================================\n');

    try {
        // 1. 뉴스 수집
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

        console.log(`\n총 분석 대상: ${companyFiltered.length}개\n`);

        // 2. 분류 분석
        const results = {
            adExcluded: [],
            noBusinessExcluded: [],
            lowQualityExcluded: [],
            passed: []
        };

        for (const item of companyFiltered) {
            const fullText = `${item.title} ${item.description || ''}`;

            // 광고성 패턴 체크
            const excludeMatch = hasExcludePattern(fullText);
            if (excludeMatch) {
                results.adExcluded.push({
                    title: item.title,
                    description: (item.description || '').substring(0, 100),
                    reason: excludeMatch
                });
                continue;
            }

            // 글로벌 뉴스는 바로 통과
            if (item.isGlobal) {
                results.passed.push({
                    title: item.title,
                    description: (item.description || '').substring(0, 100),
                    reason: '글로벌 뉴스'
                });
                continue;
            }

            // 비즈니스 키워드 체크
            const businessMatch = hasBusinessKeyword(fullText);
            const hasCompany = item.companies && item.companies.length > 0;

            if (!businessMatch && !hasCompany) {
                results.noBusinessExcluded.push({
                    title: item.title,
                    description: (item.description || '').substring(0, 100),
                    reason: '비즈니스 키워드 없음'
                });
                continue;
            }

            // 설명문 품질 체크
            if (item.description && item.description.length < 50) {
                if (!(hasCompany && hasBusinessKeyword(item.title))) {
                    results.lowQualityExcluded.push({
                        title: item.title,
                        description: (item.description || '').substring(0, 100),
                        reason: `설명문 ${item.description.length}자 (50자 미만)`
                    });
                    continue;
                }
            }

            results.passed.push({
                title: item.title,
                description: (item.description || '').substring(0, 100),
                matchedKeyword: businessMatch,
                hasCompany: hasCompany
            });
        }

        // 3. 결과 출력
        console.log('\n========================================');
        console.log('📊 분류 결과');
        console.log('========================================');
        console.log(`✅ 통과: ${results.passed.length}개`);
        console.log(`❌ 광고/무관 제외: ${results.adExcluded.length}개`);
        console.log(`❌ 비즈니스 무관: ${results.noBusinessExcluded.length}개`);
        console.log(`❌ 저품질: ${results.lowQualityExcluded.length}개`);

        // 4. 샘플 출력 - 제외된 기사
        console.log('\n\n========================================');
        console.log('🗑️ [제외된 기사 샘플] - 광고/무관');
        console.log('========================================');
        results.adExcluded.slice(0, 5).forEach((item, i) => {
            console.log(`\n${i + 1}. ${item.title}`);
            console.log(`   📝 ${item.description}...`);
            console.log(`   🚫 제외 이유: ${item.reason}`);
        });

        console.log('\n\n========================================');
        console.log('🗑️ [제외된 기사 샘플] - 비즈니스 무관');
        console.log('========================================');
        results.noBusinessExcluded.slice(0, 5).forEach((item, i) => {
            console.log(`\n${i + 1}. ${item.title}`);
            console.log(`   📝 ${item.description}...`);
            console.log(`   🚫 제외 이유: ${item.reason}`);
        });

        // 5. 샘플 출력 - 통과한 기사
        console.log('\n\n========================================');
        console.log('✅ [통과한 기사 샘플]');
        console.log('========================================');
        results.passed.slice(0, 10).forEach((item, i) => {
            console.log(`\n${i + 1}. ${item.title}`);
            console.log(`   📝 ${item.description}...`);
            if (item.matchedKeyword) console.log(`   🔑 매칭 키워드: ${item.matchedKeyword}`);
            if (item.hasCompany) console.log(`   🏢 기업명 매칭됨`);
        });

        console.log('\n\n========================================');
        console.log('📋 분석 완료!');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ 오류:', error);
    }
}

analyzeFilterQuality();
