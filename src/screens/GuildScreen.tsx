// 길드: 우리 길드 기록 · 이번 주 같이 할 일 · 친구들(응원) · 길드 한마디 · 초대
import { useState } from 'react'
import { actions, memberName, useGame, vault } from '../store'
import { ART } from '../components/CatView'
import { Avatar, breedOf } from '../components/Avatar'

export function GuildScreen() {
  const s = useGame()
  const g = s.guild!
  const [copied, setCopied] = useState(false)
  const [draft, setDraft] = useState('')
  const [toast, setToast] = useState('')
  const link = `${location.origin}${location.pathname}?invite=${g.code}`
  const v = vault(g, s.day)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      /* 복사 불가 환경 */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const decided = g.proposals.filter((p) => p.status !== 'voting')
  const passed = decided.filter((p) => p.status !== 'rejected').length
  const days = Math.max(1, Math.floor((Date.now() - g.createdAt) / 86_400_000) + 1)
  const stats = [
    { label: '함께한 날', value: `${days}일` },
    { label: '올라온 제안', value: `${g.proposals.length}개` },
    { label: '통과율', value: decided.length ? `${Math.round((passed / decided.length) * 100)}%` : '-' },
    { label: '같이 돌아보기', value: `${g.retros.length}번` },
  ]

  const people = g.members.map((m) => ({
    m,
    proposals: g.proposals.filter((p) => p.proposerId === m.id).length,
    retros: g.retros.filter((r) => r.authorId === m.id).length,
    opposes: g.proposals.reduce((n, p) => n + p.votes.filter((x) => x.memberId === m.id && !x.agree).length, 0),
  }))

  // 이번 주(최근 거래일 5일) 길드가 같이 한 것
  const recent = g.proposals.filter((p) => p.createdDay >= s.day - 4)
  const recentIds = new Set(recent.map((p) => p.id))
  const week = Date.now() - 7 * 86_400_000
  const wk = {
    proposals: recent.length,
    votes: recent.reduce((n, p) => n + p.votes.length, 0),
    retros: g.retros.filter((r) => recentIds.has(r.proposalId)).length,
    posts: g.board.filter((p) => p.at >= week).length,
  }
  const goals = [
    { label: '제안 올리기', now: wk.proposals, goal: 2 },
    { label: '의견 내기', now: wk.votes, goal: 6 },
    { label: '같이 돌아보기', now: wk.retros, goal: 1 },
    { label: '한마디 남기기', now: wk.posts, goal: 5 },
  ]
  const myId = g.members.find((m) => m.isMe)!.id
  const flash = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(''), 1600)
  }
  const ago = (at: number) => {
    const m = Math.floor((Date.now() - at) / 60000)
    return m < 1 ? '방금' : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`
  }

  return (
    <div className="tab-panel">
      <header className="top">
        <div>
          <div className="eyebrow">길드 {g.members.length}/5명 · 금고 {v.total.toLocaleString()}G</div>
          <h1>{g.name}</h1>
        </div>
      </header>

      <section className="card guild-hero">
        <img src={ART.crown} alt="" className="gh-cat" />
        <div className="grow">
          <b>
            {g.cat.name} · Lv.{g.cat.level}
          </b>
          <small className="sub">우리가 같이 쓴 이유와 돌아보기로 자랐어요</small>
        </div>
      </section>

      <div className="stat-grid">
        {stats.map((x) => (
          <div key={x.label} className="stat">
            <b className="num">{x.value}</b>
            <small>{x.label}</small>
          </div>
        ))}
      </div>

      <h2 className="section-title">같이 키우는 친구</h2>
      <ul className="members">
        {people.map(({ m, proposals, retros, opposes }) => (
          <li key={m.id}>
            <img className="member-cat" src={ART[breedOf(g, m.id)]} alt="" />
            <div className="grow">
              <b>
                {m.nickname}
                {m.isMe && <span className="me-tag">나</span>}
                {m.isBot && <span className="bot-tag">테스트</span>}
              </b>
              <div className="contrib">
                <span>제안 {proposals}</span>
                <span>걱정 {opposes}</span>
                <span>돌아보기 {retros}</span>
              </div>
            </div>
            {!m.isMe && (
              <button
                className={`cheer-btn ${g.cheers[m.id] === new Date().toISOString().slice(0, 10) ? 'done' : ''}`}
                onClick={() => {
                  const err = actions.cheer(m.id)
                  flash(err ?? `${m.nickname}에게 응원을 보냈어요`)
                }}
              >
                <img src={ART.i_heart} alt="" />
                응원
              </button>
            )}
          </li>
        ))}
      </ul>

      <section className="card week-card">
        <div className="card-row">
          <h3 className="card-title">이번 주 같이 할 일</h3>
          <span className="small sub">거래일 5일</span>
        </div>
        {goals.map((x) => (
          <div key={x.label} className="week-row">
            <span>{x.label}</span>
            <div className="bar grow">
              <div style={{ width: `${Math.min(100, (x.now / x.goal) * 100)}%` }} />
            </div>
            <b className={x.now >= x.goal ? 'ok' : ''}>
              {Math.min(x.now, x.goal)}/{x.goal}
            </b>
          </div>
        ))}
      </section>

      <section className="card board">
        <h3 className="card-title">길드 한마디</h3>
        <form
          className="board-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (!draft.trim()) return
            actions.postBoard(draft)
            setDraft('')
          }}
        >
          <input value={draft} maxLength={60} onChange={(e) => setDraft(e.target.value)} placeholder="친구들에게 한마디 (60자)" />
          <button className="btn btn-primary btn-sm" disabled={!draft.trim()}>
            올리기
          </button>
        </form>
        <ul className="board-list">
          {g.board.slice(0, 8).map((p) => (
            <li key={p.id}>
              <Avatar g={g} id={p.memberId} size={34} />
              <div className="grow">
                <div className="board-meta">
                  <b>{memberName(g, p.memberId)}</b>
                  <small>{ago(p.at)}</small>
                </div>
                <p>{p.text}</p>
              </div>
              <button className={`heart-btn ${p.hearts.includes(myId) ? 'on' : ''}`} onClick={() => actions.heartPost(p.id)} aria-label="좋아요">
                <img src={ART.i_heart} alt="" />
                {p.hearts.length > 0 && <small>{p.hearts.length}</small>}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card invite">
        <div className="card-title">친구 부르기</div>
        <div className="code">{g.code}</div>
        <button className="btn btn-primary btn-block" onClick={copy}>
          {copied ? '복사했어요!' : '초대 링크 복사'}
        </button>
        <p className="fineprint">친구가 이 링크로 들어오면 같은 고양이를 같이 키워요 (서비스 연결 후)</p>
      </section>


      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
