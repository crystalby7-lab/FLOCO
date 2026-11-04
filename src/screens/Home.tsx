// 홈: 길드 고양이 방 · 상태 · 돌보기 · 지금 할 일 · 오늘의 미션 · 자동 훈련 (F7·F8) · 길드 소식
import { useEffect, useState } from 'react'
import { actions, catNow, me, memberName, mustRetro, RULES, today, trainingAvailable, unlocked, useGame, vault } from '../store'
import { changePct, tickerOf } from '../data/market'
import { QUESTS } from '../data/quests'
import { ART, CatFace } from '../components/CatView'
import { Playground, timeOfDay, type PlayEvent } from '../components/Playground'
import { Gold } from '../components/ui'
import type { Tab } from '../App'

function useTick(ms = 30_000) {
  const [, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((t) => t + 1), ms)
    return () => clearInterval(id)
  }, [ms])
}

const timeAgo = (at: number) => {
  const m = Math.floor((Date.now() - at) / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}시간 전` : `${Math.floor(h / 24)}일 전`
}

const feedTone = (icon: string) =>
  ['✅', '📈', '🎉', '🔓', '✨', '🎁'].includes(icon) ? 'moss' : ['📉', '🙅', '⚠️', '✋'].includes(icon) ? 'berry' : ['💡', '👍', '📘'].includes(icon) ? 'honey' : ''

const GREETING = { morning: '좋은 아침이에요', day: '오후도 힘내요', evening: '오늘 하루 어땠어요?', night: '조용한 밤이에요' }

type Care = 'feed' | 'snack' | 'toy' | 'boba' | 'bath'
const CARE: { id: Care; label: string; art: string; price: number; msg: string }[] = [
  { id: 'feed', label: '밥', art: 'side', price: 100, msg: '밥 그릇을 놓았어요' },
  { id: 'snack', label: '간식', art: 'hug', price: 180, msg: '생선 인형을 줬어요' },
  { id: 'toy', label: '놀기', art: 'toy', price: 150, msg: '장난감을 흔들었어요' },
  { id: 'boba', label: '버블티', art: 'boba', price: 200, msg: '버블티를 줬어요' },
  { id: 'bath', label: '목욕', art: 'bath', price: RULES.bathPrice, msg: '보글보글 목욕 중' },
]

export function Home({ go }: { go: (t: Tab) => void }) {
  useTick()
  const s = useGame()
  const g = s.guild!
  const cat = catNow(g.cat)
  const train = trainingAvailable(g.cat)
  const myId = me(g).id
  const v = vault(g, s.day)
  const tod = timeOfDay()
  const [toast, setToast] = useState('')
  const [ev, setEv] = useState<PlayEvent>(null)

  const waiting = g.proposals.filter((p) => p.status === 'voting' && !p.votes.some((x) => x.memberId === myId))
  const retros = g.proposals.filter((p) => mustRetro(g, p, myId))
  const nextQuest = QUESTS.find((q) => !s.quests[q.id]?.done && (q.region === 'village' || unlocked(s).has('invest')))
  const days = Math.max(1, Math.floor((Date.now() - g.createdAt) / 86_400_000) + 1)

  const status =
    cat.hunger < 30 ? '배가 고프대요' : (cat.clean ?? 80) < 35 ? '씻고 싶대요' : cat.mood < 30 ? '조금 시무룩해요' : cat.mood >= 75 ? '기분이 최고예요' : tod === 'night' ? '졸린 눈을 비벼요' : '느긋하게 쉬고 있어요'

  // 고양이 혼잣말: 지금 길드 상황에서 뽑는다
  const lines: string[] = [
    `금고에 ${v.cash.toLocaleString()}G 있대`,
    tod === 'morning' ? '아침 공기 좋다' : tod === 'night' ? '하암… 졸려' : '창밖 구경 중',
    `${g.members.find((m) => !m.isMe)?.nickname ?? '친구'}는 뭐 하고 있을까`,
  ]
  if (waiting[0]) lines.push(`${memberName(g, waiting[0].proposerId)}가 낸 제안 봤어?`)
  if (nextQuest) lines.push(`'${nextQuest.title}' 같이 배울래?`)
  v.holdings.forEach((h) => lines.push(`${tickerOf(h.p.ticker).name} ${h.pct >= 0 ? '올랐대!' : '조금 내렸대'}`))
  if (v.holdings[0]) {
    const ch = changePct(v.holdings[0].p.ticker, s.day, 1)
    if (Math.abs(ch) > 1) lines.push(`오늘 많이 움직였네… 이유가 아직 맞을까?`)
  }

  const care = (c: (typeof CARE)[number]) => {
    const err = c.id === 'bath' ? actions.bathe() : actions.buyItem(c.id)
    setToast(err ?? c.msg)
    if (!err) setEv({ type: c.id, key: Date.now() })
    setTimeout(() => setToast(''), 1800)
  }

  const d = s.daily.date === today() ? s.daily : { quest: false, vote: false, care: false, claimed: false }
  const missions = [
    { done: d.quest, label: '퀘스트 하나 배우기', go: () => go('map') },
    { done: d.vote, label: '친구 제안에 의견 내기', go: () => go('invest') },
    { done: d.care, label: `${cat.name} 돌보기`, go: () => document.querySelector('.care-row')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) },
  ]
  const doneCount = missions.filter((m) => m.done).length

  const p = waiting[0]
  const r = retros[0]

  const now = new Date()
  const dateLabel = `${now.getMonth() + 1}월 ${now.getDate()}일 ${'일월화수목금토'[now.getDay()]}요일`

  return (
    <div className="tab-panel home diary">
      <header className="d-head">
        <span className="d-date">{dateLabel}</span>
        <h1 className="hand">{GREETING[tod]}</h1>
        <p className="d-sub">
          {g.name} · 함께한 지 {days}일째
        </p>
      </header>

      <figure className="polaroid">
        <span className="tape tl" aria-hidden />
        <span className="tape tr" aria-hidden />
        <div className="polaroid-photo">
          <Playground cat={cat} event={ev} lines={s.prefs.chatter ? lines : []} onPose={actions.seePose} height={280} catHeight={118} />
          <span className="tap-hint">{cat.name}를 눌러보세요</span>
        </div>
        <figcaption>
          <span className="hand">
            {cat.name}는 {status}
          </span>
          <span className="lv-sticker">Lv.{cat.level}</span>
        </figcaption>
      </figure>

      <section className="paper">
        <h3 className="paper-title">오늘의 {cat.name}</h3>
        <div className="meters three">
          <Meter label="배부름" value={cat.hunger} />
          <Meter label="기분" value={cat.mood} tone="pinkish" />
          <Meter label="청결" value={cat.clean ?? 80} tone="mint" />
        </div>
        <div className="exp-line">
          <span className="small sub">경험치</span>
          <div className="bar grow">
            <div style={{ width: `${(cat.exp / RULES.expPerLevel) * 100}%` }} />
          </div>
          <span className="small num">
            {cat.exp}/{RULES.expPerLevel}
          </span>
        </div>
        <p className="margin-note">경험치는 이유를 쓰고, 걱정을 말하고, 같이 돌아볼 때만 올라요</p>
        <div className="care-row">
          {CARE.map((c, i) => (
            <button key={c.id} className="care sticker" style={{ ['--tilt' as string]: `${[-4, 3, -2, 4, -3][i]}deg` }} onClick={() => care(c)}>
              <span className="sticker-face">
                <img src={ART[c.art]} alt="" />
              </span>
              <b>{c.label}</b>
              <small>{c.price}G</small>
            </button>
          ))}
        </div>
      </section>

      <section className="postit">
        <span className="tape" aria-hidden />
        <div className="peek" aria-hidden>
          <CatFace cat={cat} size={84} />
        </div>
        {p ? (
          <>
            <div className="postit-label">친구가 의견을 기다려요</div>
            <div className="postit-text hand">
              {memberName(g, p.proposerId)}가 {tickerOf(p.ticker).name}를 사자고 했어요
            </div>
            <p className="postit-quote">"{p.reasons[0]}"</p>
            <button className="btn btn-primary btn-block" onClick={() => go('invest')}>
              이유 읽고 의견 쓰기
            </button>
          </>
        ) : r ? (
          <>
            <div className="postit-label">돌아볼 차례예요</div>
            <div className="postit-text hand">{tickerOf(r.ticker).name}, 내 판단은 어땠을까?</div>
            <button className="btn btn-primary btn-block" onClick={() => go('invest')}>
              빨간 펜으로 돌아보기 · +{RULES.exp.retro}
            </button>
          </>
        ) : nextQuest ? (
          <>
            <div className="postit-label">오늘 배울 것</div>
            <div className="postit-text hand">{nextQuest.title}</div>
            <p className="postit-quote">
              {nextQuest.summary} · 끝내면 금고 +{RULES.questReward}G
            </p>
            <button className="btn btn-primary btn-block" onClick={() => go('map')}>
              지도 펼치기
            </button>
          </>
        ) : (
          <>
            <div className="postit-label">오늘은 여유로워요</div>
            <div className="postit-text hand">새 투자 아이디어를 일기에 적어볼까요?</div>
            <button className="btn btn-primary btn-block" onClick={() => go('invest')}>
              투자 일기 쓰기
            </button>
          </>
        )}
      </section>

      <section className="paper lined checklist">
        <div className="paper-row">
          <h3 className="paper-title">오늘 할 일</h3>
          <span className="hand count">{doneCount}/3</span>
        </div>
        <ul>
          {missions.map((m) => (
            <li key={m.label}>
              <button className={`todo ${m.done ? 'done' : ''}`} onClick={m.go} disabled={m.done}>
                <span className="box">{m.done && <Tick />}</span>
                <span className="grow todo-text">{m.label}</span>
                {!m.done && <span className="go">하러 가기 ›</span>}
              </button>
            </li>
          ))}
        </ul>
        <button className="btn btn-primary btn-block" disabled={doneCount < 3 || d.claimed} onClick={actions.claimDaily}>
          {d.claimed ? '오늘 도장 받았어요' : `다 하면 출석 도장 · +${RULES.dailyReward}G`}
        </button>
      </section>

      <section className="paper train">
        <img className="train-art" src={ART[train.full ? 'stretch' : 'walk']} alt="" />
        <div className="grow">
          <h3 className="paper-title small">혼자 하는 훈련</h3>
          <p className="sub small">
            {train.full ? '보상이 가득 찼어요' : `한 시간에 ${RULES.goldPerHour}G · 최대 ${RULES.trainCapHours}시간`}
          </p>
          <div className="bar thin">
            <div style={{ width: `${(train.hours / RULES.trainCapHours) * 100}%` }} />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" disabled={train.gold <= 0} onClick={actions.claimTraining}>
          <Gold value={train.gold} size={14} />
        </button>
      </section>

      <section className="paper journal">
        <h3 className="paper-title">길드 일지</h3>
        <ul>
          {g.feed.slice(0, 10).map((f) => (
            <li key={f.id}>
              <span className="j-time">{timeAgo(f.at)}</span>
              <span className={`j-dot ${feedTone(f.icon)}`} />
              <span className="j-text">{f.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}

function Meter({ label, value, tone = '' }: { label: string; value: number; tone?: string }) {
  const on = Math.round(value / 10)
  return (
    <div className={`meter ${tone}`}>
      <div className="meter-top">
        <span>{label}</span>
        <b>{Math.round(value)}</b>
      </div>
      <div className="meter-segs">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} className={i < on ? 'on' : ''} />
        ))}
      </div>
    </div>
  )
}

function Tick() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5 L6.5 12 L13 4.5" />
    </svg>
  )
}
