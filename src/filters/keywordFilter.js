import INDUSTRY_KEYWORDS from '../config/keywords.js';

/**
 * 1단계: 키워드 기반 필터링 (제목+설명만)
 */
export function matchIndustryKeywords(newsItem) {
    const text = `${newsItem.title} ${newsItem.description}`.toLowerCase();
    const matchedIndustries = [];

    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) {
                matchedIndustries.push({ industry, keyword });
                break;
            }
        }
    }

    return matchedIndustries.length > 0 ? matchedIndustries : null;
}

export function filterByKeywords(newsItems) {
    const filtered = [];

    for (const item of newsItems) {
        // 글로벌 뉴스는 이미 기업명으로 검색되었으므로 바로 통과
        if (item.isGlobal) {
            filtered.push({
                ...item,
                matchedIndustries: [item.originalIndustry || 'Global'],
                matchedKeywords: [item.searchKeyword || '']
            });
            continue;
        }

        // 국내 뉴스는 키워드 매칭
        const matches = matchIndustryKeywords(item);
        if (matches) {
            filtered.push({
                ...item,
                matchedIndustries: matches.map(m => m.industry),
                matchedKeywords: matches.map(m => m.keyword)
            });
        }
    }

    const globalCount = filtered.filter(n => n.isGlobal).length;
    const domesticCount = filtered.length - globalCount;
    console.log(`🔍 [1단계 키워드] ${newsItems.length}개 → ${filtered.length}개 통과 (국내: ${domesticCount}, 해외: ${globalCount})`);
    return filtered;
}

export default { filterByKeywords, matchIndustryKeywords };
