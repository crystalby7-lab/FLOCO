// 홈: 길드 고양이 상태 · 자동 훈련 보상 (F7·F8) · 할 일 · 길드 피드
import { useEffect, useState } from 'react'
import { actions, catNow, me, mustRetro, RULES, trainingAvailable, useGame } from '../store'
import { CatView } from '../components/CatView'
import { Bar, Gold } from '../components/ui'
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

export function Home({ go }: { go: (t: Tab) => void }) {
  useTick()
  const s = useGame()
  const g = s.guild!
  const cat = catNow(g.cat)
  const train = trainingAvailable(g.cat)
  const myId = me(g).id
  const [msg, setMsg] = useState('')

  const toVote = g.proposals.filter((p) => p.status === 'voting' && !p.votes.some((v) => v.memberId === myId)).length
  const toRetro = g.proposals.filter((p) => mustRetro(g, p, myId)).length
  const status = cat.hunger < 30 ? '배고파요' : cat.mood < 30 ? '심심해요' : cat.mood >= 60 ? '기분 최고' : '평온해요'

  const feed = () => {
    const err = actions.buyItem('feed')
    setMsg(err ?? '냠냠! 배고픔이 채워졌어요.')
    setTimeout(() => setMsg(''), 1800)
  }

  return (
    <div className="screen">
      <header className="top">
        <div>
          <div className="eyebrow">{g.name}</div>
          <h1 className="cat-title">
            {cat.name} <span className="lv">Lv.{cat.level}</span>
          </h1>
        </div>
        <div className="vault">
          <div className="eyebrow">길드 금고</div>
          <Gold value={g.gold} />
        </div>
      </header>

      <section className="cat-stage">
        <span className="status-pill">{status}</span>
        <CatView cat={cat} />
        <div className="exp">
          <div className="exp-track">
            <div className="exp-fill" style={{ width: `${(cat.exp / RULES.expPerLevel) * 100}%` }} />
          </div>
          <span className="exp-label">
            경험치 {cat.exp}/{RULES.expPerLevel} · 근거와 복기로만 올라요
          </span>
        </div>
      </section>

      <section className="card stats">
        <Bar label="배부름" value={cat.hunger} color="var(--orange)" />
        <Bar label="기분" value={cat.mood} color="var(--pink)" />
        <div className="row gap">
          <button className="btn" onClick={feed}>
            🥣 사료 주기 <small>100G</small>
          </button>
          <button className="btn" onClick={() => go('shop')}>
            🛍 상점
          </button>
        </div>
        {msg && <p className="toast-inline">{msg}</p>}
      </section>

      <section className="card train">
        <div>
          <div className="card-title">🏋️ 자동 훈련</div>
          <p className="muted">
            안 들어와도 시간당 {RULES.goldPerHour}G씩 쌓여요 · 최대 {RULES.trainCapHours}시간치
          </p>
          <div className="train-track">
            <div className="train-fill" style={{ width: `${(train.hours / RULES.trainCapHours) * 100}%` }} />
          </div>
        </div>
        <button className="btn primary" disabled={train.gold <= 0} onClick={actions.claimTraining}>
          {train.full ? '가득 참! ' : ''}+{train.gold}G 받기
        </button>
      </section>

      {(toVote > 0 || toRetro > 0) && (
        <section className="todo">
          {toVote > 0 && (
            <button className="todo-item" onClick={() => go('invest')}>
              <span>🗳</span> 투표를 기다리는 제안 {toVote}개 <b>›</b>
            </button>
          )}
          {toRetro > 0 && (
            <button className="todo-item" onClick={() => go('invest')}>
              <span>📝</span> 써야 할 복기 {toRetro}개 · 경험치 +{RULES.exp.retro} <b>›</b>
            </button>
          )}
        </section>
      )}

      <section>
        <h2 className="section-title">길드 소식</h2>
        <ul className="feed">
          {g.feed.slice(0, 15).map((f) => (
            <li key={f.id}>
              <span className="feed-icon">{f.icon}</span>
              <span className="feed-text">{f.text}</span>
              <span className="feed-time">{timeAgo(f.at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
