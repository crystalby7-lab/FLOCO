// FLOCO MVP 데이터 구조 (11월 1주차 데이터 명세 기준)
// 길드원이 함께 보는 것(고양이·금고·제안·복기)은 guild 안에만 저장한다.

export type Member = {
  id: string
  nickname: string
  isMe?: boolean
  isBot?: boolean // 데모용 친구 (Firebase 연결 전까지 투표·복기를 대신 해줌)
}

export type Comment = { id: string; memberId: string; text: string; at: number }
export type Post = { id: string; memberId: string; text: string; at: number; hearts: string[]; topic?: 'chat' | 'invest' | 'ask'; comments?: Comment[] }

export type Cat = {
  name: string
  breed?: string // 키우는 고양이 종 (data/kitty.ts BREEDS), 없으면 삼색이
  level: number
  exp: number
  hunger: number // 0~100, 높을수록 배부름
  mood: number // 0~100
  clean: number // 0~100 청결
  updatedAt: number // 배고픔·기분이 마지막으로 계산된 시각
  lastClaimAt: number // F8 자동 훈련 마지막 수령 시각
  equipped: string[] // 장착한 꾸미기 아이템 id
}

export type AiResult = { pass: boolean; message: string; hint?: string }

export type Vote = { memberId: string; agree: boolean; reason?: string }

export type ProposalStatus = 'voting' | 'holding' | 'rejected' | 'sold' // voting은 예전 저장본 호환용 (지금은 바로 체결)

// 친구 거래에 남기는 피어 피드백: 룰북의 체크 3개 + 한 줄
export type Review = { memberId: string; checks: [boolean, boolean, boolean]; text: string; at: number }

export type Proposal = {
  id: string
  proposerId: string
  ticker: string
  amount: number // 투자할 골드
  reasons: [string, string, string] // 왜 사는지 / 무엇을 확인하지 않았는지 / 무엇을 사지 않기로 했는지
  ai: AiResult
  votes: Vote[]
  status: ProposalStatus
  createdDay: number
  createdDate?: string // 실제 종가로 살 때의 거래일 (YYYY-MM-DD)
  orderPrice?: number // 주문창에서 정한 체결 가격 (1주)
  orderQty?: number // 주문창에서 정한 수량
  orderType?: 'limit' | 'market' // 지정가 / 시장가
  soldDate?: string
  buyPrice?: number
  qty?: number
  sellPrice?: number
  soldDay?: number
  sellReason?: string // 왜 팔았는지
  boughtAt?: number // 체결 시각 (피드 정렬용)
  soldAt?: number
  likes?: string[] // 피드 거래 카드 좋아요
  sellFee?: number // 매도 수수료 (원, 판 금액의 0.1%)
  reviews?: Review[]
  ask?: FeedbackAsk // 친구에게 의견 부탁 중 // 친구들이 남긴 피어 피드백
}

export type Retro = {
  id: string
  proposalId: string
  authorId: string
  role: 'proposer' | 'opponent'
  text: string
  parts?: [string, string, string] // 맞았던 것 / 빗나간 것 / 다음엔
  at?: number
}

export type FeedItem = { id: string; text: string; at: number; icon: string }

export type GuildLook = { theme: string; emblem: string; motto: string }

// 길드원이 한 일 한 줄. key가 같으면 한 번만 남는다 (같은 레슨·같은 거래 중복 방지)
export type ActKind = 'lesson' | 'review' | 'reason' | 'retro' | 'care' | 'post'
export type Act = { id: string; memberId: string; kind: ActKind; key: string; text: string; at: number }
export type WeekRecord = { week: string; mission: string; total: number; goal: number; done: boolean }
// 친구에게 의견 부탁하기 (3일 뒤 만료)
export type FeedbackAsk = { at: number; until: number; canceled?: boolean }

export type Guild = {
  name: string
  code: string
  members: Member[]
  gold: number // 게임 코인 (고양이 돌보기·상점·테마용, 현금화 불가)
  cash: number // (예전 공동 계좌, 안 씀) 계좌는 사람마다 따로: cashOf(g, id)
  cat: Cat
  proposals: Proposal[]
  retros: Retro[]
  feed: FeedItem[]
  ownedItems: string[]
  inventory: Record<string, number> // 상점에서 사서 아직 안 준 먹이·장난감 개수
  board: Post[] // 길드 한마디 게시판
  cheers: Record<string, string> // 친구별 마지막으로 응원한 날짜 (하루 한 번)
  day?: number // 길드 공용 거래일 (서버 연결 시 모두 같은 날)
  memberIds?: string[] // 서버 보안 규칙용 멤버 id 목록
  levelSeen: number // 레벨업 축하를 본 마지막 레벨
  look?: GuildLook // 길드 꾸미기 (배경·문장·구호)
  weekClaimed?: string // 이번 주 같이 하기 보상을 받은 주 (주 시작 날짜)
  acts?: Act[] // 친구들의 발자국: 길드원이 실제로 한 일 (금액·수익률은 안 남김)
  weekLog?: WeekRecord[] // 지난 주 같이 하기 결과
  createdAt: number
}

export type QuestRecord = { done: boolean; score: number; at: number }

// 처음 들어올 때 받는 설문 (사전 설문 겸 유입 경로 측정)
export type Survey = {
  experience: string // 주식 경험
  image: string[] // 주식 하면 떠오르는 것
  know: string[] // 친구한테 설명할 수 있는 것
  pickBy: string[] // 종목을 고를 때 보는 것
  goals: string[] // FLOCO로 하고 싶은 것
  source: string // 어떻게 알게 됐는지
  sourceEtc?: string
  at: number
}

export type Prefs = {
  chatter: boolean // 고양이 혼잣말
  calm: boolean // 움직임 줄이기
  fontScale: 'small' | 'normal' | 'large'
  sound: boolean // 효과음
  haptic: boolean // 진동
  notifyAll: boolean // 알림 전체 스위치 (끄면 아래 항목도 안 와요)
  notifyVote: boolean
  notifyRetro: boolean
  notifyCat: boolean
  notifyCheer: boolean // 친구 응원
  quiet: boolean // 방해 금지 시간 사용
  quietFrom: number // 0~23시
  quietTo: number
}

export type User = {
  id: string
  nickname: string
  grade: string
  joinedAt: number
  survey?: Survey
  avatar?: AvatarLook // 프로필 사진 꾸미기
}

// zoom: 그림 폭(동그라미 대비, 기본 0.8) · x: 좌우(%) · y: 위아래(%, 그림 윗변 위치)
export type AvatarLook = { art: string; bg: string; sticker?: string; zoom?: number; x?: number; y?: number }

export type Daily = { date: string; quest: boolean; vote: boolean; care: boolean; claimed: boolean; talks?: number; goodOrders?: number; quiz?: 'right' | 'wrong' } // quiz: 오늘의 질문 답한 결과

export type GameState = {
  version: number
  user: User | null
  guild: Guild | null
  quests: Record<string, QuestRecord> // users/퀘스트 기록
  day: number // 데모용 거래일 (Firebase 연결 후에는 실제 날짜 시세로 대체)
  daily: Daily // 오늘의 미션 (개인)
  tutorialDone: boolean
  consent?: { age14: true; terms: true; privacy: true; news: boolean; at: number } // 처음 들어올 때 약관 동의
  account?: { provider: 'google' | 'guest'; email?: string; name?: string } // 로그인 방식
  prefs: Prefs
  streak: { count: number; last: string } // 연속 출석 (하루에 하나라도 하면 이어짐)
  watch: string[] // 관심 종목 (별 표시한 것만)
  guides: string[] // 본 초보 가이드 id
  learn: { track: 'basic' | 'adv'; done: Record<string, { score: number; total: number; at: number }>; built: Record<string, number>; basicRev?: number } // 커리큘럼 진도 (basicRev: Basic 개정판 번호) (레슨 id별 점수, 건물 id별 지은 시각)
  decor: Record<string, { style: string; slots: Record<string, number | string> }> // 마을 상점 꾸미기 (상점 id별 스타일·자리마다 고른 가구: 새 가구는 이름, 예전 저장본은 번호)
}
