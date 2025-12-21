import Parser from 'rss-parser';

const parser = new Parser();

const RSS_FEEDS = [
    { name: '매일경제', url: 'https://www.mk.co.kr/rss/30000001/' },
    { name: '전자신문', url: 'https://rss.etnews.com/Section901.xml' },
    { name: '더일렉', url: 'https://www.thelec.kr/rss/allArticle.xml' }
];

async function showRssWithContent() {
    console.log('\n========================================');
    console.log('📡 본문/설명이 있는 RSS 기사 예시');
    console.log('========================================\n');

    for (const source of RSS_FEEDS) {
        try {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📰 ${source.name}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

            const feed = await parser.parseURL(source.url);

            // 본문이 있는 기사 5개만 출력
            let count = 0;
            for (const item of feed.items) {
                const content = item.contentSnippet || item.content || item.description || item.summary || '';

                if (content.length >= 50 && count < 5) {
                    count++;
                    console.log(`\n${count}. 📌 ${item.title}`);
                    console.log(`   🔗 ${item.link}`);
                    console.log(`   📅 ${item.pubDate || item.isoDate || '날짜 없음'}`);
                    console.log(`\n   📝 설명 (${content.length}자):`);
                    console.log(`   "${content.substring(0, 300)}${content.length > 300 ? '...' : ''}"`);
                    console.log('');
                }
            }

            if (count === 0) {
                console.log('   ⚠️ 본문이 있는 기사가 없습니다.');
            }

        } catch (error) {
            console.log(`   ❌ 오류: ${error.message}`);
        }
    }

    console.log('\n========================================');
    console.log('📊 분석 완료');
    console.log('========================================\n');
}

showRssWithContent();
