// 게임 상태 저장소
// 지금은 브라우저(localStorage)에 저장합니다. Firebase 연결 시 이 파일의 load/save와
// 각 action만 Firestore 읽기/쓰기로 바꾸면 화면 코드는 그대로 쓸 수 있습니다.

import { useSyncExternalStore } from 'react'
import type { ActKind, WeekRecord, AvatarLook, Cat, Daily, GameState, Guild, Member, Prefs, Proposal, AiResult, Survey } from './types'
import { QUESTS, REGIONS } from './data/quests'
import { asOfDate, isRealPrices, priceOf, realCode, tickerOf } from './data/market'
import { OUTFIT_OPEN, itemOf } from './data/shop'
import { COURSE, chapterDone, lessonById } from './data/curriculum'
const BASIC_REV = 2 // Basic 커리큘럼 개정판 번호 — 올리면 예전 Basic 진도가 지워진다
import { SHOPS } from './data/world'
import { reviewReasons } from './aiReview'

const KEY = 'floco-mvp-v1'

export const RULES = {
  weekReward: 500, // 이번 주 같이 하기를 채우면 길드 코인
  quizReward: 20, // 오늘의 질문 맞히면
  sellFee: 0.001, // 매도 수수료 0.1%
  startGold: 3_000, // 게임 코인 (상점·돌보기). 처음부터 테마를 바로 사지 않게 적게
  startCash: 10_000_000, // 모의투자 시작 자산 (원)
  goldPerHour: 30, // F8 자동 훈련 (하루 최대 240)
  trainCapHours: 8, // 상한: 8시간치까지만 쌓임
  hungerDecayPerHour: 4,
  moodDecayPerHour: 3,
  cleanDecayPerHour: 2,
  // 코인 보상: 결과(수익)가 아니라 과정(배우기·근거·돌아보기)에만 준다
  questReward: 300,
  lessonReward: 30,
  lessonPerfect: 10,
  chapterReward: 100, // 퀘스트 첫 완료
  perfectBonus: 100, // 퀘스트 만점 보너스 (첫 완료 때)
  regionBonus: 1000, // 한 지역(단원) 다 끝내면
  retroCoin: 200, // 돌아보기 작성
  goodOrderCoin: 100, // 체크리스트 다 하고 금지어 없이 주문 (하루 2번까지)
  goodOrdersPerDay: 2,
  dailyReward: 300, // 오늘의 미션 3개 완료 보상
  talksPerDay: 3, // 고양이 질문에 답하면 기분 +5 (하루 3번)
  floor: 10, // 손실이 나도, 오래 안 들어와도 고양이는 이 아래로 안 떨어짐
  expPerLevel: 100,
  exp: { proposalPass: 15, opposeReason: 5, review: 8, retro: 30 },
}

const uid = () => Math.random().toString(36).slice(2, 10)
const now = () => Date.now()

export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
const freshDaily = (): Daily => ({ date: today(), quest: false, vote: false, care: false, claimed: false })

// 새 설정을 넣을 때는 여기에 기본값을 추가한다. migrate()가 예전 저장 데이터에 이 값을 채워 넣는다.
export const DEFAULT_PREFS: Prefs = {
  chatter: true,
  calm: false,
  fontScale: 'normal',
  sound: true,
  haptic: true,
  notifyAll: true,
  notifyVote: true,
  notifyRetro: true,
  notifyCat: true,
  notifyCheer: true,
  quiet: false,
  quietFrom: 22,
  quietTo: 7,
}

const initial: GameState = { version: 4, user: null, guild: null, quests: {}, day: 0, daily: freshDaily(), tutorialDone: false, prefs: DEFAULT_PREFS, streak: { count: 0, last: '' }, watch: [], guides: [], decor: {}, learn: { track: 'basic', done: {}, built: {}, basicRev: BASIC_REV } }

// 예전 버전에 저장된 데이터도 새 항목을 채워서 불러온다
function migrate(raw: Partial<GameState>): GameState {
  const s = { ...initial, ...raw } as GameState
  if (!s.daily || s.daily.date !== today()) s.daily = freshDaily()
  if (s.user) s.tutorialDone = true
  s.prefs = { ...DEFAULT_PREFS, ...(s.prefs ?? {}) }
  s.streak = s.streak ?? { count: 0, last: '' }
  s.watch = s.watch ?? []
  s.guides = s.guides ?? []
  s.decor = s.decor ?? {}
  // 예전 가구 번호(f000~)는 새 가게 그림과 안 맞아서 비운다 (2026-11-18 가구 교체)
  for (const k of Object.keys(s.decor)) {
    const d = s.decor[k]
    const shop = SHOPS.find((x) => x.id === k)
    // 가구 시트가 바뀌면(2026-11-21) 지금 후보에 없는 가구는 비운다
    s.decor[k] = { style: d.style, slots: Object.fromEntries(Object.entries(d.slots ?? {}).filter(([sl, v]) => typeof v === 'string' && (!shop || (shop.options as Record<string, string[]>)[sl]?.includes(v)))) }
  }
  s.learn = Object.assign({ track: 'basic', done: {}, built: {} }, s.learn)
  // Basic 커리큘럼 개정(2026-11-25, 보영 요청): 예전 Basic 진도를 지우고, 건물은 Advanced로 끝낸 챕터 것만 남긴다
  if ((s.learn.basicRev ?? 0) < BASIC_REV) {
    const done = Object.fromEntries(Object.entries(s.learn.done ?? {}).filter(([id]) => !id.startsWith('b')))
    const built: Record<string, number> = {}
    COURSE.adv.forEach((c, i) => {
      const shop = SHOPS[i]
      if (shop && chapterDone(c, done) && s.learn.built?.[shop.id]) built[shop.id] = s.learn.built[shop.id]
    })
    s.learn = { ...s.learn, done, built, basicRev: BASIC_REV }
  }
  if (s.guild) {
    // 예시 친구(하늘·도윤)와 그 친구들이 남긴 글·거래·피드백을 뺀다 (2026-11-22)
    const g0 = s.guild as Guild
    const botIds = new Set(g0.members.filter((m) => m.isBot).map((m) => m.id))
    if (botIds.size) {
      s.guild = {
        ...g0,
        members: g0.members.filter((m) => !m.isBot),
        proposals: g0.proposals.filter((p) => !botIds.has(p.proposerId)).map((p) => ({ ...p, reviews: (p.reviews ?? []).filter((r) => !botIds.has(r.memberId)), likes: (p.likes ?? []).filter((x) => !botIds.has(x)) })),
        retros: g0.retros.filter((r) => !botIds.has(r.authorId)),
        board: g0.board.filter((p) => !botIds.has(p.memberId)).map((p) => ({ ...p, hearts: p.hearts.filter((x) => !botIds.has(x)), comments: (p.comments ?? []).filter((c) => !botIds.has(c.memberId)) })),
        feed: g0.feed.filter((f) => !/하늘|도윤/.test(f.text)),
      }
    }
    const g = s.guild as Partial<Guild> & Guild
    s.guild = {
      ...g,
      inventory: g.inventory ?? {},
      // 예전 저장본: 금고 골드 하나로 투자하던 걸 투자 계좌(원)와 게임 코인으로 나눈다
      cash: g.cash ?? RULES.startCash - g.proposals.filter((p) => p.status === 'holding' && p.qty && p.buyPrice).reduce((a, p) => a + p.qty! * p.buyPrice!, 0),
      gold: g.cash === undefined ? Math.min(g.gold, RULES.startGold) : g.gold,
      // 예전에 K200·SP500으로 저장된 제안을 실제 종목코드로 바꾼다
      // 예전 '의견 모으는 중' 제안은 이제 투표가 없으니 그 가격으로 바로 체결된 걸로 본다
      proposals: (g.proposals ?? []).map((p) => {
        const q = { ...p, ticker: realCode(p.ticker) }
        if (q.status !== 'voting' && q.status !== 'rejected') return q
        const price = q.orderPrice ?? priceOf(q.ticker, s.day ?? 0)
        return { ...q, status: 'holding' as const, buyPrice: price, qty: q.orderQty ?? Math.max(1, Math.floor(q.amount / price)), boughtAt: q.boughtAt ?? Date.now() }
      }),
      board: (g.board ?? []).filter((p) => !p.text.startsWith('[신문]')), // 예전 신문 공유 글은 정리
      cheers: g.cheers ?? {},
      levelSeen: g.levelSeen ?? g.cat.level,
      createdAt: g.createdAt ?? s.user?.joinedAt ?? Date.now(),
      cat: { ...g.cat, breed: g.cat.breed ?? 'calico', clean: g.cat.clean ?? 80, equipped: g.cat.equipped.filter((id) => itemOf(id) && (OUTFIT_OPEN || itemOf(id)?.slot !== 'outfit')) },
    }
  }
  return s
}

function load(): GameState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return migrate(JSON.parse(raw))
  } catch {
    /* 저장소를 못 쓰는 환경이면 새로 시작 */
  }
  return initial
}

let state: GameState = load()
const listeners = new Set<() => void>()

function set(updater: (s: GameState) => GameState) {
  state = updater(state)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 무시 */
  }
  listeners.forEach((l) => l())
}

// ───────── 서버(Firebase) 연동용 ─────────
// sync.ts가 로그인 uid를 알려주고, 원격 데이터를 넣고, 변경을 구독한다.
let authUid: string | null = null
export const getState = () => state
export function subscribeState(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
export function applyRemote(patch: Partial<GameState>) {
  set((s) => migrate({ ...s, ...patch }))
}
type Remote = { join: (code: string) => Promise<string | null>; leave: (code: string) => Promise<void> }
let remote: Remote | null = null
export function setRemote(r: Remote | null, uidFromAuth: string | null) {
  remote = r
  authUid = uidFromAuth
  // 예전에 'me'로 저장된 데이터는 로그인 uid로 바꿔준다
  if (uidFromAuth && state.user && state.user.id !== uidFromAuth) {
    const old = state.user.id
    const json = JSON.stringify(state).split(`"${old}"`).join(`"${uidFromAuth}"`)
    set(() => migrate(JSON.parse(json)))
  }
}
export const isOnline = () => remote !== null

// 실제 종가를 받아온 뒤 화면을 다시 그리게 한다 (market.ts는 상태 밖에 있어서
// 상태 객체를 새로 만들어 줘야 useSyncExternalStore가 다시 그린다)
export function notifyPrices() {
  set((s) => ({ ...s }))
}

export function useGame(): GameState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

// ───────── 계산 도우미 ─────────

export function catNow(cat: Cat, t = now()): Cat {
  const hours = (t - cat.updatedAt) / 3_600_000
  return {
    ...cat,
    hunger: Math.max(RULES.floor, cat.hunger - hours * RULES.hungerDecayPerHour),
    mood: Math.max(RULES.floor, cat.mood - hours * RULES.moodDecayPerHour),
    clean: Math.max(RULES.floor, (cat.clean ?? 80) - hours * RULES.cleanDecayPerHour),
    updatedAt: t,
  }
}

export function trainingAvailable(cat: Cat, t = now()): { gold: number; full: boolean; hours: number } {
  const hours = Math.min(RULES.trainCapHours, (t - cat.lastClaimAt) / 3_600_000)
  return { gold: Math.floor(hours * RULES.goldPerHour), full: hours >= RULES.trainCapHours, hours }
}

export function questsDone(s: GameState, region: string) {
  const list = QUESTS.filter((q) => q.region === region)
  return list.filter((q) => s.quests[q.id]?.done).length === list.length
}

export function unlocked(s: GameState) {
  const tools = new Set<string>()
  if (questsDone(s, 'village')) tools.add('invest')
  QUESTS.forEach((q) => q.unlocks && s.quests[q.id]?.done && tools.add(q.unlocks))
  return tools
}

export const me = (g: Guild) => g.members.find((m) => m.isMe)!

// 내 계좌는 사람마다 따로: 시작 금액 − 산 금액 + 판 금액 (거래로만 바뀐다)
export function cashOf(g: Guild, memberId = me(g).id) {
  return g.proposals
    .filter((p) => p.proposerId === memberId && p.qty && p.buyPrice && (p.status === 'holding' || p.status === 'sold'))
    .reduce((a, p) => a - p.qty! * p.buyPrice! + (p.status === 'sold' ? p.qty! * (p.sellPrice ?? p.buyPrice!) - (p.sellFee ?? 0) : 0), RULES.startCash)
}

// 계좌 평가: 내 현금 + 내가 가진 종목 지금 가격
export function vault(g: Guild, day: number, memberId = me(g).id) {
  const mine = g.proposals.filter((p) => p.proposerId === memberId)
  const holdings = mine
    .filter((p) => p.status === 'holding' && p.qty && p.buyPrice)
    .map((p) => {
      const now = priceOf(p.ticker, day)
      return { p, value: p.qty! * now, pnl: p.qty! * (now - p.buyPrice!), pct: ((now - p.buyPrice!) / p.buyPrice!) * 100 }
    })
  const invested = holdings.reduce((a, h) => a + h.value, 0)
  const pnl = holdings.reduce((a, h) => a + h.pnl, 0)
  const realized = mine
    .filter((p) => p.status === 'sold' && p.qty && p.buyPrice && p.sellPrice)
    .reduce((a, p) => a + p.qty! * (p.sellPrice! - p.buyPrice!) - (p.sellFee ?? 0), 0)
  const cash = cashOf(g, memberId)
  return { cash, invested, total: cash + invested, pnl, realized, holdings }
}

// 내가 아직 피드백을 안 남긴 친구 거래
export function needReview(g: Guild, memberId = me(g).id) {
  return g.proposals.filter((p) => p.proposerId !== memberId && p.status !== 'rejected' && p.status !== 'voting' && !(p.reviews ?? []).some((r) => r.memberId === memberId))
}

const yesterday = () => {
  const d = new Date(Date.now() - 86_400_000)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

// 연속 출석: 오늘 이미 했으면 그대로, 어제 했으면 +1, 아니면 1부터
export function streakNow(s: GameState) {
  const { count, last } = s.streak
  return last === today() || last === yesterday() ? count : 0
}

function markDaily(key: 'quest' | 'vote' | 'care') {
  set((s) => {
    const d = s.daily.date === today() ? s.daily : freshDaily()
    const t = today()
    const streak = s.streak.last === t ? s.streak : { count: s.streak.last === yesterday() ? s.streak.count + 1 : 1, last: t }
    return { ...s, streak, daily: d[key] ? d : { ...d, [key]: true } }
  })
}
export const memberName = (g: Guild, id: string) => g.members.find((m) => m.id === id)?.nickname ?? '?'

// ───────── 내부 수정 도우미 ─────────

function updateGuild(fn: (g: Guild, s: GameState) => Guild) {
  set((s) => (s.guild ? { ...s, guild: fn(s.guild, s) } : s))
}


// 친구들의 발자국 남기기: 같은 key는 한 번만 (중복 점수 방지). 최근 300개까지.
function addAct(g: Guild, memberId: string, kind: ActKind, key: string, text: string): Guild {
  const acts = g.acts ?? []
  if (acts.some((a) => a.key === key)) return g
  return { ...g, acts: [{ id: uid(), memberId, kind, key, text, at: now() }, ...acts].slice(0, 300) }
}

function addFeed(g: Guild, icon: string, text: string): Guild {
  return { ...g, feed: [{ id: uid(), icon, text, at: now() }, ...g.feed].slice(0, 60) }
}

function addExp(g: Guild, amount: number, why: string): Guild {
  let cat = { ...g.cat, exp: g.cat.exp + amount }
  let leveled = false
  while (cat.exp >= RULES.expPerLevel) {
    cat = { ...cat, exp: cat.exp - RULES.expPerLevel, level: cat.level + 1 }
    leveled = true
  }
  let ng = addFeed({ ...g, cat }, '✨', `${why} · 경험치 +${amount}`)
  if (leveled) ng = addFeed(ng, '🎉', `${g.cat.name}가 Lv.${cat.level}이 됐어요!`)
  return ng
}

function newCat(name: string, breed = 'calico'): Cat {
  const t = now()
  return { name, breed, level: 1, exp: 0, hunger: 70, mood: 70, clean: 80, updatedAt: t, lastClaimAt: t - 2 * 3_600_000, equipped: [] }
}

// ───────── 데모 친구 (Firebase 연결 전까지 친구 역할) ─────────

const BOT_CHAT = ['ㅋㅋ 공감', '오 좋다!', '주니 오늘 귀엽더라', '나도 그 생각 했어']
const BOT_INVEST = ['근거 좋다! 수수료도 같이 보자', '그 종목 흔들림은 어느 정도야?', '오 나도 관심 있었어. 이유 하나만 더 말해줘', '환율도 같이 보면 좋을 듯']
const BOT_ANSWER = ['지도 시장 거리에 그거 나와!', '종목 상세에서 ⓘ 누르면 설명 나와', '나도 헷갈렸는데 투자팁에 있더라', '내일 같이 찾아보자']
const BOT_OPPOSE = [
  '한 산업에만 몰려 있어서 너무 크게 흔들릴 것 같아.',
  '수수료가 다른 ETF보다 높아서 오래 들고 있기엔 아쉬워.',
  '계좌에서 너무 큰 비중이라 나눠서 사는 게 좋겠어.',
  '최근에 많이 올라서 이유가 아직 유효한지 더 보고 싶어.',
]
const BOT_RETRO_PROPOSER = [
  '분산은 잘 됐다고 생각했는데, 환율 영향을 확인하지 않은 게 아쉬웠다. 다음엔 환율도 같이 보겠다.',
  '산 이유는 장기 성장이었는데 며칠 만에 팔아서 이유와 행동이 안 맞았다. 다음엔 보유 기간도 정하고 제안하겠다.',
]
const BOT_RETRO_OPPONENT = [
  '내가 걱정한 흔들림이 실제로 있었다. 반대 이유를 더 구체적인 숫자로 썼으면 설득력이 있었을 것 같다.',
  '반대했지만 결과는 괜찮았다. 내가 본 위험이 틀린 건지, 운이 좋았던 건지 더 지켜봐야겠다.',
]
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]



// 데모 친구들이 내 거래에 피드백을 남겨 준다
function scheduleBotReviews(proposalId: string) {
  const g = state.guild
  if (!g) return
  const p = g.proposals.find((x) => x.id === proposalId)
  if (!p) return
  const waiting = g.members.filter((m) => m.isBot && m.id !== p.proposerId && !(p.reviews ?? []).some((r) => r.memberId === m.id))
  waiting.forEach((bot, i) => {
    setTimeout(() => {
      const checks: [boolean, boolean, boolean] = [Math.random() < 0.8, Math.random() < 0.6, Math.random() < 0.7]
      addReview(proposalId, bot.id, checks, pick(checks.every(Boolean) ? BOT_REVIEW_GOOD : BOT_OPPOSE))
    }, 1500 + i * 1700)
  })
}

const BOT_REVIEW_GOOD = ['근거가 구체적이라 나도 따라 찾아볼 수 있었어!', '안 본 것까지 적어 둔 게 좋다. 다음에 그거 같이 보자.', '숫자로 확인할 수 있게 써서 믿음이 가.']

function addReview(proposalId: string, memberId: string, checks: [boolean, boolean, boolean], text: string) {
  updateGuild((g) => {
    const p = g.proposals.find((x) => x.id === proposalId)
    if (!p || (p.reviews ?? []).some((r) => r.memberId === memberId)) return g
    let ng: Guild = { ...g, proposals: g.proposals.map((x) => (x.id === proposalId ? { ...x, reviews: [...(x.reviews ?? []), { memberId, checks, text, at: now() }] } : x)) }
    ng = addAct(ng, memberId, 'review', `review:${memberId}:${proposalId}`, `${memberName(g, p.proposerId)}의 투자 근거에 피드백했어요`)
    const who = memberName(g, memberId)
    ng = addFeed(ng, '💬', `${who}님이 ${memberName(g, p.proposerId)}님의 ${tickerOf(p.ticker).name} 거래에 피드백을 남겼어요.`)
    return addExp(ng, RULES.exp.review, `${who}님의 피드백`)
  })
}

function scheduleBotRetros(proposalId: string) {
  const g = state.guild
  if (!g) return
  const p = g.proposals.find((x) => x.id === proposalId)
  if (!p) return
  const writers = g.members.filter((m) => m.isBot && m.id === p.proposerId)
  writers.forEach((bot, i) => {
    setTimeout(() => {
      const role = bot.id === p.proposerId ? 'proposer' : 'opponent'
      writeRetro(proposalId, bot.id, pick(role === 'proposer' ? BOT_RETRO_PROPOSER : BOT_RETRO_OPPONENT))
    }, 1500 + i * 1500)
  })
}

// ───────── 화면에서 쓰는 action ─────────

export const actions = {
  createUser(nickname: string, grade: string) {
    set((s) => ({ ...s, user: { id: authUid ?? 'me', nickname, grade, joinedAt: now() } }))
  },

  createGuild(guildName: string, catName: string, breed = 'calico') {
    set((s) => {
      if (!s.user) return s
      // 예시 친구 없이 나 혼자 시작. 친구는 초대 코드로 들어온다 (2026-11-22)
      const members: Member[] = [{ id: s.user.id, nickname: s.user.nickname, isMe: true }]
      let guild: Guild = {
        name: guildName,
        code: Math.random().toString(36).slice(2, 8).toUpperCase(),
        members,
        gold: RULES.startGold,
        cash: RULES.startCash,
        cat: newCat(catName, breed),
        proposals: [],
        retros: [],
        feed: [],
        ownedItems: [],
        inventory: { feed: 2, toy: 1 },
        board: [],
        cheers: {},
        levelSeen: 1,
        createdAt: now(),
      }
      guild = addFeed(guild, '🐣', `${guildName} 길드가 만들어지고 ${catName}가 태어났어요!`)
      return { ...s, guild }
    })
  },

  // 초대 코드로 진짜 길드에 들어가기 (서버 연결 필요, 예시 길드는 없음)
  async joinGuild(code: string): Promise<string | null> {
    const c = code.trim().toUpperCase()
    if (!/^[A-Z0-9]{6}$/.test(c)) return '초대 코드는 영어·숫자 6자리예요.'
    if (!remote) return '서버에 연결돼야 친구 길드에 들어갈 수 있어요. 인터넷을 확인하고 새로고침해 주세요.'
    return remote.join(c)
  },

  claimTraining() {
    updateGuild((g) => {
      const { gold } = trainingAvailable(g.cat)
      if (gold <= 0) return g
      return addFeed({ ...g, gold: g.gold + gold, cat: { ...catNow(g.cat), lastClaimAt: now() } }, '🏋️', `자동 훈련 보상 코인 ${gold}개를 받았어요.`)
    })
  },

  completeQuest(questId: string, score: number) {
    set((s) => {
      const quest = QUESTS.find((q) => q.id === questId)!
      const first = !s.quests[questId]?.done
      let ns: GameState = { ...s, quests: { ...s.quests, [questId]: { done: true, score: Math.max(score, s.quests[questId]?.score ?? 0), at: now() } } }
      if (first && ns.guild) {
        const total = quest.quiz?.length ?? quest.situations?.length ?? 0
        const perfect = total > 0 && score >= total ? RULES.perfectBonus : 0
        let g = addFeed(
          { ...ns.guild, gold: ns.guild.gold + RULES.questReward + perfect },
          '📘',
          `${ns.user?.nickname}님이 '${quest.title}' 퀘스트를 완료했어요 · 코인 +${RULES.questReward + perfect}${perfect ? ' (만점 보너스)' : ''}`,
        )
        if (questsDone(ns, quest.region) && !questsDone(s, quest.region)) {
          const rn = REGIONS.find((r) => r.id === quest.region)?.name ?? '지역'
          g = addFeed({ ...g, gold: g.gold + RULES.regionBonus }, '🏘️', `${rn} 완성! 코인 +${RULES.regionBonus}`)
        }
        if (questsDone(ns, 'village') && !questsDone(s, 'village')) g = addFeed(g, '🔓', '시장 거리가 열렸어요.')
        if (questsDone(ns, 'market') && !questsDone(s, 'market')) g = addFeed(g, '🔓', 'ETF 숲이 열렸어요.')
        if (quest.unlocks) g = addFeed(g, '🔓', 'ETF 비교 도구가 해금됐어요.')
        ns = { ...ns, guild: g }
      }
      return ns
    })
    markDaily('quest')
  },

  // F4: 이유 3칸 → AI 검토 → 통과하면 길드에 올라감
  propose(ticker: string, amount: number, reasons: [string, string, string], order?: { price: number; qty: number; type: 'limit' | 'market' }, good = false): AiResult {
    const g = state.guild!
    const myId = me(g).id
    const prev = g.proposals.filter((p) => p.proposerId === myId).map((p) => p.reasons[0])
    const ai = reviewReasons(reasons, prev)
    if (!ai.pass) return ai
    if (amount > cashOf(g, myId)) return { pass: false, message: '주문가능금액보다 많은 금액이에요.', hint: '금액을 줄여주세요.' }
    if (!order && amount < priceOf(ticker, state.day)) return { pass: false, message: '1주 가격보다 금액이 적어요.', hint: '금액을 늘리거나 다른 종목을 골라보세요.' }
    const p: Proposal = {
      id: uid(),
      proposerId: myId,
      ticker,
      amount,
      reasons,
      ai,
      votes: [],
      status: 'holding',
      buyPrice: order?.price ?? priceOf(ticker, state.day),
      qty: order?.qty ?? Math.floor(amount / priceOf(ticker, state.day)),
      boughtAt: now(),
      reviews: [],
      createdDay: state.day,
      ...(order ? { orderPrice: order.price, orderQty: order.qty, orderType: order.type } : {}),
      ...(asOfDate() ? { createdDate: asOfDate()! } : {}),
    }
    updateGuild((gg) => {
      let ng = addFeed({ ...gg, proposals: [p, ...gg.proposals] }, '✅', `${me(gg).nickname}님이 ${tickerOf(ticker).name}를 샀어요. 근거에 피드백을 남겨 주세요!`)
      ng = addAct(ng, myId, 'reason', `reason:${p.id}`, `${tickerOf(ticker).name} 투자 근거 3칸을 썼어요`)
      ng = addExp(ng, RULES.exp.proposalPass, '이유 확인 통과')
      return ng
    })
    scheduleBotReviews(p.id)
    // 체크리스트를 다 하고 금지어 없이 쓴 주문이면 코인 (하루 2번까지)
    if (good) {
      const d = state.daily
      if ((d.goodOrders ?? 0) < RULES.goodOrdersPerDay) {
        set((st) => ({
          ...st,
          daily: { ...st.daily, goodOrders: (st.daily.goodOrders ?? 0) + 1 },
          guild: st.guild ? addFeed({ ...st.guild, gold: st.guild.gold + RULES.goodOrderCoin }, '📝', `꼼꼼한 근거로 주문했어요 · 코인 +${RULES.goodOrderCoin}`) : st.guild,
        }))
      }
    }
    // 실전 미션: 첫 주문 넣기
    if (!state.quests.m4?.done) actions.completeQuest('m4', 1)
    return ai
  },

  // 친구 거래에 피어 피드백 (체크 3개 + 한 줄)
  review(proposalId: string, checks: [boolean, boolean, boolean], text: string) {
    addReview(proposalId, me(state.guild!).id, checks, text)
    markDaily('vote')
  },

  seeGuide(id: string) {
    set((s) => (s.guides.includes(id) ? s : { ...s, guides: [...s.guides, id] }))
  },

  // 관심 종목 별 켜고 끄기
  // 마을 상점 꾸미기: 스타일이나 자리 하나를 바꾼다 (num이 null이면 그 자리를 비움)
  decorate(shop: string, patch: { style?: string; slot?: string; num?: number | string | null }) {
    set((s) => {
      const cur = s.decor[shop] ?? { style: 'base', slots: {} }
      const slots = { ...cur.slots }
      if (patch.slot) {
        if (patch.num == null) delete slots[patch.slot]
        else slots[patch.slot] = patch.num
      }
      return { ...s, decor: { ...s.decor, [shop]: { style: patch.style ?? cur.style, slots } } }
    })
  },

  // 커리큘럼: 트랙 바꾸기 / 레슨 끝내기 (처음 끝내면 코인, 챕터·건물 완성 보너스)
  setTrack(track: 'basic' | 'adv') {
    set((s) => ({ ...s, learn: { ...s.learn, track } }))
  },
  completeLesson(lessonId: string, score: number, total: number): { coins: number; chapterDone: boolean; built: string | null } {
    const hit = lessonById(lessonId)
    const out = { coins: 0, chapterDone: false, built: null as string | null }
    if (!hit) return out
    set((s) => {
      const first = !s.learn.done[lessonId]
      const prev = s.learn.done[lessonId]
      const done = { ...s.learn.done, [lessonId]: { score: Math.max(score, prev?.score ?? 0), total, at: prev?.at ?? now() } }
      let learn = { ...s.learn, done }
      let ns: GameState = { ...s, learn }
      if (first && ns.guild) {
        let coins = RULES.lessonReward + (score >= total ? RULES.lessonPerfect : 0)
        let g = { ...ns.guild, gold: ns.guild.gold + coins }
        // 챕터 N의 레슨 5개를 다 끝내면 N번째 건물이 열린다
        const chDone = chapterDone(hit.c, done)
        const shop = SHOPS[hit.c.no - 1]
        if (chDone && shop && !learn.built[shop.id]) {
          learn = { ...learn, built: { ...learn.built, [shop.id]: now() } }
          g = addFeed({ ...g, gold: g.gold + RULES.regionBonus }, '🏘️', `${ns.user?.nickname}님이 ${shop.name}을(를) 열었어요! 코인 +${RULES.regionBonus}`)
          out.built = shop.id
          coins += RULES.regionBonus
        }
        out.coins = coins
        out.chapterDone = chDone
        ns = { ...ns, learn, guild: g }
      }
      if (first && ns.guild) {
        const my = me(ns.guild).id
        ns = { ...ns, guild: addAct(ns.guild, my, 'lesson', `lesson:${my}:${lessonId}`, `${hit.l.title} 레슨을 끝냈어요`) }
      }
      return ns
    })
    markDaily('quest')
    return out
  },

  setDecor(shop: string, value: { style: string; slots: Record<string, number | string> }) {
    set((s) => ({ ...s, decor: { ...s.decor, [shop]: value } }))
  },

  toggleWatch(code: string) {
    set((s) => ({ ...s, watch: s.watch.includes(code) ? s.watch.filter((c) => c !== code) : [...s.watch, code] }))
  },

  sell(proposalId: string, reason?: string, atPrice?: number) {
    updateGuild((g, s) => {
      const p = g.proposals.find((x) => x.id === proposalId)
      if (!p || p.status !== 'holding' || !p.qty || !p.buyPrice) return g
      const price = atPrice ?? priceOf(p.ticker, s.day)
      const income = p.qty * price
      const fee = Math.round(income * RULES.sellFee) // 매도 수수료 0.1% (서영 언니 앱과 같은 규칙)
      const profit = income - fee - p.qty * p.buyPrice
      const sold: Proposal = { ...p, status: 'sold', sellPrice: price, sellFee: fee, soldDay: s.day, soldAt: now(), ...(asOfDate() ? { soldDate: asOfDate()! } : {}), ...(reason ? { sellReason: reason } : {}) }
      const ng = { ...g, proposals: g.proposals.map((x) => (x.id === p.id ? sold : x)) }
      return addFeed(
        ng,
        profit >= 0 ? '📈' : '📉',
        `${tickerOf(p.ticker).name}를 팔았어요 (${profit >= 0 ? '+' : ''}${profit.toLocaleString()}원). 같이 돌아봐요!`,
      )
    })
    scheduleBotRetros(proposalId)
  },

  writeMyRetro(proposalId: string, parts: [string, string, string]) {
    const text = `맞았던 것: ${parts[0]} / 빗나간 것: ${parts[1]} / 다음엔: ${parts[2]}`
    writeRetro(proposalId, me(state.guild!).id, text, parts)
  },

  // 오늘의 질문(OX 하나): 하루 한 번, 맞히면 코인 조금
  answerQuiz(right: boolean) {
    set((s) => {
      const d = s.daily.date === today() ? s.daily : freshDaily()
      if (d.quiz || !s.guild) return s
      const gold = right ? s.guild.gold + RULES.quizReward : s.guild.gold
      return { ...s, daily: { ...d, quiz: right ? 'right' : 'wrong' }, guild: { ...s.guild, gold } }
    })
  },

  claimDaily() {
    set((s) => {
      const d = s.daily
      if (!s.guild || d.claimed || !(d.quest && d.vote && d.care)) return s
      return {
        ...s,
        daily: { ...d, claimed: true },
        guild: addFeed({ ...s.guild, gold: s.guild.gold + RULES.dailyReward }, '🎁', `오늘의 미션 완료 · 코인 +${RULES.dailyReward}`),
      }
    })
  },

  ackLevel() {
    updateGuild((g) => ({ ...g, levelSeen: g.cat.level }))
  },

  finishTutorial() {
    set((s) => ({ ...s, tutorialDone: true }))
  },

  saveSurvey(survey: Survey) {
    set((s) => (s.user ? { ...s, user: { ...s.user, survey } } : s))
  },

  setAvatar(avatar: AvatarLook) {
    set((s) => (s.user ? { ...s, user: { ...s.user, avatar } } : s))
  },

  updateProfile(nickname: string, grade: string) {
    set((s) => {
      if (!s.user) return s
      const user = { ...s.user, nickname, grade }
      const guild = s.guild ? { ...s.guild, members: s.guild.members.map((m) => (m.isMe ? { ...m, nickname } : m)) } : s.guild
      return { ...s, user, guild }
    })
  },

  renameCat(name: string) {
    updateGuild((g) => addFeed({ ...g, cat: { ...g.cat, name } }, '✏️', `고양이 이름이 ${name}(으)로 바뀌었어요.`))
  },

  // 길드 꾸미기: 이름·구호·배경·글꼴·문장
  decorateGuild(name: string, look: import('./types').GuildLook) {
    updateGuild((g) => (g.name !== name ? addFeed({ ...g, name, look }, '✏️', `길드 이름이 ${name}(으)로 바뀌었어요.`) : { ...g, look }))
  },

  renameGuild(name: string) {
    updateGuild((g) => addFeed({ ...g, name }, '✏️', `길드 이름이 ${name}(으)로 바뀌었어요.`))
  },

  // 길드 나가기: 내 계정은 그대로 두고 길드만 비운다 (다시 만들거나 초대 코드로 들어갈 수 있다)
  // 서버에 연결돼 있으면 멤버 목록에서 나를 빼고 구독을 끊는다. 고양이·금고는 남은 친구들에게 남는다.
  leaveGuild() {
    const code = state.guild?.code
    if (code) remote?.leave(code)
    set((s) => ({ ...s, guild: null }))
  },

  setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    set((s) => ({ ...s, prefs: { ...s.prefs, [key]: value } }))
  },

  // 상점에서 사기: 먹이·장난감은 보관함 개수만 늘고, 홈에서 '주기'를 눌러야 고양이가 받는다
  buyItem(itemId: string): string | null {
    const g = state.guild!
    const item = itemOf(itemId)!
    if (item.slot === 'outfit' && !OUTFIT_OPEN) return '고양이 옷은 준비 중이에요.'
    if (g.gold < item.price) return '코인이 부족해요.'
    if (item.kind !== 'food' && g.ownedItems.includes(itemId)) return '이미 가지고 있어요.'
    updateGuild((gg) => {
      const ng: Guild = { ...gg, gold: gg.gold - item.price }
      if (item.kind === 'food') return { ...ng, inventory: { ...ng.inventory, [itemId]: (ng.inventory[itemId] ?? 0) + 1 } }
      // 가구는 사면 바로 거실에 놓는다 (같은 자리 가구는 치움)
      const placed = item.slot === 'room' ? { ...ng.cat, equipped: [...ng.cat.equipped.filter((id) => !item.spot || itemOf(id)?.spot !== item.spot), itemId] } : ng.cat
      return addFeed(
        { ...ng, cat: placed, ownedItems: [...ng.ownedItems, itemId] },
        item.kind === 'place' ? '🔓' : '🛍',
        item.kind === 'place' ? `${me(gg).nickname}님이 ${item.name} 테마를 열었어요.` : `${me(gg).nickname}님이 ${item.name}을(를) 샀어요.`,
      )
    })
    return null
  },

  // 홈에서 주기: 보관함에서 하나 꺼내 고양이에게
  giveItem(itemId: string): string | null {
    const g = state.guild!
    const item = itemOf(itemId)!
    if ((g.inventory[itemId] ?? 0) <= 0) return '보관함에 없어요. 상점에서 사 와요.'
    updateGuild((gg) => {
      const cat = catNow(gg.cat)
      const e = item.effect ?? {}
      const ncat = {
        ...cat,
        hunger: Math.min(100, cat.hunger + (e.hunger ?? 0)),
        mood: Math.min(100, cat.mood + (e.mood ?? 0)),
        clean: e.clean ? Math.min(100, (cat.clean ?? 80) + e.clean) : cat.clean,
      }
      const my = me(gg).id
      const withAct = addAct(gg, my, 'care', `care:${my}:${today()}:${itemId === 'bath' ? 'bath' : 'feed'}`, itemId === 'bath' ? `${gg.cat.name}를 씻겨 줬어요` : `${gg.cat.name}에게 ${item.name}을(를) 줬어요`)
      return addFeed(
        { ...withAct, cat: ncat, inventory: { ...gg.inventory, [itemId]: (gg.inventory[itemId] ?? 0) - 1 } },
        itemId === 'bath' ? '🛁' : '🍽',
        itemId === 'bath' ? `${me(gg).nickname}님이 ${gg.cat.name}를 씻겨줬어요.` : `${me(gg).nickname}님이 ${gg.cat.name}에게 ${item.name}을(를) 줬어요.`,
      )
    })
    markDaily('care')
    return null
  },

  // 길드 한마디
  postBoard(text: string, topic: 'chat' | 'invest' | 'ask' = 'chat') {
    const t = text.trim().slice(0, 140)
    if (!t) return
    const id = uid()
    updateGuild((g) => ({ ...g, board: [{ id, memberId: me(g).id, text: t, at: Date.now(), hearts: [], topic, comments: [] }, ...g.board].slice(0, 40) }))
    // 테스트 친구가 가끔 반응해준다 (서버 연결 후 실제 친구가 생기면 빠짐)
    const g = state.guild
    const bots = g?.members.filter((m) => m.isBot) ?? []
    if (bots.length) {
      const bot = bots[Math.floor(Math.random() * bots.length)]
      const lines = topic === 'ask' ? BOT_ANSWER : topic === 'invest' ? BOT_INVEST : BOT_CHAT
      setTimeout(() => actions.commentPost(id, pick(lines), bot.id), 2500)
      setTimeout(() => {
        updateGuild((gg) => ({ ...gg, board: gg.board.map((p) => (p.id === id && !p.hearts.includes(bot.id) ? { ...p, hearts: [...p.hearts, bot.id] } : p)) }))
      }, 1500)
    }
  },
  likeTrade(proposalId: string) {
    updateGuild((g) => {
      const my = me(g).id
      return { ...g, proposals: g.proposals.map((p) => (p.id !== proposalId ? p : { ...p, likes: (p.likes ?? []).includes(my) ? (p.likes ?? []).filter((x) => x !== my) : [...(p.likes ?? []), my] })) }
    })
  },
  commentPost(postId: string, text: string, authorId?: string) {
    const t = text.trim().slice(0, 100)
    if (!t) return
    updateGuild((g) => ({
      ...g,
      board: g.board.map((p) => (p.id !== postId ? p : { ...p, comments: [...(p.comments ?? []), { id: uid(), memberId: authorId ?? me(g).id, text: t, at: Date.now() }] })),
    }))
  },
  heartPost(id: string) {
    updateGuild((g) => {
      const my = me(g).id
      return { ...g, board: g.board.map((p) => (p.id !== id ? p : { ...p, hearts: p.hearts.includes(my) ? p.hearts.filter((x) => x !== my) : [...p.hearts, my] })) }
    })
  },
  // 친구 응원 (하루 한 번)
  // 이번 주 같이 하기 보상 (길드가 같이 받음, 주에 한 번) + 결과 기록
  claimWeek(rec: WeekRecord) {
    updateGuild((g) => {
      if (g.weekClaimed === rec.week || !rec.done) return g
      const weekLog = [rec, ...(g.weekLog ?? []).filter((w) => w.week !== rec.week)].slice(0, 12)
      return addFeed({ ...g, weekClaimed: rec.week, weekLog, gold: g.gold + RULES.weekReward }, '🎉', `이번 주 같이 하기 완료! 길드 코인 +${RULES.weekReward}`)
    })
  },
  // 지난주 결과만 남기기 (보상 없이, 다음 주가 되면 한 번)
  logWeek(rec: WeekRecord) {
    updateGuild((g) => ((g.weekLog ?? []).some((w) => w.week === rec.week) ? g : { ...g, weekLog: [rec, ...(g.weekLog ?? [])].slice(0, 12) }))
  },

  // 친구에게 의견 부탁하기 / 취소 (내 거래만, 3일 뒤 만료)
  askFeedback(proposalId: string) {
    updateGuild((g) => ({
      ...g,
      proposals: g.proposals.map((p) => (p.id === proposalId && p.proposerId === me(g).id ? { ...p, ask: { at: now(), until: now() + 3 * 86_400_000 } } : p)),
    }))
  },
  cancelAsk(proposalId: string) {
    updateGuild((g) => ({ ...g, proposals: g.proposals.map((p) => (p.id === proposalId && p.proposerId === me(g).id && p.ask ? { ...p, ask: { ...p.ask, canceled: true } } : p)) }))
  },

  // 내 활동을 길드에 보이기/숨기기 (피크민 문서 02: 공개 범위는 본인이 고름). 진행도 집계에는 그대로 들어간다.
  setHideActs(hide: boolean) {
    updateGuild((gg) => ({ ...gg, members: gg.members.map((m) => (m.isMe ? { ...m, hideActs: hide } : m)) }))
  },

  cheer(memberId: string): string | null {
    const g = state.guild!
    const key = `${me(g).id}>${memberId}`
    if (g.cheers[key] === today()) return '오늘은 이미 응원했어요.'
    updateGuild((gg) =>
      addFeed({ ...gg, cheers: { ...gg.cheers, [key]: today() } }, '📣', `${me(gg).nickname}님이 ${memberName(gg, memberId)}님을 응원했어요.`),
    )
    return null
  },

  // 고양이 질문에 답하기 (하루 3번까지 기분이 올라요)
  answerCat() {
    set((s) => {
      const d = s.daily.date === today() ? s.daily : freshDaily()
      const talks = (d.talks ?? 0) + 1
      if (!s.guild || talks > RULES.talksPerDay) return { ...s, daily: { ...d, talks } }
      const cat = catNow(s.guild.cat)
      return { ...s, daily: { ...d, talks }, guild: { ...s.guild, cat: { ...cat, mood: Math.min(100, cat.mood + 5) } } }
    })
  },

  toggleEquip(itemId: string) {
    updateGuild((g) => {
      const item = itemOf(itemId)!
      if (item.slot === 'outfit' && !OUTFIT_OPEN) return g
      const on = g.cat.equipped.includes(itemId)
      // 옷은 하나만, 가구는 같은 자리(spot)에 하나만
      const others = g.cat.equipped.filter((id) => id !== itemId && (item.slot === 'room' ? !item.spot || itemOf(id)?.spot !== item.spot : itemOf(id)?.slot !== item.slot))
      return { ...g, cat: { ...g.cat, equipped: on ? others : [...others, itemId] } }
    })
  },

  // 데모용 — 가짜 시세일 때만 쓴다. 실제 종가로 돌 때는 날짜를 우리가 만들지 않는다.
  nextDay() {
    if (isRealPrices()) return
    set((s) => {
      const ns = { ...s, day: s.day + 1 }
      return ns.guild ? { ...ns, guild: addFeed({ ...ns.guild, day: ns.day }, '📅', `하루가 지났어요 (거래일 ${ns.day}).`) } : ns
    })
  },
  // 처음 들어올 때 약관 동의
  agree(news: boolean) {
    set((s) => ({ ...s, consent: { age14: true, terms: true, privacy: true, news, at: now() } }))
  },
  setAccount(account: NonNullable<GameState['account']>) {
    set((s) => ({ ...s, account }))
  },
  // 다른 구글 계정으로 바뀌면 이 기기 기록을 비우고 서버 기록을 받는다 (동의·계정만 남김)
  resetForAccount() {
    set((s) => ({ ...initial, consent: s.consent, account: s.account, daily: freshDaily(), prefs: DEFAULT_PREFS, streak: { count: 0, last: '' }, watch: [], guides: [], decor: {}, learn: { track: 'basic', done: {}, built: {}, basicRev: BASIC_REV } }))
  },
  reset() {
    set(() => ({ ...initial, daily: freshDaily(), prefs: DEFAULT_PREFS, streak: { count: 0, last: '' }, watch: [], guides: [], decor: {}, learn: { track: 'basic', done: {}, built: {}, basicRev: BASIC_REV } }))
  },
}

function writeRetro(proposalId: string, authorId: string, text: string, parts?: [string, string, string]) {
  updateGuild((g) => {
    const p = g.proposals.find((x) => x.id === proposalId)
    if (!p || g.retros.some((r) => r.proposalId === proposalId && r.authorId === authorId)) return g
    const role = p.proposerId === authorId ? 'proposer' : 'opponent'
    const ng: Guild = addAct({ ...g, retros: [...g.retros, { id: uid(), proposalId, authorId, role, text, parts, at: now() }] }, authorId, 'retro', `retro:${authorId}:${proposalId}`, '투자 결정을 돌아봤어요')
    const withExp = addExp(ng, RULES.exp.retro, `${memberName(g, authorId)}님의 돌아보기`)
    // 내가 쓴 돌아보기면 코인도
    return g.members.find((m) => m.id === authorId)?.isMe ? addFeed({ ...withExp, gold: withExp.gold + RULES.retroCoin }, '🪞', `돌아보기를 썼어요 · 코인 +${RULES.retroCoin}`) : withExp
  })
}

// 복기를 써야 하는 사람인지
export function mustRetro(g: Guild, p: Proposal, memberId: string) {
  if (p.status !== 'sold') return false
  return p.proposerId === memberId && !g.retros.some((r) => r.proposalId === p.id && r.authorId === memberId)
}
