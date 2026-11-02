// 홈: 길드 고양이 · 자동 훈련 (F7·F8) · 할 일 · 길드 소식
import { useEffect, useState } from 'react'
import { actions, catNow, me, mustRetro, RULES, trainingAvailable, useGame } from '../store'
import { CatView } from '../components/CatView'
import { Scene } from '../components/Scene'
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

// 소식 종류별 색 (이모지 대신 작은 점)
const feedTone = (icon: string) =>
  ['✅', '📈', '🎉', '🔓', '✨'].includes(icon) ? 'good' : ['📉', '🙅', '⚠️', '✋'].includes(icon) ? 'warn' : ['💡', '👍', '📘'].includes(icon) ? 'blue' : 'plain'

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
  const status = cat.hunger < 30 ? '배가 고파요' : cat.mood < 30 ? '조금 심심해요' : cat.mood >= 60 ? '기분이 좋아요' : '느긋하게 쉬는 중'

  const flash = (t: string) => {
    setMsg(t)
    setTimeout(() => setMsg(''), 1600)
  }

  return (
    <div className="home">
      <Scene>
        <div className="hud">
          <div className="hud-name">
            <span className="hud-guild">{g.name}</span>
            <span className="hud-cat">
              {cat.name} <span className="lv">Lv.{cat.level}</span>
            </span>
          </div>
          <div className="hud-gold">
            <Gold value={g.gold} />
          </div>
        </div>
        <div className="speech">{status}</div>
        <div className="cat-wrap">
          <CatView cat={cat} size={230} />
        </div>
        {msg && <div className="pop">{msg}</div>}
      </Scene>

      <div className="home-panel">
        <div className="stat-row">
          <Meter label="배부름" value={cat.hunger} tone="orange" />
          <Meter label="기분" value={cat.mood} tone="pink" />
          <Meter label="경험치" value={(cat.exp / RULES.expPerLevel) * 100} tone="blue" text={`${cat.exp}/${RULES.expPerLevel}`} />
        </div>

        <div className="action-row">
          <button className="btn" onClick={() => flash(actions.buyItem('feed') ?? '냠냠, 맛있다!')}>
            밥 주기 <small>100G</small>
          </button>
          <button className="btn" onClick={() => flash(actions.buyItem('toy') ?? '신나게 놀았어요!')}>
            놀아주기 <small>150G</small>
          </button>
          <button className="btn primary" disabled={train.gold <= 0} onClick={actions.claimTraining}>
            훈련 보상 <small>+{train.gold}G</small>
          </button>
        </div>
        <p className="hint-line">
          {train.full ? '훈련 보상이 가득 찼어요. 지금 받아가세요!' : `${cat.name}는 혼자서도 훈련해요 · 한 시간에 ${RULES.goldPerHour}G`}
        </p>

        {(toVote > 0 || toRetro > 0) && (
          <div className="todo">
            {toVote > 0 && (
              <button className="todo-item" onClick={() => go('invest')}>
                <span className="todo-dot blue" />
                친구가 의견을 기다려요 <b>{toVote}</b>
                <Chevron />
              </button>
            )}
            {toRetro > 0 && (
              <button className="todo-item" onClick={() => go('invest')}>
                <span className="todo-dot green" />
                돌아보기를 쓰면 경험치 +{RULES.exp.retro} <b>{toRetro}</b>
                <Chevron />
              </button>
            )}
          </div>
        )}

        <h2 className="section-title">길드 소식</h2>
        <ul className="feed">
          {g.feed.slice(0, 12).map((f) => (
            <li key={f.id}>
              <span className={`feed-dot ${feedTone(f.icon)}`} />
              <span className="feed-text">{f.text}</span>
              <span className="feed-time">{timeAgo(f.at)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Meter({ label, value, tone, text }: { label: string; value: number; tone: string; text?: string }) {
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <span className="num">{text ?? Math.round(value)}</span>
      </div>
      <div className="meter-track">
        <div className={`meter-fill ${tone}`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
    </div>
  )
}

export function Chevron() {
  return (
    <svg className="chev-ico" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 3 L11 8 L6 13" />
    </svg>
  )
}
