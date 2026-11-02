// 홈: 길드 고양이 · 자동 훈련 (F7·F8) · 오늘의 제안 · 길드 소식
import { useEffect, useState } from 'react'
import { actions, catNow, me, memberName, mustRetro, RULES, trainingAvailable, useGame } from '../store'
import { tickerOf } from '../data/market'
import { CatFace } from '../components/CatView'
import { Playground, type PlayEvent } from '../components/Playground'
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
  ['✅', '📈', '🎉', '🔓', '✨'].includes(icon) ? 'moss' : ['📉', '🙅', '⚠️', '✋'].includes(icon) ? 'berry' : ['💡', '👍', '📘'].includes(icon) ? 'honey' : ''

export function Home({ go }: { go: (t: Tab) => void }) {
  useTick()
  const s = useGame()
  const g = s.guild!
  const cat = catNow(g.cat)
  const train = trainingAvailable(g.cat)
  const myId = me(g).id
  const [toast, setToast] = useState('')
  const [ev, setEv] = useState<PlayEvent>(null)

  const waiting = g.proposals.filter((p) => p.status === 'voting' && !p.votes.some((v) => v.memberId === myId))
  const retros = g.proposals.filter((p) => mustRetro(g, p, myId))
  const status = cat.hunger < 30 ? '배가 고프대요' : cat.mood < 30 ? '조금 심심해해요' : cat.mood >= 60 ? '기분이 좋아요' : '느긋하게 쉬고 있어요'
  const days = Math.max(1, Math.floor((Date.now() - (s.user?.joinedAt ?? Date.now())) / 86_400_000) + 1)

  const flash = (t: string, ok: boolean, type: 'feed' | 'play') => {
    setToast(t)
    if (ok) setEv({ type, key: Date.now() })
    setTimeout(() => setToast(''), 1800)
  }

  const p = waiting[0]
  const r = retros[0]

  return (
    <div className="tab-panel">
      <div className="today-hero">
        <div className="th-day">
          {g.name} · 함께한 지 {days}일
        </div>
        <h1 className="th-title">
          {cat.name}는 {status}
        </h1>
      </div>

      <div className="bleed">
        <Playground cat={cat} event={ev} />
        <span className="lv-tag">Lv.{cat.level}</span>
        <span className="tap-hint">{cat.name}를 눌러보세요</span>
      </div>

      <section className="card status-card">
        <div className="meters">
          <Meter label="배부름" value={cat.hunger} />
          <Meter label="기분" value={cat.mood} tone="pinkish" />
        </div>
        <div className="exp-line">
          <span className="sub small">경험치</span>
          <div className="bar grow">
            <div style={{ width: `${(cat.exp / RULES.expPerLevel) * 100}%` }} />
          </div>
          <span className="small num">
            {cat.exp}/{RULES.expPerLevel}
          </span>
        </div>
        <div className="row">
          <button className="btn btn-soft grow" onClick={() => { const e = actions.buyItem('feed'); flash(e ?? '밥 그릇을 놓았어요', !e, 'feed') }}>
            밥 주기 <span className="btn-meta">100G</span>
          </button>
          <button className="btn btn-soft grow" onClick={() => { const e = actions.buyItem('toy'); flash(e ?? '장난감을 꺼냈어요', !e, 'play') }}>
            놀아주기 <span className="btn-meta">150G</span>
          </button>
        </div>
      </section>

      {/* 앱에서 가장 눈에 띄는 카드: 지금 할 일 */}
      <section className="q-card">
        <div className="peek" aria-hidden>
          <CatFace cat={cat} size={96} />
        </div>
        {p ? (
          <>
            <div className="q-label">친구가 의견을 기다려요</div>
            <div className="q-text">
              {memberName(g, p.proposerId)}님이 {tickerOf(p.ticker).name}를 사자고 했어요
            </div>
            <button className="btn btn-honey btn-block q-btn" onClick={() => go('invest')}>
              이유 보고 의견 내기
            </button>
          </>
        ) : r ? (
          <>
            <div className="q-label">같이 돌아볼 차례예요</div>
            <div className="q-text">{tickerOf(r.ticker).name}, 내 판단은 어땠을까요?</div>
            <button className="btn btn-honey btn-block q-btn" onClick={() => go('invest')}>
              돌아보기 쓰기 · 경험치 +{RULES.exp.retro}
            </button>
          </>
        ) : (
          <>
            <div className="q-label">오늘의 퀘스트</div>
            <div className="q-text">지도에서 하나 배우고 오면 {cat.name}가 좋아할 거예요</div>
            <button className="btn btn-honey btn-block q-btn" onClick={() => go('map')}>
              지도 열기
            </button>
          </>
        )}
      </section>

      <section className="card tight train">
        <div className="grow">
          <h3>혼자 하는 훈련</h3>
          <p className="sub small">
            {train.full ? '보상이 가득 찼어요' : `한 시간에 ${RULES.goldPerHour}G씩 모여요 · 최대 ${RULES.trainCapHours}시간`}
          </p>
          <div className="bar thin">
            <div style={{ width: `${(train.hours / RULES.trainCapHours) * 100}%` }} />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" disabled={train.gold <= 0} onClick={actions.claimTraining}>
          {train.gold}G 받기
        </button>
      </section>

      <div className="section-head">
        <h2>길드 소식</h2>
      </div>
      <ul className="list feed">
        {g.feed.slice(0, 10).map((f) => (
          <li key={f.id} className="list-row">
            <span className={`feed-dot ${feedTone(f.icon)}`} />
            <span className="row-text">{f.text}</span>
            <span className="val tiny">{timeAgo(f.at)}</span>
          </li>
        ))}
      </ul>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}

// Kync식 10칸 게이지
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
