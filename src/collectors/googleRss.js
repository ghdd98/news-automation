import Parser from 'rss-parser';

const parser = new Parser({
    customFields: {
        item: ['media:content', 'content:encoded']
    }
});

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
 * 여러 키워드로 한국 Google 뉴스 수집
 */
export async function collectGoogleNews(keywordsByIndustry) {
    const allNews = [];
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);  // 24시간 전

    for (const [industry, keywords] of Object.entries(keywordsByIndustry)) {
        console.log(`🌍 [Google RSS] ${industry} 산업 뉴스 수집 중...`);

        // 모든 키워드 검색
        for (const keyword of keywords) {
            const news = await searchGoogleNews(keyword);

            // 상위 40개까지 수집 + 24시간 이내만
            for (const item of news.slice(0, 40)) {
                if (item.pubDate && item.pubDate > yesterday) {
                    allNews.push({
                        ...item,
                        industry,
                        searchKeyword: keyword
                    });
                }
            }

            // 차단 방지를 위해 1초 대기
            await sleep(1000);
        }
    }

    console.log(`✅ [Google RSS 국내] 총 ${allNews.length}개 수집 (24시간 이내)`);
    return allNews;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default { searchGoogleNews, collectGoogleNews };
