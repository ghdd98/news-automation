/**
 * 중복 뉴스 제거기
 * 제목 유사도 기반 + 국내 뉴스 우선
 */

/**
 * 제목 정규화 (비교용)
 */
function normalizeTitle(title) {
    return title
        .toLowerCase()
        .replace(/🌐/g, '')              // 글로벌 마커 제거
        .replace(/[^\w가-힣]/g, '')      // 특수문자 제거
        .replace(/\s+/g, '');            // 공백 제거
}

/**
 * 두 제목의 유사도 계산 (0~1)
 */
function getSimilarity(title1, title2) {
    const norm1 = normalizeTitle(title1);
    const norm2 = normalizeTitle(title2);

    // 완전 일치
    if (norm1 === norm2) return 1;

    // 포함 관계 체크
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
        return 0.9;
    }

    // 자카드 유사도 (단어 기반)
    const words1 = new Set(title1.split(/\s+/));
    const words2 = new Set(title2.split(/\s+/));

    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return intersection / union;
}

/**
 * 두 뉴스 중 우선순위 결정
 * @returns 우선순위가 높은 뉴스 (남겨야 할 것)
 */
function selectPreferred(existing, newItem) {
    // 1. 국내 뉴스 우선 (해외 뉴스보다)
    if (!existing.isGlobal && newItem.isGlobal) {
        return existing;  // 국내 유지
    }
    if (existing.isGlobal && !newItem.isGlobal) {
        return newItem;   // 국내로 교체
    }

    // 2. 같은 타입이면 최신 뉴스 우선
    if (newItem.pubDate > existing.pubDate) {
        return newItem;
    }

    return existing;
}

/**
 * 중복 뉴스 제거 (스마트 버전)
 * - 제목 유사도 80% 이상이면 중복
 * - 국내 뉴스 우선
 * - 같은 타입이면 최신 우선
 */
export function deduplicateNews(newsItems, threshold = 0.8) {
    const uniqueNews = [];

    for (const item of newsItems) {
        let duplicateIndex = -1;

        for (let i = 0; i < uniqueNews.length; i++) {
            const similarity = getSimilarity(item.title, uniqueNews[i].title);

            if (similarity >= threshold) {
                duplicateIndex = i;
                break;
            }
        }

        if (duplicateIndex === -1) {
            // 중복 아님 → 추가
            uniqueNews.push(item);
        } else {
            // 중복 → 우선순위 비교 후 교체 여부 결정
            const preferred = selectPreferred(uniqueNews[duplicateIndex], item);
            uniqueNews[duplicateIndex] = preferred;
        }
    }

    const globalCount = uniqueNews.filter(n => n.isGlobal).length;
    const domesticCount = uniqueNews.length - globalCount;
    console.log(`🔄 중복 제거: ${newsItems.length}개 → ${uniqueNews.length}개 (국내: ${domesticCount}, 해외: ${globalCount})`);
    return uniqueNews;
}

export default { deduplicateNews };
