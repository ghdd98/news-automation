// 오늘의 동기부여 글귀
export const QUOTES = [
    { text: "성공은 준비와 기회가 만나는 곳에 있다.", author: "바비 언서" },
    { text: "오늘 할 수 있는 일을 내일로 미루지 마라.", author: "벤자민 프랭클린" },
    { text: "실패는 성공의 어머니다.", author: "토마스 에디슨" },
    { text: "시작이 반이다.", author: "아리스토텔레스" },
    { text: "꿈을 크게 가져라. 작은 꿈에는 사람의 가슴을 뛰게 할 힘이 없다.", author: "괴테" },
    { text: "천 리 길도 한 걸음부터.", author: "노자" },
    { text: "오늘의 나는 어제의 나보다 나아야 한다.", author: "이순신" },
    { text: "준비된 자에게 기회는 언제나 온다.", author: "링컨" },
    { text: "포기하지 않으면 실패도 없다.", author: "잭 마" },
    { text: "변화를 두려워하지 마라. 변화 속에 기회가 있다.", author: "피터 드러커" },
    { text: "작은 일에도 최선을 다하면 큰 일도 이룰 수 있다.", author: "데일 카네기" },
    { text: "인내는 쓰지만 그 열매는 달다.", author: "장 자크 루소" },
    { text: "매일 조금씩 나아가면 결국 목표에 도달한다.", author: "공자" },
    { text: "열정을 잃지 않고 실패에서 실패로 걸어가는 것이 성공이다.", author: "윈스턴 처칠" },
    { text: "지금 이 순간을 살아라.", author: "마르쿠스 아우렐리우스" },
    { text: "배움에는 끝이 없다.", author: "소크라테스" },
    { text: "위대한 일은 작은 일들의 연속이다.", author: "빈센트 반 고흐" },
    { text: "당신이 할 수 있다고 믿든 할 수 없다고 믿든, 어느 쪽이든 맞다.", author: "헨리 포드" },
    { text: "오늘이 인생에서 가장 젊은 날이다.", author: "칼 융" },
    { text: "기회는 준비된 마음에만 찾아온다.", author: "루이 파스퇴르" },
    { text: "노력은 배신하지 않는다.", author: "손흥민" },
    { text: "어제보다 더 나은 내가 되자.", author: "BTS 방탄소년단" },
    { text: "뜻이 있는 곳에 길이 있다.", author: "이명박" },
    { text: "도전하지 않으면 아무것도 얻을 수 없다.", author: "마이클 조던" },
    { text: "꾸준함이 재능을 이긴다.", author: "탈렌트는 운, 노력은 선택" },
    { text: "실패해도 괜찮다. 다시 시작하면 된다.", author: "스티브 잡스" },
    { text: "나는 할 수 있다.", author: "모하메드 알리" },
    { text: "지금 시작해라. 완벽한 때는 오지 않는다.", author: "나폴레온 힐" },
    { text: "최선을 다하면 후회는 없다.", author: "김연아" },
    { text: "오늘 하루도 화이팅!", author: "당신을 응원하는 AI" }
];

// 오늘의 글귀 가져오기
export function getDailyQuote() {
    const today = new Date();
    const dayOfYear = Math.floor(
        (today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    );
    const index = dayOfYear % QUOTES.length;
    return QUOTES[index];
}

export default QUOTES;
