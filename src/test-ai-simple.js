import dotenv from 'dotenv';
dotenv.config();

import { filterAndSummarizeWithAI } from './filters/aiFilter.js';

async function testAiSimple() {
    console.log('\n🤖 AI 모델 변경 테스트 (gemini-1.5-flash)\n');

    const sampleNews = [
        {
            title: "삼성전자, HBM4 엔비디아 공급 테스트 통과... 주가 상승 기대",
            link: "https://www.hankyung.com/fake-news-1",
            description: "삼성전자가 차세대 고대역폭메모리 HBM4의 엔비디아 품질 테스트를 통과했다는 소식이다. 이는 경쟁사 대비 6개월 앞선 것으로...",
            pubDate: new Date(),
            source: '한국경제',
            isGlobal: false
        },
        {
            title: "현대차, 울산 공장에 2조원 투입 전기차 전용 라인 증설",
            link: "https://www.hankyung.com/fake-news-2",
            description: "현대자동차가 울산 공장에 전기차 전용 라인을 증설하기 위해 2조원을 투자한다.",
            pubDate: new Date(),
            source: '매일경제',
            isGlobal: false
        },
        {
            title: "지역 축제 개최... 가수 임영웅 출연 예정",
            link: "https://www.localnews.com/fake-news-3",
            description: "이번 주말 열리는 지역 축제에 가수 임영웅이 출연하여 무대를 빛낼 예정이다.",
            pubDate: new Date(),
            source: '지역신문',
            isGlobal: false
        }
    ];

    try {
        const result = await filterAndSummarizeWithAI(sampleNews);

        console.log('\n✅ 테스트 결과:');
        if (result.critical.length > 0) {
            const item = result.critical[0];
            console.log(`[Score: ${item.score}] ${item.title}`);
            console.log(`Keywords: ${item.keywords.join(', ')}`);
        } else if (result.reference.length > 0) {
            const item = result.reference[0];
            console.log(`[Score: ${item.score}] ${item.title}`);
            console.log(`Keywords: ${item.keywords.join(', ')}`);
        } else {
            console.log('결과 없음 (Filter됨)');
        }

    } catch (error) {
        console.error('❌ 테스트 실패:', error);
    }
}

testAiSimple();
