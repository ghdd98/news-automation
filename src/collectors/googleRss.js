import Parser from 'rss-parser';

const parser = new Parser({
    customFields: {
        item: ['media:content', 'content:encoded']
    }
});

// 산업별 해외 대형 기업 검색어 (영어)
const GLOBAL_COMPANIES = {
    '자동차': ['Tesla', 'Toyota', 'Volkswagen', 'GM electric vehicle', 'BYD'],
    '반도체': ['NVIDIA', 'AMD', 'Intel', 'TSMC', 'ASML', 'Qualcomm'],
    '가전/IT': ['Apple', 'Google AI', 'Microsoft', 'Amazon AWS', 'Meta AI'],
    '방산': ['Lockheed Martin', 'Raytheon', 'Northrop Grumman'],
    '조선': ['COSCO shipping', 'Maersk'],
    '한국기업': ['Samsung Electronics', 'SK Hynix', 'Hyundai Motor', 'LG Electronics', 'Naver', 'Kakao']
};

/**
 * Google News RSS로 한국 뉴스 수집
 */
export async function searchGoogleNews(query) {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=ko&gl=KR&ceid=KR:ko`;

    try {
        const feed = await parser.parseURL(url);

        return feed.items.map(item => {
            // Google RSS Title format: "Title - Source Name"
            const lastHyphenIndex = item.title?.lastIndexOf(' - ');
            let title = item.title;
            let publisher = '';

            if (lastHyphenIndex > 0) {
                title = item.title.substring(0, lastHyphenIndex);
                publisher = item.title.substring(lastHyphenIndex + 3);
            }

            return {
                title: title,
                description: item.contentSnippet || item.content || '',
                link: item.link,
                pubDate: new Date(item.pubDate),
                source: 'google-rss-kr',
                publisher: publisher,
                isGlobal: false
            };
        });
    } catch (error) {
        console.error(`Google RSS 수집 오류 (${query}):`, error.message);
        return [];
    }
}

/**
 * 글로벌 뉴스 수집 (영어 - 해외 대형 기업)
 */
export async function searchGlobalNews(query, industry) {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en&gl=US&ceid=US:en`;

    try {
        const feed = await parser.parseURL(url);

        return feed.items.slice(0, 10).map(item => {
            // Google RSS Title format: "Title - Source Name"
            const lastHyphenIndex = item.title?.lastIndexOf(' - ');
            let title = item.title;
            let publisher = '';

            if (lastHyphenIndex > 0) {
                title = item.title.substring(0, lastHyphenIndex);
                publisher = item.title.substring(lastHyphenIndex + 3);
            }

            return {
                title: `🌐 ${title}`,  // 🌐 마커 추가
                description: item.contentSnippet || item.content || '',
                link: item.link,
                pubDate: new Date(item.pubDate),
                source: 'google-rss-global',
                publisher: publisher,
                isGlobal: true,
                originalIndustry: industry,
                searchKeyword: query
            };
        });
    } catch (error) {
        // 조용히 실패 (차단된 URL은 건너뜀)
        return [];
    }
}

/**
 * 여러 키워드로 한국 Google 뉴스 수집
 */
export async function collectGoogleNews(keywordsByIndustry) {
    const allNews = [];

    for (const [industry, keywords] of Object.entries(keywordsByIndustry)) {
        console.log(`🌍 [Google RSS] ${industry} 산업 뉴스 수집 중...`);

        // 모든 키워드 검색 (slice 제거)
        for (const keyword of keywords) {
            const news = await searchGoogleNews(keyword);

            // 상위 20개까지 수집 (개수 증가)
            for (const item of news.slice(0, 20)) {
                allNews.push({
                    ...item,
                    industry,
                    searchKeyword: keyword
                });
            }

            // 차단 방지를 위해 1초 대기 (안전 모드)
            await sleep(1000);
        }
    }

    console.log(`✅ [Google RSS 국내] 총 ${allNews.length}개 수집`);
    return allNews;
}

/**
 * 글로벌 뉴스 수집 (산업별 해외 대형 기업)
 */
export async function collectGlobalNews() {
    const allNews = [];

    console.log(`🌐 [Global RSS] 해외 대형 기업 뉴스 수집 시작...`);

    for (const [industry, companies] of Object.entries(GLOBAL_COMPANIES)) {
        console.log(`   📍 ${industry} 산업...`);

        for (const company of companies) {
            // 해외 뉴스도 10개까지 수집 (기존 5개 -> 함수 내부 slice 확인 필요)
            const news = await searchGlobalNews(company, industry);
            allNews.push(...news);

            // 해외 뉴스도 1초 대기
            await sleep(1000);
        }
    }

    console.log(`✅ [Global RSS] 총 ${allNews.length}개 해외 뉴스 수집`);
    return allNews;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default { searchGoogleNews, collectGoogleNews, collectGlobalNews };
