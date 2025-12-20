// 기업 목록 (한/영 매핑, 대기업 표시)
export const COMPANIES = {
    // 국내 기업
    domestic: {
        자동차: [
            { name: '현대자동차', aliases: ['현대차', '현대자동차'], isMajor: true },
            { name: '기아', aliases: ['기아', '기아차'], isMajor: true },
            { name: '현대모비스', aliases: ['현대모비스'], isMajor: true },
            { name: '만도', aliases: ['만도', 'HL만도'], isMajor: false },
            { name: '현대위아', aliases: ['현대위아'], isMajor: false },
            { name: '한온시스템', aliases: ['한온시스템'], isMajor: false }
        ],
        조선: [
            { name: 'HD한국조선해양', aliases: ['HD한국조선해양', 'HD조선해양'], isMajor: true },
            { name: '삼성중공업', aliases: ['삼성중공업'], isMajor: true },
            { name: '한화오션', aliases: ['한화오션', '대우조선'], isMajor: true },
            { name: 'HD현대중공업', aliases: ['HD현대중공업', '현대중공업'], isMajor: true }
        ],
        방산: [
            { name: '한화에어로스페이스', aliases: ['한화에어로스페이스', '한화에어로'], isMajor: true },
            { name: 'LIG넥스원', aliases: ['LIG넥스원', 'LIG넥스'], isMajor: true },
            { name: 'KAI', aliases: ['KAI', '한국항공우주산업', '한국항공우주'], isMajor: true },
            { name: '현대로템', aliases: ['현대로템'], isMajor: true },
            { name: '한화시스템', aliases: ['한화시스템'], isMajor: true }
        ],
        가전: [
            { name: '삼성전자', aliases: ['삼성전자', '삼성'], isMajor: true },
            { name: 'LG전자', aliases: ['LG전자', 'LG'], isMajor: true },
            { name: '쿠쿠전자', aliases: ['쿠쿠전자', '쿠쿠'], isMajor: false },
            { name: '코웨이', aliases: ['코웨이'], isMajor: false }
        ],
        반도체: [
            { name: '삼성전자', aliases: ['삼성전자', '삼성'], isMajor: true },
            { name: 'SK하이닉스', aliases: ['SK하이닉스', 'SK하이닉스'], isMajor: true },
            { name: 'DB하이텍', aliases: ['DB하이텍'], isMajor: false },
            { name: '한미반도체', aliases: ['한미반도체'], isMajor: false },
            { name: '주성엔지니어링', aliases: ['주성엔지니어링', '주성엔지'], isMajor: false }
        ],
        'IT/AI': [
            { name: '네이버', aliases: ['네이버', 'NAVER'], isMajor: true },
            { name: '카카오', aliases: ['카카오'], isMajor: true },
            { name: '삼성SDS', aliases: ['삼성SDS'], isMajor: true },
            { name: '쿠팡', aliases: ['쿠팡'], isMajor: true },
            { name: '토스', aliases: ['토스', '비바리퍼블리카'], isMajor: false },
            { name: '크래프톤', aliases: ['크래프톤'], isMajor: false }
        ]
    },

    // 해외 기업 (한글 검색어 매핑)
    global: {
        자동차: [
            { name: 'Tesla', aliases: ['테슬라', 'Tesla'], isMajor: true },
            { name: 'Toyota', aliases: ['토요타', '도요타', 'Toyota'], isMajor: true },
            { name: 'Volkswagen', aliases: ['폭스바겐', 'Volkswagen', 'VW'], isMajor: true },
            { name: 'GM', aliases: ['GM', '제너럴모터스'], isMajor: true },
            { name: 'Ford', aliases: ['포드', 'Ford'], isMajor: true },
            { name: 'BYD', aliases: ['BYD', '비야디'], isMajor: true }
        ],
        조선: [
            { name: 'CSSC', aliases: ['중국선박', 'CSSC'], isMajor: true },
            { name: 'Imabari', aliases: ['이마바리조선', '이마바리'], isMajor: false }
        ],
        방산: [
            { name: 'Lockheed Martin', aliases: ['록히드마틴', 'Lockheed Martin'], isMajor: true },
            { name: 'Raytheon', aliases: ['레이시온', 'Raytheon'], isMajor: true },
            { name: 'Northrop Grumman', aliases: ['노스롭그루먼', 'Northrop Grumman'], isMajor: true },
            { name: 'BAE Systems', aliases: ['BAE시스템즈', 'BAE Systems'], isMajor: true }
        ],
        가전: [
            { name: 'Apple', aliases: ['애플', 'Apple'], isMajor: true },
            { name: 'Sony', aliases: ['소니', 'Sony'], isMajor: true },
            { name: 'Dyson', aliases: ['다이슨', 'Dyson'], isMajor: false },
            { name: 'Xiaomi', aliases: ['샤오미', 'Xiaomi'], isMajor: true }
        ],
        반도체: [
            { name: 'NVIDIA', aliases: ['엔비디아', 'NVIDIA', '엔비디아'], isMajor: true },
            { name: 'AMD', aliases: ['AMD'], isMajor: true },
            { name: 'Intel', aliases: ['인텔', 'Intel'], isMajor: true },
            { name: 'TSMC', aliases: ['TSMC', '대만반도체'], isMajor: true },
            { name: 'Qualcomm', aliases: ['퀄컴', 'Qualcomm'], isMajor: true },
            { name: 'ASML', aliases: ['ASML'], isMajor: true },
            { name: 'Broadcom', aliases: ['브로드컴', 'Broadcom'], isMajor: true }
        ],
        'IT/AI': [
            { name: 'Google', aliases: ['구글', 'Google'], isMajor: true },
            { name: 'Microsoft', aliases: ['마이크로소프트', 'MS', 'Microsoft'], isMajor: true },
            { name: 'Amazon', aliases: ['아마존', 'Amazon', 'AWS'], isMajor: true },
            { name: 'Meta', aliases: ['메타', 'Meta', '페이스북'], isMajor: true },
            { name: 'OpenAI', aliases: ['오픈AI', '오픈에이아이', 'OpenAI'], isMajor: true },
            { name: 'Anthropic', aliases: ['앤트로픽', 'Anthropic'], isMajor: true }
        ]
    }
};

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
