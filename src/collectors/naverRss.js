import Parser from 'rss-parser';

const parser = new Parser();

// 검증된 RSS 피드 목록 (실제 작동하는 것만)
const RSS_FEEDS = [
    // 경제 전문지
    { name: '한국경제', url: 'https://www.hankyung.com/feed/all-news' },
    { name: '매일경제', url: 'https://www.mk.co.kr/rss/30000001/' },
    { name: '서울경제', url: 'https://www.sedaily.com/RSS/Economy' },
    { name: '머니투데이', url: 'http://rss.moneytoday.co.kr/mt_news.xml' },
    { name: '이데일리', url: 'http://rss.edaily.co.kr/edaily_news.xml' },
    { name: '아시아경제', url: 'https://www.asiae.co.kr/rss/all.htm' },

    // 종합 언론
    { name: '연합뉴스', url: 'https://www.yna.co.kr/rss/economy.xml' },
    { name: '뉴시스', url: 'https://newsis.com/RSS/economy.xml' },

    // IT/산업 전문
    { name: '전자신문', url: 'https://www.etnews.com/rss/Section901.xml' },
    { name: '더일렉', url: 'https://www.thelec.kr/rss/allArticle.xml' }
];

/**
 * 언론사 RSS로 뉴스 수집
 */
export async function collectNaverRss() {
    const allNews = [];
    let successCount = 0;

    for (const feed of RSS_FEEDS) {
        try {
            const parsed = await parser.parseURL(feed.url);
            const items = parsed.items.slice(0, 20);

            for (const item of items) {
                allNews.push({
                    title: item.title || '',
                    description: item.contentSnippet || item.content || '',
                    link: item.link,
                    pubDate: new Date(item.pubDate || Date.now()),
                    source: `rss-${feed.name}`,
                    isGlobal: false
                });
            }
            successCount++;
            console.log(`📡 [RSS] ${feed.name}: ${items.length}개`);
        } catch (error) {
            // 조용히 건너뜀 (차단된 사이트용)
        }

        await sleep(100);
    }

    console.log(`✅ [RSS] ${successCount}/${RSS_FEEDS.length} 언론사, 총 ${allNews.length}개`);
    return allNews;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default { collectNaverRss };
