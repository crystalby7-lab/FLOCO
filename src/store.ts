// 게임 상태 저장소
// 지금은 브라우저(localStorage)에 저장합니다. Firebase 연결 시 이 파일의 load/save와
// 각 action만 Firestore 읽기/쓰기로 바꾸면 화면 코드는 그대로 쓸 수 있습니다.

import { useSyncExternalStore } from 'react'
import type { AvatarLook, Cat, Daily, GameState, Guild, Member, Post, Prefs, Proposal, AiResult, Survey } from './types'
import { QUESTS } from './data/quests'
import { priceOf, tickerOf } from './data/market'
import { itemOf } from './data/shop'
import { reviewReasons } from './aiReview'

const KEY = 'floco-mvp-v1'

export const RULES = {
  startGold: 100_000,
  goldPerHour: 60, // F8 자동 훈련
  trainCapHours: 8, // 상한: 8시간치까지만 쌓임
  hungerDecayPerHour: 4,
  moodDecayPerHour: 3,
  cleanDecayPerHour: 2,
  questReward: 200, // 퀘스트 첫 완료 시 금고 골드 (레벨은 근거·돌아보기로만)
  dailyReward: 300, // 오늘의 미션 3개 완료 보상
  talksPerDay: 3, // 고양이 질문에 답하면 기분 +5 (하루 3번)
  floor: 10, // 손실이 나도, 오래 안 들어와도 고양이는 이 아래로 안 떨어짐
  expPerLevel: 100,
  exp: { proposalPass: 15, opposeReason: 5, retro: 30 },
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

const initial: GameState = { version: 4, user: null, guild: null, quests: {}, day: 0, daily: freshDaily(), tutorialDone: false, prefs: DEFAULT_PREFS, streak: { count: 0, last: '' } }

// 예전 버전에 저장된 데이터도 새 항목을 채워서 불러온다
function migrate(raw: Partial<GameState>): GameState {
  const s = { ...initial, ...raw } as GameState
  if (!s.daily || s.daily.date !== today()) s.daily = freshDaily()
  if (s.user) s.tutorialDone = true
  s.prefs = { ...DEFAULT_PREFS, ...(s.prefs ?? {}) }
  s.streak = s.streak ?? { count: 0, last: '' }
  if (s.guild) {
    const g = s.guild as Partial<Guild> & Guild
    s.guild = {
      ...g,
      inventory: g.inventory ?? {},
      board: g.board ?? seedBoard(g.members),
      cheers: g.cheers ?? {},
      levelSeen: g.levelSeen ?? g.cat.level,
      createdAt: g.createdAt ?? s.user?.joinedAt ?? Date.now(),
      cat: { ...g.cat, clean: g.cat.clean ?? 80 },
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

export function questsDone(s: GameState, region: 'village' | 'forest') {
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

// 금고 평가: 현금 + 보유 종목 지금 가격
export function vault(g: Guild, day: number) {
  const holdings = g.proposals
    .filter((p) => p.status === 'holding' && p.qty && p.buyPrice)
    .map((p) => {
      const now = priceOf(p.ticker, day)
      return { p, value: p.qty! * now, pnl: p.qty! * (now - p.buyPrice!), pct: ((now - p.buyPrice!) / p.buyPrice!) * 100 }
    })
  const invested = holdings.reduce((a, h) => a + h.value, 0)
  const pnl = holdings.reduce((a, h) => a + h.pnl, 0)
  const realized = g.proposals
    .filter((p) => p.status === 'sold' && p.qty && p.buyPrice && p.sellPrice)
    .reduce((a, p) => a + p.qty! * (p.sellPrice! - p.buyPrice!), 0)
  return { cash: g.gold, invested, total: g.gold + invested, pnl, realized, holdings }
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
export const majority = (g: Guild) => Math.floor(g.members.length / 2) + 1

// ───────── 내부 수정 도우미 ─────────

function updateGuild(fn: (g: Guild, s: GameState) => Guild) {
  set((s) => (s.guild ? { ...s, guild: fn(s.guild, s) } : s))
}

// 데모 친구들이 먼저 남겨둔 한마디
function seedBoard(members: Member[]): Post[] {
  const bots = members.filter((m) => m.isBot)
  const lines = ['이번 주엔 ETF 숲까지 가보자!', '주니 밥 내가 줬어 ㅎㅎ', '제안 올리기 전에 수수료 꼭 확인하기']
  return bots.map((m, i) => ({ id: uid(), memberId: m.id, text: lines[i % lines.length], at: Date.now() - (i + 1) * 3_600_000, hearts: [] }))
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

function newCat(name: string): Cat {
  const t = now()
  return { name, level: 1, exp: 0, hunger: 70, mood: 70, clean: 80, updatedAt: t, lastClaimAt: t - 2 * 3_600_000, equipped: [] }
}

// ───────── 데모 친구 (Firebase 연결 전까지 친구 역할) ─────────

const BOT_OPPOSE = [
  '한 산업에만 몰려 있어서 너무 크게 흔들릴 것 같아.',
  '수수료가 다른 ETF보다 높아서 오래 들고 있기엔 아쉬워.',
  '지금 금고에서 너무 큰 비중이라 나눠서 사는 게 좋겠어.',
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

function botMembers(): Member[] {
  return [
    { id: 'bot-haneul', nickname: '하늘', isBot: true },
    { id: 'bot-doyun', nickname: '도윤', isBot: true },
  ]
}

function seedProposal(): Proposal {
  return {
    id: uid(),
    proposerId: 'bot-haneul',
    ticker: 'SP500',
    amount: 45_000,
    reasons: [
      '미국 대표 회사 500곳을 한 번에 담고 있어서 한 회사가 떨어져도 덜 흔들리고, 총보수도 0.07%로 낮다.',
      '원·달러 환율이 오르내리면 수익이 달라지는 점은 아직 확인 못 했다.',
      '나스닥100 ETF도 봤는데 기술 기업에만 몰려 있어서 이번엔 사지 않기로 했다.',
    ],
    ai: { pass: true, message: '근거가 확인됐어요.' },
    votes: [{ memberId: 'bot-haneul', agree: true }],
    status: 'voting',
    createdDay: 0,
  }
}

function scheduleBotVotes(proposalId: string) {
  const g = state.guild
  if (!g) return
  const p = g.proposals.find((x) => x.id === proposalId)
  if (!p || p.status !== 'voting') return
  const waiting = g.members.filter((m) => m.isBot && !p.votes.some((v) => v.memberId === m.id))
  waiting.forEach((bot, i) => {
    setTimeout(() => {
      const agree = Math.random() < 0.7
      castVote(proposalId, bot.id, agree, agree ? undefined : pick(BOT_OPPOSE))
    }, 1200 + i * 1400)
  })
}

function scheduleBotRetros(proposalId: string) {
  const g = state.guild
  if (!g) return
  const p = g.proposals.find((x) => x.id === proposalId)
  if (!p) return
  const writers = g.members.filter(
    (m) => m.isBot && (m.id === p.proposerId || p.votes.some((v) => v.memberId === m.id && !v.agree)),
  )
  writers.forEach((bot, i) => {
    setTimeout(() => {
      const role = bot.id === p.proposerId ? 'proposer' : 'opponent'
      writeRetro(proposalId, bot.id, pick(role === 'proposer' ? BOT_RETRO_PROPOSER : BOT_RETRO_OPPONENT))
    }, 1500 + i * 1500)
  })
}

// ───────── 투표 결과 처리 (F5) ─────────
// 실제 서비스에서는 서버 함수가 한 번에 처리해 동시 투표 충돌을 막는다.

function resolve(g: Guild, s: GameState, proposalId: string): Guild {
  const p = g.proposals.find((x) => x.id === proposalId)
  if (!p || p.status !== 'voting') return g
  const yes = p.votes.filter((v) => v.agree).length
  const no = p.votes.filter((v) => !v.agree).length
  const need = majority(g)
  const t = tickerOf(p.ticker)

  if (yes >= need) {
    if (g.gold < p.amount || Math.floor(p.amount / priceOf(p.ticker, s.day)) < 1) {
      const rejected: Proposal = { ...p, status: 'rejected' }
      return addFeed({ ...g, proposals: g.proposals.map((x) => (x.id === p.id ? rejected : x)) }, '⚠️', '금고 골드가 부족해 매수하지 못했어요.')
    }
    const price = priceOf(p.ticker, s.day)
    const qty = Math.floor(p.amount / price)
    const cost = qty * price
    const bought: Proposal = { ...p, status: 'holding', buyPrice: price, qty }
    return addFeed(
      { ...g, gold: g.gold - cost, proposals: g.proposals.map((x) => (x.id === p.id ? bought : x)) },
      '✅',
      `모두 좋대요! ${t.name} ${qty}주를 ${price.toLocaleString()}골드에 샀어요.`,
    )
  }
  if (no > g.members.length - need) {
    const rejected: Proposal = { ...p, status: 'rejected' }
    return addFeed({ ...g, proposals: g.proposals.map((x) => (x.id === p.id ? rejected : x)) }, '🙅', `${t.name} 제안은 이번엔 패스!`)
  }
  return g
}

function castVote(proposalId: string, memberId: string, agree: boolean, reason?: string) {
  updateGuild((g, s) => {
    const p = g.proposals.find((x) => x.id === proposalId)
    if (!p || p.status !== 'voting' || p.votes.some((v) => v.memberId === memberId)) return g
    let ng: Guild = {
      ...g,
      proposals: g.proposals.map((x) => (x.id === proposalId ? { ...x, votes: [...x.votes, { memberId, agree, reason }] } : x)),
    }
    const who = memberName(g, memberId)
    ng = addFeed(ng, agree ? '👍' : '✋', agree ? `${who}님이 좋대요.` : `${who}님이 걱정했어요: "${reason}"`)
    if (!agree && reason) ng = addExp(ng, RULES.exp.opposeReason, `${who}님의 걱정 한 줄`)
    return resolve(ng, s, proposalId)
  })
}

// ───────── 화면에서 쓰는 action ─────────

export const actions = {
  createUser(nickname: string, grade: string) {
    set((s) => ({ ...s, user: { id: 'me', nickname, grade, joinedAt: now() } }))
  },

  createGuild(guildName: string, catName: string) {
    set((s) => {
      if (!s.user) return s
      const members: Member[] = [{ id: s.user.id, nickname: s.user.nickname, isMe: true }, ...botMembers()]
      let guild: Guild = {
        name: guildName,
        code: Math.random().toString(36).slice(2, 8).toUpperCase(),
        members,
        gold: RULES.startGold,
        cat: newCat(catName),
        proposals: [seedProposal()],
        retros: [],
        feed: [],
        ownedItems: [],
        inventory: { feed: 2, toy: 1 },
        board: seedBoard(members),
        cheers: {},
        levelSeen: 1,
        createdAt: now(),
      }
      guild = addFeed(guild, '🐣', `${guildName} 길드가 만들어지고 ${catName}가 태어났어요!`)
      guild = addFeed(guild, '💡', '하늘님이 미국 S&P500 ETF 매수를 제안했어요. 투표해 주세요!')
      return { ...s, guild }
    })
  },

  joinGuild(code: string) {
    set((s) => {
      if (!s.user) return s
      const members: Member[] = [...botMembers(), { id: s.user.id, nickname: s.user.nickname, isMe: true }]
      let guild: Guild = {
        name: '데모 길드',
        code: code.toUpperCase(),
        members,
        gold: RULES.startGold,
        cat: newCat('모찌'),
        proposals: [seedProposal()],
        retros: [],
        feed: [],
        ownedItems: [],
        inventory: { feed: 2, toy: 1 },
        board: seedBoard(members),
        cheers: {},
        levelSeen: 1,
        createdAt: now(),
      }
      guild = addFeed(guild, '👋', `${s.user.nickname}님이 길드에 들어왔어요!`)
      return { ...s, guild }
    })
  },

  claimTraining() {
    updateGuild((g) => {
      const { gold } = trainingAvailable(g.cat)
      if (gold <= 0) return g
      return addFeed({ ...g, gold: g.gold + gold, cat: { ...catNow(g.cat), lastClaimAt: now() } }, '🏋️', `자동 훈련 보상 ${gold}골드를 받았어요.`)
    })
  },

  completeQuest(questId: string, score: number) {
    set((s) => {
      const quest = QUESTS.find((q) => q.id === questId)!
      const first = !s.quests[questId]?.done
      let ns: GameState = { ...s, quests: { ...s.quests, [questId]: { done: true, score: Math.max(score, s.quests[questId]?.score ?? 0), at: now() } } }
      if (first && ns.guild) {
        let g = addFeed(
          { ...ns.guild, gold: ns.guild.gold + RULES.questReward },
          '📘',
          `${ns.user?.nickname}님이 '${quest.title}' 퀘스트를 완료했어요 · 금고 +${RULES.questReward}G`,
        )
        if (questsDone(ns, 'village') && !questsDone(s, 'village')) g = addFeed(g, '🔓', '기초 마을 완료! 공동 투자 제안과 ETF 숲이 열렸어요.')
        if (quest.unlocks) g = addFeed(g, '🔓', 'ETF 비교 도구가 해금됐어요.')
        ns = { ...ns, guild: g }
      }
      return ns
    })
    markDaily('quest')
  },

  // F4: 이유 3칸 → AI 검토 → 통과하면 길드에 올라감
  propose(ticker: string, amount: number, reasons: [string, string, string]): AiResult {
    const g = state.guild!
    const myId = me(g).id
    const prev = g.proposals.filter((p) => p.proposerId === myId).map((p) => p.reasons[0])
    const ai = reviewReasons(reasons, prev)
    if (!ai.pass) return ai
    if (amount > g.gold) return { pass: false, message: '금고 골드보다 많은 금액이에요.', hint: '금액을 줄여주세요.' }
    if (amount < priceOf(ticker, state.day)) return { pass: false, message: '1주 가격보다 금액이 적어요.', hint: '금액을 늘리거나 다른 종목을 골라보세요.' }
    const p: Proposal = {
      id: uid(),
      proposerId: myId,
      ticker,
      amount,
      reasons,
      ai,
      votes: [{ memberId: myId, agree: true }],
      status: 'voting',
      createdDay: state.day,
    }
    updateGuild((gg) => {
      let ng = addFeed({ ...gg, proposals: [p, ...gg.proposals] }, '💡', `${me(gg).nickname}님이 ${tickerOf(ticker).name} 매수를 제안했어요.`)
      ng = addExp(ng, RULES.exp.proposalPass, '이유 확인 통과')
      return ng
    })
    scheduleBotVotes(p.id)
    return ai
  },

  vote(proposalId: string, agree: boolean, reason?: string) {
    castVote(proposalId, me(state.guild!).id, agree, reason)
    scheduleBotVotes(proposalId)
    markDaily('vote')
  },

  sell(proposalId: string) {
    updateGuild((g, s) => {
      const p = g.proposals.find((x) => x.id === proposalId)
      if (!p || p.status !== 'holding' || !p.qty || !p.buyPrice) return g
      const price = priceOf(p.ticker, s.day)
      const income = p.qty * price
      const profit = income - p.qty * p.buyPrice
      const sold: Proposal = { ...p, status: 'sold', sellPrice: price, soldDay: s.day }
      const ng = { ...g, gold: g.gold + income, proposals: g.proposals.map((x) => (x.id === p.id ? sold : x)) }
      return addFeed(
        ng,
        profit >= 0 ? '📈' : '📉',
        `${tickerOf(p.ticker).name}를 팔았어요 (${profit >= 0 ? '+' : ''}${profit.toLocaleString()}골드). 같이 돌아봐요!`,
      )
    })
    scheduleBotRetros(proposalId)
  },

  writeMyRetro(proposalId: string, parts: [string, string, string]) {
    const text = `맞았던 것: ${parts[0]} / 빗나간 것: ${parts[1]} / 다음엔: ${parts[2]}`
    writeRetro(proposalId, me(state.guild!).id, text, parts)
  },

  claimDaily() {
    set((s) => {
      const d = s.daily
      if (!s.guild || d.claimed || !(d.quest && d.vote && d.care)) return s
      return {
        ...s,
        daily: { ...d, claimed: true },
        guild: addFeed({ ...s.guild, gold: s.guild.gold + RULES.dailyReward }, '🎁', `오늘의 미션 완료 · 금고 +${RULES.dailyReward}G`),
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

  renameGuild(name: string) {
    updateGuild((g) => addFeed({ ...g, name }, '✏️', `길드 이름이 ${name}(으)로 바뀌었어요.`))
  },

  // 길드 나가기: 내 계정은 그대로 두고 길드만 비운다 (다시 만들거나 초대 코드로 들어갈 수 있다)
  // 서버 연결 후에는 나간 사실을 길드에 알리고 고양이·금고는 남은 친구들에게 남는다.
  leaveGuild() {
    set((s) => ({ ...s, guild: null }))
  },

  setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    set((s) => ({ ...s, prefs: { ...s.prefs, [key]: value } }))
  },

  // 상점에서 사기: 먹이·장난감은 보관함 개수만 늘고, 홈에서 '주기'를 눌러야 고양이가 받는다
  buyItem(itemId: string): string | null {
    const g = state.guild!
    const item = itemOf(itemId)!
    if (g.gold < item.price) return '금고 골드가 부족해요.'
    if (item.kind !== 'food' && g.ownedItems.includes(itemId)) return '이미 가지고 있어요.'
    updateGuild((gg) => {
      const ng: Guild = { ...gg, gold: gg.gold - item.price }
      if (item.kind === 'food') return { ...ng, inventory: { ...ng.inventory, [itemId]: (ng.inventory[itemId] ?? 0) + 1 } }
      return addFeed(
        { ...ng, ownedItems: [...ng.ownedItems, itemId] },
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
      return addFeed(
        { ...gg, cat: ncat, inventory: { ...gg.inventory, [itemId]: (gg.inventory[itemId] ?? 0) - 1 } },
        itemId === 'bath' ? '🛁' : '🍽',
        itemId === 'bath' ? `${me(gg).nickname}님이 ${gg.cat.name}를 씻겨줬어요.` : `${me(gg).nickname}님이 ${gg.cat.name}에게 ${item.name}을(를) 줬어요.`,
      )
    })
    markDaily('care')
    return null
  },

  // 길드 한마디
  postBoard(text: string) {
    const t = text.trim().slice(0, 60)
    if (!t) return
    updateGuild((g) => ({ ...g, board: [{ id: uid(), memberId: me(g).id, text: t, at: Date.now(), hearts: [] }, ...g.board].slice(0, 30) }))
  },
  heartPost(id: string) {
    updateGuild((g) => {
      const my = me(g).id
      return { ...g, board: g.board.map((p) => (p.id !== id ? p : { ...p, hearts: p.hearts.includes(my) ? p.hearts.filter((x) => x !== my) : [...p.hearts, my] })) }
    })
  },
  // 친구 응원 (하루 한 번)
  cheer(memberId: string): string | null {
    const g = state.guild!
    if (g.cheers[memberId] === today()) return '오늘은 이미 응원했어요.'
    updateGuild((gg) =>
      addFeed({ ...gg, cheers: { ...gg.cheers, [memberId]: today() } }, '📣', `${me(gg).nickname}님이 ${memberName(gg, memberId)}님을 응원했어요.`),
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
      const on = g.cat.equipped.includes(itemId)
      const others = g.cat.equipped.filter((id) => id !== itemId && (item.slot === 'room' || itemOf(id)?.slot !== item.slot))
      return { ...g, cat: { ...g.cat, equipped: on ? others : [...others, itemId] } }
    })
  },

  // 데모용
  nextDay() {
    set((s) => {
      const ns = { ...s, day: s.day + 1 }
      return ns.guild ? { ...ns, guild: addFeed(ns.guild, '📅', `하루가 지났어요 (거래일 ${ns.day}).`) } : ns
    })
  },
  reset() {
    set(() => ({ ...initial, daily: freshDaily(), prefs: DEFAULT_PREFS, streak: { count: 0, last: '' } }))
  },
}

function writeRetro(proposalId: string, authorId: string, text: string, parts?: [string, string, string]) {
  updateGuild((g) => {
    const p = g.proposals.find((x) => x.id === proposalId)
    if (!p || g.retros.some((r) => r.proposalId === proposalId && r.authorId === authorId)) return g
    const role = p.proposerId === authorId ? 'proposer' : 'opponent'
    const ng: Guild = { ...g, retros: [...g.retros, { id: uid(), proposalId, authorId, role, text, parts }] }
    return addExp(ng, RULES.exp.retro, `${memberName(g, authorId)}님의 돌아보기`)
  })
}

// 복기를 써야 하는 사람인지
export function mustRetro(g: Guild, p: Proposal, memberId: string) {
  if (p.status !== 'sold') return false
  const involved = p.proposerId === memberId || p.votes.some((v) => v.memberId === memberId && !v.agree)
  return involved && !g.retros.some((r) => r.proposalId === p.id && r.authorId === memberId)
}
