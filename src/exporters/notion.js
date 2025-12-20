import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import { getCompanyEmoji } from '../filters/companyFilter.js';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * 뉴스를 Notion에 저장 (최적화: 병렬 배치 처리)
 */
export async function saveToNotion(newsItems, isCritical = true) {
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!databaseId) {
        console.error('❌ NOTION_DATABASE_ID가 설정되지 않았습니다.');
        return;
    }

    if (newsItems.length === 0) return;

    const label = isCritical ? '🔥 핵심' : '📎 참고';
    console.log(`📝 Notion에 ${label} ${newsItems.length}개 저장 중...`);

    let saved = 0;
    let failed = 0;

    // 3개씩 배치 처리 (속도 향상)
    const batchSize = 3;
    for (let i = 0; i < newsItems.length; i += batchSize) {
        const batch = newsItems.slice(i, i + batchSize);

        const promises = batch.map(async (item) => {
            try {
                const companyEmoji = getCompanyEmoji(item.companies);
                const companyNames = item.companies?.map(c => c.name).join(', ') || '';
                const keywords = item.keywords?.join(', ') || '';
                const titlePrefix = isCritical ? '🔥 ' : '';
                const globalMark = item.isGlobal ? '🌐 ' : '';

                await notion.pages.create({
                    parent: { database_id: databaseId },
                    properties: {
                        '제목': { title: [{ text: { content: `${titlePrefix}${globalMark}${companyEmoji} ${item.title}`.trim().substring(0, 100) } }] },
                        '기업': { rich_text: [{ text: { content: companyNames.substring(0, 100) } }] },
                        '산업': { select: { name: item.matchedIndustries?.[0] || item.industry || 'IT/AI' } },
                        '요약': { rich_text: [{ text: { content: keywords.substring(0, 200) } }] },
                        '관련성': { number: item.score || 5 },
                        'URL': { url: item.link },
                        '날짜': { date: { start: new Date().toISOString().split('T')[0] } },
                        '분류': { select: { name: isCritical ? '핵심' : '참고' } }
                    }
                });
                saved++;
            } catch (error) {
                failed++;
            }
        });

        await Promise.all(promises);
        await sleep(400); // 배치 간 대기
    }

    console.log(`✅ Notion ${label}: ${saved}개 저장 완료${failed > 0 ? `, ${failed}개 실패` : ''}`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default { saveToNotion };
