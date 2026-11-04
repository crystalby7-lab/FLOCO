// 홈: 길드 고양이 방 · 상태 · 돌보기 · 지금 할 일 · 오늘의 미션 · 자동 훈련 (F7·F8) · 길드 소식
import { useEffect, useRef, useState } from 'react'
import { actions, catNow, me, memberName, mustRetro, RULES, today, trainingAvailable, unlocked, useGame, vault } from '../store'
import { changePct, tickerOf } from '../data/market'
import { QUESTS } from '../data/quests'
import { ART, CatFace } from '../components/CatView'
import { Backdrop, Playground, timeOfDay, type PlayEvent } from '../components/Playground'
import { ConfirmDialog } from '../components/Page'
import { Lock } from '../components/Icons'
import { itemOf, PLACES } from '../data/shop'
import { pickAsk, type Ask } from '../data/catTalk'
import type { Cat } from '../types'
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
const CARE: { id: Care; label: string; art: string; msg: string }[] = [
  { id: 'feed', label: '밥', art: 'side', msg: '밥 그릇을 놓았어요' },
  { id: 'snack', label: '간식', art: 'hug', msg: '생선 인형을 줬어요' },
  { id: 'toy', label: '장난감', art: 'toy', msg: '장난감을 흔들었어요' },
  { id: 'boba', label: '버블티', art: 'boba', msg: '버블티를 줬어요' },
  { id: 'bath', label: '목욕', art: 'bath', msg: '보글보글 목욕 중' },
]
const WEAR_ART: Record<string, string> = { hoodie: 'hoodie', beret: 'beret', dino: 'dino', duck: 'duck', scarf: 'scarf', box: 'box', cushion: 'sleep', bed: 'bed' }

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
  const [slide, setSlide] = useState(0)
  const [buying, setBuying] = useState<string | null>(null)
  const [asking, setAsking] = useState<Ask | null>(null)
  const track = useRef<HTMLDivElement>(null)

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

  const [sel, setSel] = useState<Care | null>(null)
  const [closet, setCloset] = useState(false)
  const inv = (id: string) => g.inventory[id] ?? 0
  const give = (c: (typeof CARE)[number]) => {
    const err = actions.giveItem(c.id)
    setToast(err ?? c.msg)
    if (!err) {
      setEv({ type: c.id, key: Date.now() })
      if (slide !== 0 && !owns(PLACES[slide].id)) goSlide(0)
    }
    setTimeout(() => setToast(''), 1800)
  }
  const selC = CARE.find((c) => c.id === sel)

  const d = s.daily.date === today() ? s.daily : { quest: false, vote: false, care: false, claimed: false, talks: 0 }
  const talks = d.talks ?? 0
  const hasAsk = talks < RULES.talksPerDay
  const owns = (id: string) => id === 'room' || g.ownedItems.includes(id)

  const onScroll = () => {
    const el = track.current
    if (el) setSlide(Math.round(el.scrollLeft / el.clientWidth))
  }
  const goSlide = (i: number) => track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: 'smooth' })

  const buyPlace = (id: string) => {
    const err = actions.buyItem(id)
    setBuying(null)
    setToast(err ?? `${itemOf(id)!.name} 테마가 열렸어요!`)
    setTimeout(() => setToast(''), 1800)
  }

  const tapCat = () => {
    if (!hasAsk) return false
    setAsking(pickAsk(s, talks))
    return true
  }
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
    <div className="tab-panel home live">
      <section className={`scene tod-${tod}`}>
        <header className="scene-head">
          <div>
            <span className="scene-date">{dateLabel}</span>
            <h1>{GREETING[tod]}</h1>
            <p>
              {g.name} · 함께한 지 {days}일째
            </p>
          </div>
          <span className="lv-chip">Lv.{cat.level}</span>
        </header>
        <div className="places" ref={track} onScroll={onScroll}>
          {PLACES.map((pl, i) => (
            <div key={pl.id} className="place-slide">
              {owns(pl.id) ? (
                i === slide ? (
                  <Playground
                    cat={cat}
                    event={ev}
                    lines={s.prefs.chatter ? lines : []}
                    onPose={actions.seePose}
                    height={330}
                    catHeight={124}
                    place={pl.id}
                    ask={hasAsk}
                    onTapCat={tapCat}
                  />
                ) : (
                  <div className={`room tod-${tod} place-${pl.id}`} style={{ height: 330 }}>
                    <Backdrop place={pl.id} tod={tod} />
                  </div>
                )
              ) : (
                <div className={`room tod-${tod} place-${pl.id} locked`} style={{ height: 330 }}>
                  <Backdrop place={pl.id} tod={tod} />
                  <div className="lock-veil">
                    <span className="lock-ico">
                      <Lock size={18} />
                    </span>
                    <b>{pl.name}</b>
                    <small>{itemOf(pl.id)?.desc}</small>
                    <button className="btn btn-primary btn-sm" onClick={() => setBuying(pl.id)}>
                      잠금 해제 · {itemOf(pl.id)!.price.toLocaleString()}G
                    </button>
                  </div>
                  <span className="lock-cat" aria-hidden>
                    <span className="say">가보고 싶다…</span>
                    <img src={ART.back} alt="" />
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        {slide > 0 && (
          <button className="place-arrow prev" onClick={() => goSlide(slide - 1)} aria-label={PLACES[slide - 1].name}>
            <Chevron />
          </button>
        )}
        {slide < PLACES.length - 1 && (
          <button className="place-arrow next" onClick={() => goSlide(slide + 1)} aria-label={PLACES[slide + 1].name}>
            <Chevron />
          </button>
        )}
        <div className="scene-status">
          <div className="status-row">
            <span className="status-line">
              {cat.name}는 {status}
            </span>
            <button className="closet-btn" onClick={() => setCloset(true)}>
              옷장
            </button>
          </div>
          <div className="pills">
            <Pill label="배부름" value={cat.hunger} tone="honey" />
            <Pill label="기분" value={cat.mood} tone="pink" />
            <Pill label="청결" value={cat.clean ?? 80} tone="mint" />
          </div>
        </div>
      </section>

      <div className="care-wrap care-row">
        <div className="care-dock">
          {CARE.map((c) => (
            <button key={c.id} className={`care-btn ${sel === c.id ? 'on' : ''} ${inv(c.id) ? '' : 'empty'}`} onClick={() => setSel(sel === c.id ? null : c.id)}>
              <span className="care-face">
                <img src={ART[c.art]} alt="" />
                <span className="care-count">{inv(c.id)}</span>
              </span>
              <b>{c.label}</b>
            </button>
          ))}
        </div>
        {selC && (
          <div className="give-bar">
            <span className="grow">
              <b>{itemOf(selC.id)!.name}</b>
              <small>보유 {inv(selC.id)}개</small>
            </span>
            {inv(selC.id) > 0 ? (
              <button className="btn btn-primary btn-sm" onClick={() => give(selC)}>
                {cat.name}에게 주기
              </button>
            ) : (
              <button className="btn btn-sm give-shop" onClick={() => go('shop')}>
                상점에서 사기 ›
              </button>
            )}
          </div>
        )}
      </div>

      <section className="card exp-card">
        <div className="exp-line">
          <span className="exp-label">경험치</span>
          <div className="bar grow">
            <div style={{ width: `${(cat.exp / RULES.expPerLevel) * 100}%` }} />
          </div>
          <span className="small num">
            {cat.exp}/{RULES.expPerLevel}
          </span>
        </div>
        <p className="exp-note">이유를 쓰고, 걱정을 말하고, 같이 돌아볼 때 올라요</p>
      </section>

      <section className="card next-card">
        <img className="perch" src={ART.lielook} alt="" aria-hidden />
        {p ? (
          <>
            <span className="next-label">친구가 의견을 기다려요</span>
            <h2>
              {memberName(g, p.proposerId)}가 {tickerOf(p.ticker).name}를 사자고 했어요
            </h2>
            <p className="next-quote">"{p.reasons[0]}"</p>
            <button className="btn btn-primary btn-block" onClick={() => go('invest')}>
              이유 읽고 의견 쓰기
            </button>
          </>
        ) : r ? (
          <>
            <span className="next-label">돌아볼 차례예요</span>
            <h2>{tickerOf(r.ticker).name}, 내 판단은 어땠을까?</h2>
            <button className="btn btn-primary btn-block" onClick={() => go('invest')}>
              같이 돌아보기 · +{RULES.exp.retro}
            </button>
          </>
        ) : nextQuest ? (
          <>
            <span className="next-label">오늘 배울 것</span>
            <h2>{nextQuest.title}</h2>
            <p className="next-quote">
              {nextQuest.summary} · 끝내면 금고 +{RULES.questReward}G
            </p>
            <button className="btn btn-primary btn-block" onClick={() => go('map')}>
              지도로 가기
            </button>
          </>
        ) : (
          <>
            <span className="next-label">오늘은 여유로워요</span>
            <h2>새 투자 아이디어를 제안해볼까요?</h2>
            <button className="btn btn-primary btn-block" onClick={() => go('invest')}>
              제안 쓰기
            </button>
          </>
        )}
      </section>

      <section className="card checklist">
        <div className="card-row">
          <h3 className="card-title">오늘 할 일</h3>
          <span className="count">{doneCount}/3</span>
        </div>
        <div className="mission-bar">
          <div style={{ width: `${(doneCount / 3) * 100}%` }} />
          <img src={ART.walk} alt="" style={{ left: `${(doneCount / 3) * 100}%` }} aria-hidden />
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
          {d.claimed ? '오늘 출석 보상 받았어요' : `다 하면 출석 보상 · +${RULES.dailyReward}G`}
        </button>
      </section>

      <section className="card train">
        <div className="train-art">
          <img src={ART[train.full ? 'stretch' : 'walk']} alt="" className={train.full ? '' : 'jog'} />
        </div>
        <div className="grow">
          <h3 className="card-title small">혼자 하는 훈련</h3>
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

      <section className="card journal">
        <h3 className="card-title">길드 소식</h3>
        <ul>
          {g.feed.slice(0, 10).map((f) => (
            <li key={f.id}>
              <span className={`j-dot ${feedTone(f.icon)}`} />
              <span className="j-text">{f.text}</span>
              <span className="j-time">{timeAgo(f.at)}</span>
            </li>
          ))}
        </ul>
      </section>

      {buying && (
        <ConfirmDialog
          title={`${itemOf(buying)!.name} 테마를 열까요?`}
          message={`길드 금고에서 ${itemOf(buying)!.price.toLocaleString()}G를 써요. 길드 모두가 같이 쓸 수 있어요.`}
          ok="열기"
          cancel="다음에"
          onOk={() => buyPlace(buying)}
          onCancel={() => setBuying(null)}
        />
      )}
      {closet && (
        <div className="ask-layer" onClick={() => setCloset(false)}>
          <div className="ask-sheet closet" onClick={(e) => e.stopPropagation()}>
            <h3 className="card-title">옷장</h3>
            {g.ownedItems.filter((id) => itemOf(id)?.kind === 'deco').length === 0 ? (
              <p className="sub small">아직 옷이나 가구가 없어요. 상점에서 사면 여기 들어와요.</p>
            ) : (
              <div className="closet-grid">
                {g.ownedItems
                  .filter((id) => itemOf(id)?.kind === 'deco')
                  .map((id) => {
                    const it = itemOf(id)!
                    const on = cat.equipped.includes(id)
                    return (
                      <button key={id} className={`closet-item ${on ? 'on' : ''}`} onClick={() => actions.toggleEquip(id)}>
                        <img src={ART[WEAR_ART[id]]} alt="" />
                        <b>{it.name}</b>
                        <small>{on ? (it.slot === 'room' ? '두는 중' : '입는 중') : it.slot === 'room' ? '두기' : '입히기'}</small>
                      </button>
                    )
                  })}
              </div>
            )}
            <button className="btn btn-block" onClick={() => go('shop')}>
              상점 가기
            </button>
          </div>
        </div>
      )}
      {asking && <CatAsk cat={cat} ask={asking} onClose={() => setAsking(null)} />}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}

// 고양이가 먼저 묻는 질문 (일방형): 고르면 한마디 하고 끝
function CatAsk({ cat, ask, onClose }: { cat: Cat; ask: Ask; onClose: () => void }) {
  const [pick, setPick] = useState<number | null>(null)
  const c = pick === null ? null : ask.choices[pick]
  return (
    <div className="ask-layer" onClick={() => c && onClose()}>
      <div className="ask-sheet" onClick={(e) => e.stopPropagation()}>
        <div className={`ask-cat ${c ? 'react' : ''}`}>
          <CatFace cat={cat} face={c?.face ?? 'calm'} size={86} />
        </div>
        <div className="ask-bubble" key={pick ?? -1}>
          <small>{cat.name}</small>
          <p>{c ? c.reply : ask.q}</p>
        </div>
        {c ? (
          <>
            <span className="ask-gain">기분 +5</span>
            <button className="btn btn-primary btn-block" onClick={onClose}>
              좋아
            </button>
          </>
        ) : (
          <div className="ask-choices">
            {ask.choices.map((ch, i) => (
              <button
                key={ch.t}
                className="ask-choice"
                onClick={() => {
                  setPick(i)
                  actions.answerCat()
                }}
              >
                {ch.t}
              </button>
            ))}
            <button className="ask-later" onClick={onClose}>
              나중에 대답할게
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Pill({ label, value, tone }: { label: string; value: number; tone: string }) {
  const v = Math.round(value)
  return (
    <div className={`pill ${tone} ${v < 30 ? 'low' : ''}`}>
      <span>{label}</span>
      <i>
        <em style={{ width: `${v}%` }} />
      </i>
      <b>{v}</b>
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

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 5 L16 12 L9 19" />
    </svg>
  )
}
