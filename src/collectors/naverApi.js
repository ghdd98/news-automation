import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NAVER_API_URL = 'https://openapi.naver.com/v1/search/news.json';

/**
 * 네이버 뉴스 API로 뉴스 검색
 */
export async function searchNaverNews(query, display = 20) {
    try {
        const response = await axios.get(NAVER_API_URL, {
            params: { query, display, sort: 'date' },
            headers: {
                'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
            }
        });

        return response.data.items.map(item => ({
            title: cleanHtml(item.title),
            description: cleanHtml(item.description),
            link: item.originallink || item.link,
            pubDate: new Date(item.pubDate),
            source: 'naver-api'
        }));
    } catch (error) {
        console.error(`네이버 뉴스 검색 오류 (${query}):`, error.message);
        return [];
    }
}

function cleanHtml(text) {
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .trim();
}

export async function collectNaverNews(keywordsByIndustry) {
    const allNews = [];

    for (const [industry, keywords] of Object.entries(keywordsByIndustry)) {
        console.log(`📰 [네이버 API] ${industry} 산업 뉴스 수집 중...`);

        for (const keyword of keywords.slice(0, 3)) {
            const news = await searchNaverNews(keyword, 15);
            for (const item of news) {
                allNews.push({ ...item, industry, searchKeyword: keyword });
            }
            await sleep(100);
        }
    }

    console.log(`✅ [네이버 API] 총 ${allNews.length}개 뉴스 수집 완료`);
    return allNews;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default { searchNaverNews, collectNaverNews };
