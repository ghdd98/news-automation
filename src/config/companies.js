// 기업 목록 (한/영 매핑, 대기업 표시)
// ⚠️ 주의: 너무 짧거나 모호한 단어는 오탐지를 일으킬 수 있음
// 예: "한화" → 야구팀, "삼성" → 삼성라이온즈, "LG" → LG트윈스

export const COMPANIES = {
    // 국내 기업
    domestic: {
        자동차: [
            { name: '현대자동차', aliases: ['현대자동차', '현대차', '현대차그룹'], isMajor: true },
            { name: '기아', aliases: ['기아자동차', '기아차'], isMajor: true },
            { name: '현대모비스', aliases: ['현대모비스'], isMajor: true },
            { name: '만도', aliases: ['만도', 'HL만도'], isMajor: false },
            { name: '현대위아', aliases: ['현대위아'], isMajor: false },
            { name: '한온시스템', aliases: ['한온시스템'], isMajor: false }
        ],
        조선: [
            { name: 'HD한국조선해양', aliases: ['HD한국조선해양', 'HD조선해양', 'HD현대'], isMajor: true },
            { name: '삼성중공업', aliases: ['삼성중공업'], isMajor: true },
            { name: '한화오션', aliases: ['한화오션', '대우조선해양'], isMajor: true },
            { name: 'HD현대중공업', aliases: ['HD현대중공업', '현대중공업'], isMajor: true },
            { name: 'HD현대미포', aliases: ['HD현대미포', '현대미포조선'], isMajor: false }
        ],
        방산: [
            { name: '한화에어로스페이스', aliases: ['한화에어로스페이스', '한화에어로', '한화디펜스'], isMajor: true },
            { name: 'LIG넥스원', aliases: ['LIG넥스원', 'LIG넥스'], isMajor: true },
            { name: 'KAI', aliases: ['KAI', '한국항공우주산업', '한국항공우주'], isMajor: true },
            { name: '현대로템', aliases: ['현대로템'], isMajor: true },
            { name: '한화시스템', aliases: ['한화시스템'], isMajor: true },
            { name: '풍산', aliases: ['풍산그룹', '풍산탄약'], isMajor: false }
        ],
        가전: [
            // ⚠️ "삼성", "LG" 단독은 제외 - 스포츠팀과 혼동됨
            { name: '삼성전자', aliases: ['삼성전자', '삼성디스플레이', '삼성SDI', '삼성바이오로직스'], isMajor: true },
            { name: 'LG전자', aliases: ['LG전자', 'LG디스플레이', 'LG에너지솔루션', 'LG화학', 'LG이노텍'], isMajor: true },
            { name: '쿠쿠전자', aliases: ['쿠쿠전자', '쿠쿠홈시스'], isMajor: false },
            { name: '코웨이', aliases: ['코웨이'], isMajor: false }
        ],
        반도체: [
            { name: '삼성전자', aliases: ['삼성전자', '삼성파운드리'], isMajor: true },
            { name: 'SK하이닉스', aliases: ['SK하이닉스', 'SK하이닉스시스템IC'], isMajor: true },
            { name: 'DB하이텍', aliases: ['DB하이텍'], isMajor: false },
            { name: '한미반도체', aliases: ['한미반도체'], isMajor: false },
            { name: '주성엔지니어링', aliases: ['주성엔지니어링', '주성엔지'], isMajor: false },
            { name: '리노공업', aliases: ['리노공업'], isMajor: false },
            { name: '테스', aliases: ['테스나', 'TESK'], isMajor: false }
        ],
        'IT/AI': [
            { name: '네이버', aliases: ['네이버', 'NAVER', '네이버클라우드'], isMajor: true },
            { name: '카카오', aliases: ['카카오', '카카오엔터프라이즈', '카카오뱅크', '카카오페이'], isMajor: true },
            { name: '삼성SDS', aliases: ['삼성SDS'], isMajor: true },
            { name: '쿠팡', aliases: ['쿠팡', '쿠팡이츠'], isMajor: true },
            { name: '토스', aliases: ['토스', '비바리퍼블리카', '토스뱅크', '토스증권'], isMajor: false },
            { name: '크래프톤', aliases: ['크래프톤', 'KRAFTON'], isMajor: false }
        ],
        배터리: [
            { name: 'LG에너지솔루션', aliases: ['LG에너지솔루션', 'LGES'], isMajor: true },
            { name: 'SK온', aliases: ['SK온', 'SK이노베이션'], isMajor: true },
            { name: '삼성SDI', aliases: ['삼성SDI'], isMajor: true },
            { name: '에코프로비엠', aliases: ['에코프로비엠', '에코프로'], isMajor: false },
            { name: '포스코퓨처엠', aliases: ['포스코퓨처엠', '포스코케미칼'], isMajor: false }
        ]
    },

    // 해외 기업 (한글 검색어 매핑)
    global: {
        자동차: [
            { name: 'Tesla', aliases: ['테슬라', 'Tesla', 'TSLA'], isMajor: true },
            { name: 'Toyota', aliases: ['토요타', '도요타', 'Toyota'], isMajor: true },
            { name: 'Volkswagen', aliases: ['폭스바겐그룹', '폭스바겐', 'Volkswagen'], isMajor: true },
            { name: 'GM', aliases: ['GM', '제너럴모터스', 'General Motors'], isMajor: true },
            { name: 'Ford', aliases: ['포드자동차', 'Ford Motor'], isMajor: true },
            { name: 'BYD', aliases: ['BYD', '비야디'], isMajor: true },
            { name: 'Rivian', aliases: ['리비안', 'Rivian'], isMajor: false },
            { name: 'Lucid', aliases: ['루시드모터스', 'Lucid Motors'], isMajor: false }
        ],
        조선: [
            { name: 'CSSC', aliases: ['중국선박집단', 'CSSC', '중국조선'], isMajor: true },
            { name: 'Imabari', aliases: ['이마바리조선', '이마바리'], isMajor: false }
        ],
        방산: [
            { name: 'Lockheed Martin', aliases: ['록히드마틴', 'Lockheed Martin'], isMajor: true },
            { name: 'Raytheon', aliases: ['레이시온', 'RTX', 'Raytheon'], isMajor: true },
            { name: 'Northrop Grumman', aliases: ['노스롭그루먼', 'Northrop Grumman'], isMajor: true },
            { name: 'BAE Systems', aliases: ['BAE시스템즈', 'BAE Systems'], isMajor: true },
            { name: 'General Dynamics', aliases: ['제너럴다이나믹스', 'General Dynamics'], isMajor: true }
        ],
        가전: [
            { name: 'Apple', aliases: ['애플', 'Apple', '아이폰', '아이패드', '맥북'], isMajor: true },
            { name: 'Sony', aliases: ['소니', 'Sony', '플레이스테이션'], isMajor: true },
            { name: 'Dyson', aliases: ['다이슨', 'Dyson'], isMajor: false },
            { name: 'Xiaomi', aliases: ['샤오미', 'Xiaomi'], isMajor: true }
        ],
        반도체: [
            { name: 'NVIDIA', aliases: ['엔비디아', 'NVIDIA', '젠슨황'], isMajor: true },
            { name: 'AMD', aliases: ['AMD', '어드밴스드마이크로디바이스'], isMajor: true },
            { name: 'Intel', aliases: ['인텔', 'Intel'], isMajor: true },
            { name: 'TSMC', aliases: ['TSMC', '대만반도체', '타이완반도체'], isMajor: true },
            { name: 'Qualcomm', aliases: ['퀄컴', 'Qualcomm', '스냅드래곤'], isMajor: true },
            { name: 'ASML', aliases: ['ASML', 'EUV장비'], isMajor: true },
            { name: 'Broadcom', aliases: ['브로드컴', 'Broadcom'], isMajor: true },
            { name: 'Micron', aliases: ['마이크론', 'Micron'], isMajor: true }
        ],
        'IT/AI': [
            { name: 'Google', aliases: ['구글', 'Google', '알파벳', 'Alphabet', '제미나이'], isMajor: true },
            { name: 'Microsoft', aliases: ['마이크로소프트', 'MS', 'Microsoft', '코파일럿'], isMajor: true },
            { name: 'Amazon', aliases: ['아마존', 'Amazon', 'AWS', '아마존웹서비스'], isMajor: true },
            { name: 'Meta', aliases: ['메타', 'Meta', 'META'], isMajor: true },
            { name: 'OpenAI', aliases: ['오픈AI', '오픈에이아이', 'OpenAI', 'ChatGPT', 'GPT'], isMajor: true },
            { name: 'Anthropic', aliases: ['앤트로픽', 'Anthropic', '클로드'], isMajor: true },
            { name: 'xAI', aliases: ['xAI', '그록', 'Grok'], isMajor: false }
        ]
    }
};

// 스포츠팀/연예 관련 제외 키워드 (이 키워드와 함께 나오면 기업 뉴스 아님)
export const EXCLUDE_CONTEXTS = [
    // 야구
    '이글스', '라이온즈', '트윈스', '타이거즈', '베어스', '자이언츠', '히어로즈', '다이노스', '위즈', '랜더스',
    '타자', '투수', '선발', '불펜', '홈런', '안타', '타점', '방어율', '승률', '연패', '연승',
    '외야수', '내야수', '포수', '1루수', '2루수', '3루수', '유격수',
    // 축구
    'FC', '유나이티드', '감독', '이적료', '득점왕', '어시스트',
    // 농구
    '센터', '가드', '포워드', '리바운드', '3점슛',
    // 기타 스포츠
    'KBO', 'K리그', 'KBL', 'KOVO', 'PGA', 'LPGA', 'ATP', 'WTA'
];

// 모든 기업의 별칭 리스트 생성 (검색용)
export function getAllCompanyAliases() {
    const aliases = [];

    for (const type of ['domestic', 'global']) {
        for (const industry of Object.keys(COMPANIES[type])) {
            for (const company of COMPANIES[type][industry]) {
                for (const alias of company.aliases) {
                    aliases.push({
                        alias,
                        name: company.name,
                        industry,
                        isMajor: company.isMajor,
                        isGlobal: type === 'global'
                    });
                }
            }
        }
    }

    return aliases;
}

export default COMPANIES;
