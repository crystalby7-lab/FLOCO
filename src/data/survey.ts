// 처음 들어올 때 묻는 질문들
// 사업계획서의 두 고객(A 입문 청소년 / B 실거래 청소년)을 나누고,
// 파일럿 사전·사후 설문과 마케팅 유입 경로 측정에 같이 쓴다.
import type { Survey } from '../types'

export type Option = { id: string; label: string; sub?: string }
export type Question = {
  key: keyof Omit<Survey, 'at' | 'sourceEtc'>
  kind: 'single' | 'multi'
  title: string
  help?: string
  face: string // 질문마다 바뀌는 고양이 얼굴
  options: Option[]
  none?: string // 고르면 나머지가 해제되는 선택지
}

export const QUESTIONS: Question[] = [
  {
    key: 'experience',
    kind: 'single',
    title: '주식, 해본 적 있어요?',
    help: '정답은 없어요. 지금 상태 그대로 골라요.',
    face: 'face_wow',
    options: [
      { id: 'none', label: '아직 없어요', sub: '계좌도, 앱도 아직' },
      { id: 'mock', label: '모의투자만 해봤어요', sub: '대회·수업·앱에서 연습으로' },
      { id: 'past', label: '실제로 해본 적 있어요', sub: '부모님 계좌로 산 것도 포함' },
      { id: 'now', label: '지금 하고 있어요', sub: '갖고 있는 주식·ETF가 있어요' },
    ],
  },
  {
    key: 'image',
    kind: 'multi',
    title: '주식 하면 뭐가 떠올라요?',
    help: '여러 개 골라도 돼요',
    face: 'face_calm',
    options: [
      { id: 'gamble', label: '도박 같아요' },
      { id: 'hard', label: '어렵고 복잡해요' },
      { id: 'chance', label: '돈 벌 수 있는 기회' },
      { id: 'scary', label: '잃을까 봐 무서워요' },
      { id: 'company', label: '좋아하는 회사를 응원하는 것' },
      { id: 'adult', label: '어른들이 하는 것' },
      { id: 'unknown', label: '잘 모르겠어요' },
    ],
  },
  {
    key: 'know',
    kind: 'multi',
    title: '친구한테 설명할 수 있는 걸 골라요',
    help: '대충이라도 말할 수 있으면 골라요',
    face: 'face_sleepy',
    none: 'nothing',
    options: [
      { id: 'stock', label: '주식이 뭔지' },
      { id: 'etf', label: 'ETF가 뭔지' },
      { id: 'diversify', label: '분산투자' },
      { id: 'fee', label: '수수료(보수)' },
      { id: 'fx', label: '환율이 수익에 주는 영향' },
      { id: 'risk', label: '위험과 수익의 관계' },
      { id: 'nothing', label: '아직 하나도 없어요' },
    ],
  },
  {
    key: 'pickBy',
    kind: 'multi',
    title: '살 주식을 고른다면 뭘 보고 고를 것 같아요?',
    help: '해본 적 없으면 "이럴 것 같다"로 골라요',
    face: 'face_mad',
    options: [
      { id: 'friend', label: '친구·가족 추천' },
      { id: 'sns', label: '유튜브·인스타·틱톡' },
      { id: 'chat', label: '단톡방·커뮤니티' },
      { id: 'news', label: '뉴스' },
      { id: 'data', label: '회사 실적·숫자를 직접' },
      { id: 'brand', label: '내가 좋아하는 브랜드' },
      { id: 'price', label: '요즘 많이 오른 것' },
    ],
  },
  {
    key: 'goals',
    kind: 'multi',
    title: 'FLOCO에서 뭘 하고 싶어요?',
    help: '여러 개 골라도 돼요',
    face: 'face_happy',
    options: [
      { id: 'basics', label: '주식·ETF 기초 배우기' },
      { id: 'friends', label: '친구들이랑 같이 놀기' },
      { id: 'habit', label: '내 투자 습관 점검하기' },
      { id: 'cat', label: '고양이 키우기' },
      { id: 'class', label: '수업·동아리에서 하래요' },
      { id: 'future', label: '나중에 진짜 투자 준비' },
    ],
  },
  {
    key: 'source',
    kind: 'single',
    title: 'FLOCO는 어떻게 알게 됐어요?',
    help: '알려주면 더 많은 친구에게 닿을 수 있어요',
    face: 'face_wow',
    options: [
      { id: 'invite', label: '친구가 초대했어요' },
      { id: 'school', label: '학교·선생님' },
      { id: 'club', label: '동아리·대회' },
      { id: 'instagram', label: '인스타그램' },
      { id: 'youtube', label: '유튜브' },
      { id: 'tiktok', label: '틱톡' },
      { id: 'search', label: '검색해서' },
      { id: 'etc', label: '기타' },
    ],
  },
]

export const labelOf = (q: Question, id: string) => q.options.find((o) => o.id === id)?.label ?? id

// 답에 따라 시작 타입을 정한다 (A 입문 / B 실거래를 부드럽게 나눈 것)
export type StartType = { id: 'explorer' | 'trainee' | 'checker'; name: string; art: string; desc: string; start: string }

export function typeOf(s: Survey): StartType {
  const knows = s.know.filter((k) => k !== 'nothing').length
  const real = s.experience === 'past' || s.experience === 'now'
  const hearsay = s.pickBy.some((p) => ['friend', 'sns', 'chat', 'price'].includes(p))
  if (real && hearsay)
    return {
      id: 'checker',
      name: '실전 점검러',
      art: 'stretch',
      desc: '이미 투자를 해봤군요. 남의 말 대신 내 이유로 고르는 연습을 해봐요.',
      start: '기초 마을 3번 "투자일까, 도박일까"가 특히 도움이 될 거예요',
    }
  if (knows >= 3 || real)
    return {
      id: 'trainee',
      name: '근거 연습생',
      art: 'walk',
      desc: '기초는 알고 있어요. 이제 이유를 쓰고 친구들과 같이 따져볼 차례예요.',
      start: '기초 마을을 빠르게 지나 ETF 숲까지 가봐요',
    }
  return {
    id: 'explorer',
    name: '첫걸음 탐험가',
    art: 'side',
    desc: '처음이어도 괜찮아요. 고양이랑 같이 하나씩 알아가요.',
    start: '기초 마을 1번 "돈을 불리는 세 가지 방법"부터 시작해요',
  }
}
