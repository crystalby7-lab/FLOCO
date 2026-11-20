// 홈: 고양이 집(누르면 풀스크린) · 지금 할 일 · 오늘 할 일 · 오늘의 플로코 신문
// 길드 소식(피드)은 길드 탭으로 옮겼다.
import { useEffect, useState } from 'react'
import { actions, catNow, me, memberName, mustRetro, needReview, RULES, today, unlocked, useGame, vault } from '../store'
import { changePct, tickerOf } from '../data/market'
import { QUESTS } from '../data/quests'
import { ART, CatFace } from '../components/CatView'
import { timeOfDay } from '../components/Playground'
import { ConfirmDialog } from '../components/Page'
import { itemOf, OUTFIT_OPEN } from '../data/shop'
import { type Ask } from '../data/catTalk'
import { NewsFeed } from '../components/NewsFeed'
import type { Cat } from '../types'
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
  const myId = me(g).id
  const v = vault(g, s.day)
  const tod = timeOfDay()
  const [toast, setToast] = useState('')
  const [slide] = useState(0)
  const [buying, setBuying] = useState<string | null>(null)
  const [world, setWorld] = useState<{ dress: boolean } | null>(null)

  const waiting = needReview(g, myId)
  const retros = g.proposals.filter((p) => mustRetro(g, p, myId))
  const nextQuest = QUESTS.find((q) => !s.quests[q.id]?.done && (q.region === 'village' || unlocked(s).has('invest')))


  // 고양이 혼잣말: 지금 길드 상황에서 뽑는다
  const lines: string[] = [
    `내 계좌에 ${v.cash.toLocaleString()}원 있대`,
    tod === 'morning' ? '아침 공기 좋다' : tod === 'night' ? '하암… 졸려' : '창밖 구경 중',
    `${g.members.find((m) => !m.isMe)?.nickname ?? '친구'}는 뭐 하고 있을까`,
  ]
  if (waiting[0]) lines.push(`${memberName(g, waiting[0].proposerId)}가 쓴 근거 봤어?`)
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
    { done: d.quest, label: '레슨 하나 배우기', sub: '플로월드 건물에서', art: 'i_star', tone: 'mint', go: () => go('map') },
    { done: d.vote, label: '친구 거래에 피드백', sub: '근거 읽고 한 줄', art: 'i_heart', tone: 'pink', go: () => go('invest') },
    { done: d.care, label: `${cat.name} 돌보기`, sub: '집에 들어가서', art: 'i_fish', tone: 'yellow', go: () => setWorld({ dress: false }) },
  ]
  const doneCount = missions.filter((m) => m.done).length

  const p = waiting[0]
  const r = retros[0]


  return (
    <div className="tab-panel home live">
      <section className={`home-house pic tod-${tod}`}>
        <button className="hh-pic" onClick={() => setWorld({ dress: false })} aria-label={`${cat.name}네 집 들어가기`}>
          <img className="hh-photo" src={ART.sc_home_house} alt="" />
          <img className="hh-pic-cat" src={ART.sit} alt="" />
          <span className="hh-plate">눌러서 들어가기</span>
        </button>
      </section>


      <section className="card next-card">
        <img className="perch" src={ART.lielook} alt="" aria-hidden />
        {p ? (
          <>
            <span className="next-label">친구가 피드백을 기다려요</span>
            <h2>
              {memberName(g, p.proposerId)}가 {tickerOf(p.ticker).name}를 샀어요
            </h2>
            <p className="next-quote">"{p.reasons[0]}"</p>
            <button className="btn btn-primary btn-block" onClick={() => go('invest')}>
              근거 읽고 피드백 남기기
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
            <h2>근거 세 줄 쓰고 하나 사 볼까요?</h2>
            <button className="btn btn-primary btn-block" onClick={() => go('invest')}>
              종목 보러 가기
            </button>
          </>
        )}
      </section>

      <section className="card checklist cute">
        <span className="cl-tape" aria-hidden />
        <div className="card-row cl-head">
          <div>
            <small className="cl-date">
              {new Date().getMonth() + 1}월 {new Date().getDate()}일
            </small>
            <h3 className="card-title">오늘 할 일</h3>
          </div>
          <span className="cl-count">
            <b>{doneCount}</b>/3
          </span>
        </div>
        <div className="mission-bar">
          <div style={{ width: `${(doneCount / 3) * 100}%` }} />
          <img src={ART.walk} alt="" style={{ left: `${(doneCount / 3) * 100}%` }} aria-hidden />
        </div>
        <ul>
          {missions.map((m) => (
            <li key={m.label}>
              <button className={`todo cl-item ${m.tone} ${m.done ? 'done' : ''}`} onClick={m.go} disabled={m.done}>
                <span className="cl-ic">
                  <img src={ART[m.art]} alt="" />
                </span>
                <span className="grow todo-text">
                  <b>{m.label}</b>
                  <small>{m.sub}</small>
                </span>
                {m.done ? <img className="cl-stamp" src={ART.i_paw} alt="완료" /> : <span className="go">›</span>}
              </button>
            </li>
          ))}
        </ul>
        <button className={`btn btn-primary btn-block cl-reward ${doneCount === 3 && !d.claimed ? 'ready' : ''}`} disabled={doneCount < 3 || d.claimed} onClick={actions.claimDaily}>
          <img src={ART.i_cake} alt="" aria-hidden />
          {d.claimed ? '오늘 출석 보상 받았어요' : `다 하면 출석 보상 · 코인 +${RULES.dailyReward}`}
        </button>
      </section>

      <NewsFeed />

      {world && <CatWorld start={slide} dress={world.dress} onExit={() => setWorld(null)} />}
      {buying && (
        <ConfirmDialog
          title={`${itemOf(buying)!.name} 테마를 열까요?`}
          message={`길드 코인 ${itemOf(buying)!.price.toLocaleString()}개를 써요. 길드 모두가 같이 쓸 수 있어요.`}
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



