/**
 * URL 도메인 기반 언론사 매핑 유틸리티
 */

const DOMAIN_MAP = {
    // 1순위: 주요 경제지
    'hankyung.com': '한국경제',
    'mk.co.kr': '매일경제',
    'sedaily.com': '서울경제',
    'yonhapnews.co.kr': '연합뉴스',
    'yonhapnewstv.co.kr': '연합뉴스TV',
    'yna.co.kr': '연합뉴스',

    // IT/산업
    'etnews.com': '전자신문',
    'thelec.kr': '더일렉',
    'zdnet.co.kr': '지디넷코리아',
    'mt.co.kr': '머니투데이',
    'asiae.co.kr': '아시아경제',
    'biz.chosun.com': '조선비즈',
    'heraldcorp.com': '헤럴드경제',
    'fnnews.com': '파이낸셜뉴스',
    'edaily.co.kr': '이데일리',
    'ddaily.co.kr': '디지털데일리',
    'irobotnews.com': '로봇신문',

    // 주요 일간지 (동아일보만 유지)
    'donga.com': '동아일보',

    // 방송사
    'kbs.co.kr': 'KBS',
    'imnews.imbc.com': 'MBC',
    'sbs.co.kr': 'SBS',
    'jtbc.co.kr': 'JTBC',
    'ytn.co.kr': 'YTN',

    // 해외 (Google RSS용)
    'bloomberg.com': 'Bloomberg',
    'reuters.com': 'Reuters',
    'wsj.com': 'WSJ',
    'ft.com': 'Financial Times',
    'cnbc.com': 'CNBC',
    'techcrunch.com': 'TechCrunch',
    'theverge.com': 'The Verge'
};

/**
 * URL에서 언론사 이름 추출
 * @param {string} url - 뉴스 링크
 * @returns {string} 언론사 이름 또는 빈 문자열
 */
export function getPublisherFromUrl(url) {
    if (!url) return '';
    const lowerUrl = url.toLowerCase();

    for (const [domain, name] of Object.entries(DOMAIN_MAP)) {
        if (lowerUrl.includes(domain)) {
            return name;
        }
    }
    return '';
}

export default { getPublisherFromUrl };
