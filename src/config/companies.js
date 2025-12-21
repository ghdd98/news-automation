// 기업 목록 (한/영 매핑, 대기업 표시)
// 삼성/한화/현대 계열 기계공학 관련 회사 + 글로벌 유명 기업 확장

export const COMPANIES = {
    // 국내 기업
    domestic: {
        // ==================== 현대 계열 ====================
        현대그룹: [
            { name: '현대자동차', aliases: ['현대자동차', '현대차', '현대차그룹'], isMajor: true },
            { name: '기아', aliases: ['기아자동차', '기아차', '기아'], isMajor: true },
            { name: '현대모비스', aliases: ['현대모비스'], isMajor: true },
            { name: '현대위아', aliases: ['현대위아'], isMajor: true },
            { name: '현대트랜시스', aliases: ['현대트랜시스', '현대파워텍'], isMajor: true },
            { name: '현대로템', aliases: ['현대로템'], isMajor: true },
            { name: '현대건설', aliases: ['현대건설'], isMajor: true },
            { name: '현대엔지니어링', aliases: ['현대엔지니어링', '현대ENG'], isMajor: true },
            { name: '현대스틸산업', aliases: ['현대스틸산업', '현대스틸'], isMajor: false },
            { name: '현대케피코', aliases: ['현대케피코'], isMajor: false },
            { name: '현대오토에버', aliases: ['현대오토에버'], isMajor: false },
            { name: 'HD한국조선해양', aliases: ['HD한국조선해양', 'HD조선해양', 'HD현대'], isMajor: true },
            { name: 'HD현대중공업', aliases: ['HD현대중공업', '현대중공업'], isMajor: true },
            { name: 'HD현대미포', aliases: ['HD현대미포', '현대미포조선'], isMajor: true },
            { name: 'HD현대삼호', aliases: ['HD현대삼호', '현대삼호중공업'], isMajor: true },
            { name: 'HD현대일렉트릭', aliases: ['HD현대일렉트릭', '현대일렉트릭'], isMajor: true },
            { name: 'HD현대인프라코어', aliases: ['HD현대인프라코어', '현대두산인프라코어'], isMajor: true },
            { name: 'HD현대건설기계', aliases: ['HD현대건설기계', '현대건설기계'], isMajor: true },
            { name: 'HD현대마린솔루션', aliases: ['HD현대마린솔루션'], isMajor: false }
        ],

        // ==================== 삼성 계열 ====================
        삼성그룹: [
            { name: '삼성전자', aliases: ['삼성전자'], isMajor: true },
            { name: '삼성디스플레이', aliases: ['삼성디스플레이'], isMajor: true },
            { name: '삼성SDI', aliases: ['삼성SDI', '삼성에스디아이'], isMajor: true },
            { name: '삼성전기', aliases: ['삼성전기'], isMajor: true },
            { name: '삼성중공업', aliases: ['삼성중공업'], isMajor: true },
            { name: '삼성엔지니어링', aliases: ['삼성엔지니어링', '삼성ENG'], isMajor: true },
            { name: '삼성물산', aliases: ['삼성물산'], isMajor: true },
            { name: '삼성바이오로직스', aliases: ['삼성바이오로직스', '삼성바이오'], isMajor: true },
            { name: '삼성SDS', aliases: ['삼성SDS', '삼성에스디에스'], isMajor: true },
            { name: '삼성생명', aliases: ['삼성생명'], isMajor: true },
            { name: '삼성화재', aliases: ['삼성화재'], isMajor: true },
            { name: '삼성증권', aliases: ['삼성증권'], isMajor: false },
            { name: '삼성에버랜드', aliases: ['삼성에버랜드'], isMajor: false }
        ],

        // ==================== 한화 계열 ====================
        한화그룹: [
            { name: '한화에어로스페이스', aliases: ['한화에어로스페이스', '한화에어로', '한화테크윈'], isMajor: true },
            { name: '한화오션', aliases: ['한화오션', '대우조선해양', 'DSME'], isMajor: true },
            { name: '한화시스템', aliases: ['한화시스템'], isMajor: true },
            { name: '한화디펜스', aliases: ['한화디펜스', '한화지상방산'], isMajor: true },
            { name: '한화솔루션', aliases: ['한화솔루션', '한화케미칼'], isMajor: true },
            { name: '한화에너지', aliases: ['한화에너지'], isMajor: true },
            { name: '한화큐셀', aliases: ['한화큐셀', 'Q셀'], isMajor: true },
            { name: '한화건설', aliases: ['한화건설'], isMajor: true },
            { name: '한화생명', aliases: ['한화생명'], isMajor: true },
            { name: '한화투자증권', aliases: ['한화투자증권'], isMajor: false },
            { name: '한화모멘텀', aliases: ['한화모멘텀', '한화정밀기계'], isMajor: false }
        ],

        // ==================== SK 계열 ====================
        SK그룹: [
            { name: 'SK하이닉스', aliases: ['SK하이닉스'], isMajor: true },
            { name: 'SK이노베이션', aliases: ['SK이노베이션'], isMajor: true },
            { name: 'SK온', aliases: ['SK온', 'SK On'], isMajor: true },
            { name: 'SK텔레콤', aliases: ['SK텔레콤', 'SKT'], isMajor: true },
            { name: 'SK스퀘어', aliases: ['SK스퀘어'], isMajor: true },
            { name: 'SK실트론', aliases: ['SK실트론'], isMajor: true },
            { name: 'SK머티리얼즈', aliases: ['SK머티리얼즈'], isMajor: false }
        ],

        // ==================== LG 계열 ====================
        LG그룹: [
            { name: 'LG전자', aliases: ['LG전자'], isMajor: true },
            { name: 'LG디스플레이', aliases: ['LG디스플레이', 'LGD'], isMajor: true },
            { name: 'LG에너지솔루션', aliases: ['LG에너지솔루션', 'LGES'], isMajor: true },
            { name: 'LG화학', aliases: ['LG화학'], isMajor: true },
            { name: 'LG이노텍', aliases: ['LG이노텍'], isMajor: true },
            { name: 'LG CNS', aliases: ['LG CNS', 'LGCNS'], isMajor: true },
            { name: 'LG유플러스', aliases: ['LG유플러스', 'LGU+'], isMajor: true }
        ],

        // ==================== 기타 대형/중요 기업 ====================
        기타: [
            { name: '포스코', aliases: ['포스코', 'POSCO', '포스코홀딩스'], isMajor: true },
            { name: '포스코퓨처엠', aliases: ['포스코퓨처엠', '포스코케미칼'], isMajor: true },
            { name: 'LIG넥스원', aliases: ['LIG넥스원', 'LIG넥스'], isMajor: true },
            { name: 'KAI', aliases: ['KAI', '한국항공우주산업', '한국항공우주'], isMajor: true },
            { name: '두산에너빌리티', aliases: ['두산에너빌리티', '두산중공업'], isMajor: true },
            { name: '두산밥캣', aliases: ['두산밥캣'], isMajor: true },
            { name: '두산로보틱스', aliases: ['두산로보틱스'], isMajor: false },
            { name: '한온시스템', aliases: ['한온시스템'], isMajor: true },
            { name: '만도', aliases: ['만도', 'HL만도'], isMajor: true },
            { name: '풍산', aliases: ['풍산그룹', '풍산탄약'], isMajor: true },
            { name: '한미반도체', aliases: ['한미반도체'], isMajor: true },
            { name: '네이버', aliases: ['네이버', 'NAVER', '네이버클라우드'], isMajor: true },
            { name: '카카오', aliases: ['카카오', '카카오엔터프라이즈', '카카오뱅크'], isMajor: true },
            { name: '쿠팡', aliases: ['쿠팡', 'Coupang'], isMajor: true },
            { name: '배달의민족', aliases: ['배달의민족', '우아한형제들', '배민'], isMajor: true },
            { name: '토스', aliases: ['토스', '비바리퍼블리카', '토스뱅크'], isMajor: true },
            { name: '크래프톤', aliases: ['크래프톤', 'KRAFTON'], isMajor: true },
            { name: '넥슨', aliases: ['넥슨', 'NEXON'], isMajor: true },
            { name: '엔씨소프트', aliases: ['엔씨소프트', 'NC소프트'], isMajor: true },
            { name: '에코프로비엠', aliases: ['에코프로비엠', '에코프로'], isMajor: true },
            { name: '코웨이', aliases: ['코웨이'], isMajor: false },
            { name: '쿠쿠전자', aliases: ['쿠쿠전자', '쿠쿠홈시스'], isMajor: false }
        ]
    },

    // 해외 기업 (대폭 확장)
    global: {
        // ==================== 자동차 ====================
        자동차: [
            { name: 'Tesla', aliases: ['테슬라', 'Tesla', 'TSLA', '일론머스크'], isMajor: true },
            { name: 'Toyota', aliases: ['토요타', '도요타', 'Toyota'], isMajor: true },
            { name: 'Volkswagen', aliases: ['폭스바겐그룹', '폭스바겐', 'Volkswagen', 'VW'], isMajor: true },
            { name: 'GM', aliases: ['GM', '제너럴모터스', 'General Motors'], isMajor: true },
            { name: 'Ford', aliases: ['포드자동차', 'Ford Motor', '포드'], isMajor: true },
            { name: 'BYD', aliases: ['BYD', '비야디'], isMajor: true },
            { name: 'BMW', aliases: ['BMW', '비엠더블유'], isMajor: true },
            { name: 'Mercedes-Benz', aliases: ['메르세데스벤츠', '벤츠', 'Mercedes', 'Daimler'], isMajor: true },
            { name: 'Honda', aliases: ['혼다', 'Honda'], isMajor: true },
            { name: 'Nissan', aliases: ['닛산', 'Nissan'], isMajor: true },
            { name: 'Stellantis', aliases: ['스텔란티스', 'Stellantis', '피아트', '지프', '푸조'], isMajor: true },
            { name: 'Rivian', aliases: ['리비안', 'Rivian'], isMajor: false },
            { name: 'Lucid', aliases: ['루시드모터스', 'Lucid Motors'], isMajor: false }
        ],

        // ==================== 조선/중공업 ====================
        조선: [
            { name: 'CSSC', aliases: ['중국선박집단', 'CSSC', '중국조선'], isMajor: true },
            { name: 'Imabari', aliases: ['이마바리조선', '이마바리'], isMajor: true },
            { name: '미쓰비시중공업', aliases: ['미쓰비시중공업', 'Mitsubishi Heavy'], isMajor: true },
            { name: '가와사키중공업', aliases: ['가와사키중공업', 'Kawasaki Heavy'], isMajor: true }
        ],

        // ==================== 방산 ====================
        방산: [
            { name: 'Lockheed Martin', aliases: ['록히드마틴', 'Lockheed Martin', 'LMT'], isMajor: true },
            { name: 'Raytheon', aliases: ['레이시온', 'RTX', 'Raytheon'], isMajor: true },
            { name: 'Northrop Grumman', aliases: ['노스롭그루먼', 'Northrop Grumman'], isMajor: true },
            { name: 'BAE Systems', aliases: ['BAE시스템즈', 'BAE Systems'], isMajor: true },
            { name: 'General Dynamics', aliases: ['제너럴다이나믹스', 'General Dynamics'], isMajor: true },
            { name: 'Boeing', aliases: ['보잉', 'Boeing'], isMajor: true },
            { name: 'Airbus', aliases: ['에어버스', 'Airbus'], isMajor: true },
            { name: 'Rheinmetall', aliases: ['라인메탈', 'Rheinmetall'], isMajor: true }
        ],

        // ==================== 반도체/전자 ====================
        반도체: [
            { name: 'NVIDIA', aliases: ['엔비디아', 'NVIDIA', 'NVDA', '젠슨황'], isMajor: true },
            { name: 'AMD', aliases: ['AMD', '어드밴스드마이크로디바이스', '리사수'], isMajor: true },
            { name: 'Intel', aliases: ['인텔', 'Intel'], isMajor: true },
            { name: 'TSMC', aliases: ['TSMC', '대만반도체', '타이완반도체'], isMajor: true },
            { name: 'Qualcomm', aliases: ['퀄컴', 'Qualcomm', '스냅드래곤'], isMajor: true },
            { name: 'ASML', aliases: ['ASML', 'EUV장비'], isMajor: true },
            { name: 'Broadcom', aliases: ['브로드컴', 'Broadcom'], isMajor: true },
            { name: 'Micron', aliases: ['마이크론', 'Micron'], isMajor: true },
            { name: 'Texas Instruments', aliases: ['텍사스인스트루먼트', 'TI', 'Texas Instruments'], isMajor: true },
            { name: 'Applied Materials', aliases: ['어플라이드머티리얼즈', 'Applied Materials'], isMajor: true },
            { name: 'Lam Research', aliases: ['램리서치', 'Lam Research'], isMajor: true },
            { name: 'MediaTek', aliases: ['미디어텍', 'MediaTek'], isMajor: true }
        ],

        // ==================== IT/AI/빅테크 ====================
        빅테크: [
            { name: 'Apple', aliases: ['애플', 'Apple', '아이폰', '아이패드', '맥북', '팀쿡'], isMajor: true },
            { name: 'Google', aliases: ['구글', 'Google', '알파벳', 'Alphabet', '제미나이', '순다르피차이'], isMajor: true },
            { name: 'Microsoft', aliases: ['마이크로소프트', 'MS', 'Microsoft', '코파일럿', '사티아나델라'], isMajor: true },
            { name: 'Amazon', aliases: ['아마존', 'Amazon', 'AWS', '아마존웹서비스', '앤디재시'], isMajor: true },
            { name: 'Meta', aliases: ['메타', 'Meta', 'META', '페이스북', '마크저커버그'], isMajor: true },
            { name: 'OpenAI', aliases: ['오픈AI', '오픈에이아이', 'OpenAI', 'ChatGPT', 'GPT', '샘알트먼'], isMajor: true },
            { name: 'Anthropic', aliases: ['앤트로픽', 'Anthropic', '클로드', 'Claude'], isMajor: true },
            { name: 'Netflix', aliases: ['넷플릭스', 'Netflix'], isMajor: true },
            { name: 'Salesforce', aliases: ['세일즈포스', 'Salesforce'], isMajor: true },
            { name: 'Oracle', aliases: ['오라클', 'Oracle'], isMajor: true },
            { name: 'SAP', aliases: ['SAP', '에스에이피'], isMajor: true },
            { name: 'Adobe', aliases: ['어도비', 'Adobe'], isMajor: true },
            { name: 'Palantir', aliases: ['팔란티어', 'Palantir'], isMajor: true },
            { name: 'Snowflake', aliases: ['스노우플레이크', 'Snowflake'], isMajor: false },
            { name: 'xAI', aliases: ['xAI', '그록', 'Grok'], isMajor: true }
        ],

        // ==================== 가전/소비재 ====================
        가전: [
            { name: 'Sony', aliases: ['소니', 'Sony', '플레이스테이션'], isMajor: true },
            { name: 'Panasonic', aliases: ['파나소닉', 'Panasonic'], isMajor: true },
            { name: 'Dyson', aliases: ['다이슨', 'Dyson'], isMajor: true },
            { name: 'Xiaomi', aliases: ['샤오미', 'Xiaomi'], isMajor: true },
            { name: 'Huawei', aliases: ['화웨이', 'Huawei'], isMajor: true },
            { name: 'Nintendo', aliases: ['닌텐도', 'Nintendo'], isMajor: true }
        ],

        // ==================== 배터리/에너지 ====================
        배터리: [
            { name: 'CATL', aliases: ['CATL', '닝더스다이', '닝더타이다이'], isMajor: true },
            { name: 'Panasonic Energy', aliases: ['파나소닉에너지', 'Panasonic Energy'], isMajor: true }
        ],

        // ==================== 우주/항공 ====================
        우주항공: [
            { name: 'SpaceX', aliases: ['스페이스X', 'SpaceX', '팰컨', '스타십'], isMajor: true },
            { name: 'Blue Origin', aliases: ['블루오리진', 'Blue Origin', '제프베조스'], isMajor: true },
            { name: 'Virgin Galactic', aliases: ['버진갤럭틱', 'Virgin Galactic'], isMajor: false }
        ]
    }
};

// 스포츠팀/연예 관련 제외 키워드
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
