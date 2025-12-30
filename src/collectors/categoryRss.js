import Parser from 'rss-parser';

const parser = new Parser({
    customFields: {
        item: ['media:content', 'content:encoded']
    }
});

// 국내 카테고리별 Google News RSS 피드
const DOMESTIC_FEEDS = {
    economy: {
        url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR',
        name: '경제',
        emoji: '📊'
    },
    politics: {
        url: 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4ZERBU0FtdHZLQUFQAQ?hl=ko&gl=KR',
        name: '정치',
        emoji: '🏛️'
    },
    society: {
        url: 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRGx1YlY4U0FtdHZLQUFQAQ?hl=ko&gl=KR',
        name: '사회',
        emoji: '👥'
    }
};

// 해외 뉴스 RSS (영어)
const GLOBAL_FEED = {
    url: 'https://news.google.com/rss?hl=en&gl=US&ceid=US:en',
    name: '해외',
    emoji: '🌐'
};

// 신뢰 언론사 (국내)
const TRUSTED_DOMESTIC = {
    economy: ['한국경제', '한경', 'hankyung', '매일경제', '매경', 'mk.co.kr', '서울경제', 'sedaily'],
    politics: ['조선일보', '조선', 'chosun', '중앙일보', '중앙', 'joongang', '동아일보', '동아', 'donga'],
    society: ['KBS', 'MBC', 'SBS', 'JTBC', 'YTN']
};

// 신뢰 언론사 (해외)
const TRUSTED_GLOBAL = ['Reuters', 'Bloomberg', 'AP News', 'Associated Press', 'AP', 'BBC', 'CNN'];

// 광고성 키워드 패턴
const AD_PATTERNS = [
    /\[광고\]/i, /\[PR\]/i, /\[후원\]/i, /\[제휴\]/i,
    /이벤트/, /할인/, /프로모션/, /무료 체험/, /특가/,
    /sponsored/i, /advertisement/i, /\[AD\]/i
];

/**
 * 광고성 뉴스 체크
 */
function isAdvertisement(title, description) {
    const text = `${title} ${description || ''}`.toLowerCase();
    return AD_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * 언론사 신뢰 체크
 */
function isTrustedSource(publisher, link, category, isGlobal = false) {
    const pubLower = (publisher || '').toLowerCase();
    const linkLower = (link || '').toLowerCase();

    if (isGlobal) {
        return TRUSTED_GLOBAL.some(source =>
            pubLower.includes(source.toLowerCase()) ||
            linkLower.includes(source.toLowerCase())
        );
    }

    const trusted = TRUSTED_DOMESTIC[category] || [];
    return trusted.some(source =>
        pubLower.includes(source.toLowerCase()) ||
        linkLower.includes(source.toLowerCase())
    );
}

/**
 * 국내 카테고리 뉴스 수집
 */
export async function collectCategoryNews(category, maxCount = 20) {
    const feed = DOMESTIC_FEEDS[category];
    if (!feed) {
        console.error(`Unknown category: ${category}`);
        return [];
    }

    console.log(`📰 [카테고리] ${feed.emoji} ${feed.name} 뉴스 수집 중...`);

    try {
        const rss = await parser.parseURL(feed.url);
        const news = [];

        for (const item of rss.items) {
            // 제목에서 언론사 분리
            const lastHyphenIndex = item.title?.lastIndexOf(' - ');
            let title = item.title;
            let publisher = '';

            if (lastHyphenIndex > 0) {
                title = item.title.substring(0, lastHyphenIndex);
                publisher = item.title.substring(lastHyphenIndex + 3);
            }

            const description = item.contentSnippet || item.content || '';

            // 광고 필터
            if (isAdvertisement(title, description)) {
                continue;
            }

            // 신뢰 언론사 필터
            if (!isTrustedSource(publisher, item.link, category, false)) {
                continue;
            }

            news.push({
                title: title,
                description: description,
                link: item.link,
                pubDate: new Date(item.pubDate),
                source: `category-${category}`,
                publisher: publisher,
                category: category,
                categoryName: feed.name,
                categoryEmoji: feed.emoji,
                isGlobal: false
            });

            if (news.length >= maxCount) break;
        }

        console.log(`   ✅ ${feed.name}: ${news.length}개 (신뢰 언론사 기준)`);
        return news;

    } catch (error) {
        console.error(`   ❌ ${feed.name} 수집 오류:`, error.message);
        return [];
    }
}

/**
 * 해외 뉴스 수집
 */
export async function collectGlobalCategoryNews(maxCount = 30) {
    console.log(`📰 [카테고리] ${GLOBAL_FEED.emoji} ${GLOBAL_FEED.name} 뉴스 수집 중...`);

    try {
        const rss = await parser.parseURL(GLOBAL_FEED.url);
        const news = [];

        for (const item of rss.items) {
            // 제목에서 언론사 분리
            const lastHyphenIndex = item.title?.lastIndexOf(' - ');
            let title = item.title;
            let publisher = '';

            if (lastHyphenIndex > 0) {
                title = item.title.substring(0, lastHyphenIndex);
                publisher = item.title.substring(lastHyphenIndex + 3);
            }

            const description = item.contentSnippet || item.content || '';

            // 광고 필터
            if (isAdvertisement(title, description)) {
                continue;
            }

            // 신뢰 언론사 필터
            if (!isTrustedSource(publisher, item.link, null, true)) {
                continue;
            }

            news.push({
                title: title,
                description: description,
                link: item.link,
                pubDate: new Date(item.pubDate),
                source: 'category-global',
                publisher: publisher,
                category: 'global',
                categoryName: '해외',
                categoryEmoji: '🌐',
                isGlobal: true
            });

            if (news.length >= maxCount) break;
        }

        console.log(`   ✅ 해외: ${news.length}개 (신뢰 언론사 기준)`);
        return news;

    } catch (error) {
        console.error(`   ❌ 해외 뉴스 수집 오류:`, error.message);
        return [];
    }
}

/**
 * 모든 카테고리 뉴스 수집
 */
export async function collectAllCategoryNews() {
    console.log('\n📡 [카테고리 뉴스 수집 시작]');

    const [economy, politics, society, global] = await Promise.all([
        collectCategoryNews('economy', 20),
        collectCategoryNews('politics', 20),
        collectCategoryNews('society', 20),
        collectGlobalCategoryNews(30)
    ]);

    console.log('\n📊 카테고리 뉴스 수집 결과:');
    console.log(`   📊 경제: ${economy.length}개`);
    console.log(`   🏛️ 정치: ${politics.length}개`);
    console.log(`   👥 사회: ${society.length}개`);
    console.log(`   🌐 해외: ${global.length}개`);

    return {
        economy,
        politics,
        society,
        global
    };
}

export default { collectCategoryNews, collectGlobalCategoryNews, collectAllCategoryNews };
