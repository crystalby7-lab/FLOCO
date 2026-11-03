// FLOCO MVP 데이터 구조 (11월 1주차 데이터 명세 기준)
// 길드원이 함께 보는 것(고양이·금고·제안·복기)은 guild 안에만 저장한다.

export type Member = {
  id: string
  nickname: string
  isMe?: boolean
  isBot?: boolean // 데모용 친구 (Firebase 연결 전까지 투표·복기를 대신 해줌)
}

export type Cat = {
  name: string
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

export type ProposalStatus = 'voting' | 'holding' | 'rejected' | 'sold'

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
  buyPrice?: number
  qty?: number
  sellPrice?: number
  soldDay?: number
}

export type Retro = {
  id: string
  proposalId: string
  authorId: string
  role: 'proposer' | 'opponent'
  text: string
  parts?: [string, string, string] // 맞았던 것 / 빗나간 것 / 다음엔
}

export type FeedItem = { id: string; text: string; at: number; icon: string }

export type Guild = {
  name: string
  code: string
  members: Member[]
  gold: number // 길드 금고 (가상 골드, 현금화 불가)
  cat: Cat
  proposals: Proposal[]
  retros: Retro[]
  feed: FeedItem[]
  ownedItems: string[]
  album: string[] // 한 번이라도 본 고양이 모습
  levelSeen: number // 레벨업 축하를 본 마지막 레벨
  createdAt: number
}

export type QuestRecord = { done: boolean; score: number; at: number }

export type User = {
  id: string
  nickname: string
  grade: string
  joinedAt: number
}

export type Daily = { date: string; quest: boolean; vote: boolean; care: boolean; claimed: boolean }

export type GameState = {
  version: number
  user: User | null
  guild: Guild | null
  quests: Record<string, QuestRecord> // users/퀘스트 기록
  day: number // 데모용 거래일 (Firebase 연결 후에는 실제 날짜 시세로 대체)
  daily: Daily // 오늘의 미션 (개인)
  tutorialDone: boolean
}
