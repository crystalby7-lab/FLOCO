// F1·F2 퀘스트 콘텐츠 (quests 컬렉션 자리)
// 내용은 초안입니다. 2022 개정 교육과정 '금융과 경제생활' 성취기준을 보고 다듬어 주세요.

export type QuizQ = { q: string; options: string[]; answer: number; why: string }
export type Situation = { text: string; answer: 'invest' | 'gamble'; why: string }

export type Quest = {
  id: string
  region: 'village' | 'forest'
  type: 'learn' | 'judge'
  title: string
  summary: string
  card?: { title: string; points: string[] }
  quiz?: QuizQ[]
  situations?: Situation[]
  unlocks?: string // 해금되는 투자 도구 id
}

export type Region = {
  id: 'village' | 'forest' | 'city' | 'port'
  name: string
  desc: string
  locked?: boolean // MVP 이후 지역
}

export const REGIONS: Region[] = [
  { id: 'village', name: '기초 마을', desc: '저축·투자·도박은 뭐가 다를까' },
  { id: 'forest', name: 'ETF 숲', desc: '한 번에 여러 회사에 나눠 담기' },
  { id: 'city', name: '기업 도시', desc: '재무제표 기초 · 2차 개발', locked: true },
  { id: 'port', name: '세계 항구', desc: '환율·금리 · 2차 개발', locked: true },
]

export const QUESTS: Quest[] = [
  {
    id: 'v1',
    region: 'village',
    type: 'learn',
    title: '돈을 불리는 세 가지 방법',
    summary: '저축 · 투자 · 도박',
    card: {
      title: '세 가지는 무엇이 다를까?',
      points: [
        '저축: 원금이 거의 보장되고, 정해진 이자를 받는다.',
        '투자: 회사·시장의 성장에 돈을 맡긴다. 이유를 따져볼 수 있고, 오래 볼수록 결과가 예측 가능해진다.',
        '도박: 결과가 운으로 정해지고, 평균적으로 참여자가 잃도록 설계돼 있다.',
      ],
    },
    quiz: [
      {
        q: '원금을 거의 잃지 않고 정해진 이자를 받는 것은?',
        options: ['저축', '투자', '도박'],
        answer: 0,
        why: '저축은 위험이 낮은 대신 수익도 정해져 있어요.',
      },
      {
        q: '투자와 도박을 가르는 가장 큰 차이는?',
        options: ['돈을 잃을 수 있는지', '결과를 설명할 이유가 있는지', '얼마나 빨리 돈을 버는지'],
        answer: 1,
        why: '투자는 회사·시장이라는 근거를 따져볼 수 있지만, 도박은 결과가 운으로 정해져요.',
      },
      {
        q: '평균적으로 참여자가 잃도록 설계된 것은?',
        options: ['적금', 'ETF', '도박'],
        answer: 2,
        why: '도박은 운영하는 쪽이 이기도록 확률이 짜여 있어요.',
      },
    ],
  },
  {
    id: 'v2',
    region: 'village',
    type: 'learn',
    title: '위험과 수익',
    summary: '많이 벌 수 있으면 많이 잃을 수도',
    card: {
      title: '위험과 수익은 같이 움직인다',
      points: [
        '수익을 크게 기대할수록 손실 가능성도 커진다.',
        '"무조건 오른다", "원금 보장 고수익"은 사기를 의심할 신호다.',
        '감당할 수 있는 만큼만, 이유를 정리한 뒤에 투자한다.',
      ],
    },
    quiz: [
      {
        q: '"한 달 만에 원금 2배, 손실 없음" 광고를 봤다면?',
        options: ['바로 참여한다', '사기를 의심한다', '친구에게 먼저 권한다'],
        answer: 1,
        why: '높은 수익과 원금 보장은 함께 성립하기 어려워요.',
      },
      {
        q: '손해를 본 직후 가장 위험한 행동은?',
        options: ['왜 떨어졌는지 기록한다', '만회하려고 바로 더 산다', '잠시 쉬며 정리한다'],
        answer: 1,
        why: '만회 매매는 도박에서 보이는 대표적인 패턴이에요.',
      },
      {
        q: '투자 전에 가장 먼저 할 일은?',
        options: ['수익률 순위 확인', '사는 이유 정리', '단톡방 추천 확인'],
        answer: 1,
        why: '이유를 적어두면 결과가 나온 뒤 무엇이 맞고 틀렸는지 돌아볼 수 있어요.',
      },
    ],
  },
  {
    id: 'v3',
    region: 'village',
    type: 'judge',
    title: '투자일까, 도박일까',
    summary: '상황을 보고 판단하기',
    situations: [
      {
        text: '친구가 단톡방에서 "내일 무조건 오른대"라는 종목을 듣고 용돈을 전부 넣었다.',
        answer: 'gamble',
        why: '근거를 확인하지 않고 남의 말에 전부를 걸었어요. 결과가 운에 달려 있어요.',
      },
      {
        text: '여러 회사를 묶은 ETF를 사기 전, 어떤 회사들이 들어있고 수수료가 얼마인지 확인했다.',
        answer: 'invest',
        why: '무엇을 사는지, 비용이 얼마인지 따져봤어요.',
      },
      {
        text: '손해를 보자 "이번엔 반드시 찾는다"며 다른 종목을 바로 두 배로 샀다.',
        answer: 'gamble',
        why: '만회하려는 마음으로 판단 없이 금액을 키웠어요.',
      },
      {
        text: '산 이유를 메모해두고, 한 달 뒤 그 이유가 맞았는지 다시 읽어봤다.',
        answer: 'invest',
        why: '이유를 기록하고 복기하는 건 투자 습관이에요.',
      },
    ],
  },
  {
    id: 'f1',
    region: 'forest',
    type: 'learn',
    title: 'ETF가 뭘까',
    summary: '바구니 하나에 여러 회사',
    card: {
      title: 'ETF = 여러 회사를 담은 바구니',
      points: [
        'ETF는 여러 회사의 주식을 한 번에 담아 주식처럼 사고파는 상품이다.',
        '예: 코스피200 ETF는 한국 대표 회사 200곳을 담는다.',
        '한 회사가 크게 떨어져도 바구니 전체는 덜 흔들린다.',
      ],
    },
    quiz: [
      {
        q: 'ETF를 가장 잘 설명한 것은?',
        options: ['회사 한 곳의 주식', '여러 회사를 담은 바구니', '은행 예금 상품'],
        answer: 1,
        why: 'ETF는 여러 종목을 묶어 한 번에 사는 상품이에요.',
      },
      {
        q: '코스피200 ETF에 담긴 회사 수는 대략?',
        options: ['1곳', '20곳', '200곳'],
        answer: 2,
        why: '이름처럼 대표 회사 200곳을 담아요.',
      },
      {
        q: 'ETF의 장점으로 맞는 것은?',
        options: ['손실이 절대 없다', '한 회사의 위험이 줄어든다', '매일 이자를 준다'],
        answer: 1,
        why: '여러 회사에 나눠 담기 때문에 한 곳의 위험이 줄어요. 손실은 여전히 날 수 있어요.',
      },
    ],
  },
  {
    id: 'f2',
    region: 'forest',
    type: 'learn',
    title: '나눠 담기의 힘',
    summary: '분산투자',
    card: {
      title: '달걀을 한 바구니에 담지 않기',
      points: [
        '분산투자: 서로 다르게 움직이는 자산에 나눠 투자하는 것.',
        '같은 산업 ETF 여러 개는 분산 효과가 작다.',
        '국가·산업이 다른 ETF를 섞으면 흔들림이 줄어든다.',
      ],
    },
    quiz: [
      {
        q: '분산 효과가 가장 큰 조합은?',
        options: ['2차전지 ETF 두 개', '한국 대표 ETF + 미국 대표 ETF', '같은 회사 주식 두 번 사기'],
        answer: 1,
        why: '나라와 산업이 다르면 서로 다르게 움직일 가능성이 커요.',
      },
      {
        q: '분산투자의 목적은?',
        options: ['수익을 무조건 키우기', '흔들림(위험)을 줄이기', '거래를 자주 하기'],
        answer: 1,
        why: '분산은 수익 보장이 아니라 위험을 줄이는 방법이에요.',
      },
      {
        q: '테마 ETF(예: 2차전지)의 특징은?',
        options: ['한 산업에 몰려 있어 크게 흔들릴 수 있다', '원금이 보장된다', '분산 효과가 가장 크다'],
        answer: 0,
        why: '한 산업에 집중하면 그 산업 소식에 크게 움직여요.',
      },
    ],
  },
  {
    id: 'f3',
    region: 'forest',
    type: 'learn',
    title: 'ETF 비교하는 법',
    summary: '완료하면 ETF 비교 도구 해금',
    unlocks: 'etf_compare',
    card: {
      title: 'ETF를 고를 때 보는 세 가지',
      points: [
        '무엇을 담았나: 어떤 나라·산업·회사인지.',
        '얼마나 드나: 총보수(수수료)가 낮을수록 오래 들고 있을 때 유리하다.',
        '얼마나 흔들렸나: 최근 가격 변화 폭이 클수록 위험도 크다.',
      ],
    },
    quiz: [
      {
        q: '같은 지수를 따르는 ETF 두 개라면 무엇을 비교할까?',
        options: ['이름이 멋진 것', '총보수(수수료)', '유튜브 언급 횟수'],
        answer: 1,
        why: '담은 것이 같다면 비용이 낮은 쪽이 오래 들수록 유리해요.',
      },
      {
        q: '최근 가격 변화 폭이 큰 ETF는?',
        options: ['위험도 크다', '무조건 오른다', '수수료가 없다'],
        answer: 0,
        why: '크게 움직였다는 건 앞으로도 크게 흔들릴 수 있다는 뜻이에요.',
      },
      {
        q: 'ETF를 고를 때 가장 먼저 확인할 것은?',
        options: ['무엇을 담았는지', '친구가 샀는지', '어제 올랐는지'],
        answer: 0,
        why: '무엇을 사는지 알아야 이유를 쓸 수 있어요.',
      },
    ],
  },
]

export const TOOLS: Record<string, { name: string; desc: string }> = {
  invest: { name: '공동 투자', desc: '기초 마을을 모두 완료하면 길드에 투자 제안을 할 수 있어요.' },
  etf_compare: { name: 'ETF 비교', desc: '제안할 때 ETF의 담은 것·보수·흔들림을 나란히 볼 수 있어요.' },
}
