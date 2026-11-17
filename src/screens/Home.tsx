// 홈: 길드 고양이 방 · 상태 · 돌보기 · 지금 할 일 · 오늘의 미션 · 자동 훈련 (F7·F8) · 오늘의 플로코 신문
// 길드 소식(피드)은 길드 탭으로 옮겼다.
import { useEffect, useState } from 'react'
import { actions, catNow, me, memberName, mustRetro, RULES, today, trainingAvailable, unlocked, useGame, vault } from '../store'
import { changePct, tickerOf } from '../data/market'
import { QUESTS } from '../data/quests'
import { ART, CatFace } from '../components/CatView'
import { timeOfDay } from '../components/Playground'
import { ConfirmDialog } from '../components/Page'
import { itemOf, OUTFIT_OPEN } from '../data/shop'
import { type Ask } from '../data/catTalk'
import { NewsLinks } from '../components/NewsLinks'
import type { Cat } from '../types'
import { Gold } from '../components/ui'
import type { Tab } from '../App'
import { CatWorld } from './CatWorld'

function useTick(ms = 30_000) {
  const [, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((t) => t + 1), ms)
    return () => clearInterval(id)
  }, [ms])
}

export type Care = 'feed' | 'snack' | 'toy' | 'boba' | 'bath'
export const CARE: { id: Care; label: string; art: string; msg: string }[] = [
  { id: 'feed', label: '밥', art: 'i_bowl', msg: '밥 그릇을 놓았어요' },
  { id: 'snack', label: '간식', art: 'i_fish', msg: '생선 인형을 줬어요' },
  { id: 'toy', label: '장난감', art: 'i_yarn', msg: '장난감을 흔들었어요' },
  { id: 'boba', label: '버블티', art: 'i_boba', msg: '버블티를 줬어요' },
  { id: 'bath', label: '목욕', art: 'i_duck', msg: '보글보글 목욕 중' },
]
const WEAR_ART: Record<string, string> = { box: 'i_box', cushion: 'i_pillow', bed: 'i_bed' }

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
  const [slide] = useState(0)
  const [buying, setBuying] = useState<string | null>(null)
  const [world, setWorld] = useState<{ dress: boolean } | null>(null)

  const waiting = g.proposals.filter((p) => p.status === 'voting' && !p.votes.some((x) => x.memberId === myId))
  const retros = g.proposals.filter((p) => mustRetro(g, p, myId))
  const nextQuest = QUESTS.find((q) => !s.quests[q.id]?.done && (q.region === 'village' || unlocked(s).has('invest')))


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

  const [closet, setCloset] = useState(false)

  const d = s.daily.date === today() ? s.daily : { quest: false, vote: false, care: false, claimed: false, talks: 0 }


  const buyPlace = (id: string) => {
    const err = actions.buyItem(id)
    setBuying(null)
    setToast(err ?? `${itemOf(id)!.name} 테마가 열렸어요!`)
    setTimeout(() => setToast(''), 1800)
  }

  const missions = [
    { done: d.quest, label: '퀘스트 하나 배우기', go: () => go('map') },
    { done: d.vote, label: '친구 제안에 의견 내기', go: () => go('invest') },
    { done: d.care, label: `${cat.name} 돌보기`, go: () => setWorld({ dress: false }) },
  ]
  const doneCount = missions.filter((m) => m.done).length

  const p = waiting[0]
  const r = retros[0]


  return (
    <div className="tab-panel home live">
      <section className={`home-house tod-${tod}`}>
        <img className="hh-cloud c1" src={ART.bg_cloud} alt="" aria-hidden />
        <img className="hh-cloud c2" src={ART.bg_cloud} alt="" aria-hidden />
        <div className="hh-ground" aria-hidden />
        <button className="hh-house" onClick={() => setWorld({ dress: false })} aria-label={`${cat.name}네 집 들어가기`}>
          <span className="hh-chimney" aria-hidden />
          <span className="hh-roof" aria-hidden />
          <span className="hh-body" aria-hidden>
            <span className="hh-window l" />
            <span className="hh-window r" />
            <span className="hh-door">
              <img src={ART.sit} alt="" />
            </span>
          </span>
          <span className="hh-plate">{cat.name}네 집</span>
        </button>
        <span className="hh-hint">눌러서 들어가기</span>
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
              {nextQuest.summary} · 끝내면 코인 +{RULES.questReward}
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
          {d.claimed ? '오늘 출석 보상 받았어요' : `다 하면 출석 보상 · 코인 +${RULES.dailyReward}`}
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

      <NewsLinks />

      {world && <CatWorld start={slide} dress={world.dress} onExit={() => setWorld(null)} />}
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
            {g.ownedItems.filter((id) => itemOf(id)?.kind === 'deco' && (OUTFIT_OPEN || itemOf(id)?.slot !== 'outfit')).length === 0 ? (
              <p className="sub small">아직 가구가 없어요. 상점에서 사면 여기 들어와요.</p>
            ) : (
              <div className="closet-grid">
                {g.ownedItems
                  .filter((id) => itemOf(id)?.kind === 'deco' && (OUTFIT_OPEN || itemOf(id)?.slot !== 'outfit'))
                  .map((id) => {
                    const it = itemOf(id)!
                    const on = cat.equipped.includes(id)
                    return (
                      <button key={id} className={`closet-item ${on ? 'on' : ''}`} onClick={() => actions.toggleEquip(id)}>
                        <img src={ART[WEAR_ART[id] ?? id]} alt="" />
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
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}

// 고양이가 먼저 묻는 질문 (일방형): 고르면 한마디 하고 끝
export function CatAsk({ cat, ask, onClose }: { cat: Cat; ask: Ask; onClose: () => void }) {
  const [pick, setPick] = useState<number | null>(null)
  const c = pick === null ? null : ask.choices[pick]
  useEffect(() => {
    if (!c) return
    const t = window.setTimeout(onClose, 3200)
    return () => window.clearTimeout(t)
  }, [c, onClose])
  return (
    <div className="ask-pop" key={pick ?? -1}>
      <div className="ask-pop-head">
        <CatFace cat={cat} face={c?.face ?? 'calm'} size={34} />
        <p>{c ? c.reply : ask.q}</p>
        <button className="ask-pop-x" onClick={onClose} aria-label="닫기">
          ×
        </button>
      </div>
      {c ? (
        <span className="ask-gain">기분 +5</span>
      ) : (
        <div className="ask-pop-choices">
          {ask.choices.map((ch, i) => (
            <button
              key={ch.t}
              onClick={() => {
                setPick(i)
                actions.answerCat()
              }}
            >
              {ch.t}
            </button>
          ))}
        </div>
      )}
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


