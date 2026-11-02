// 길드: 멤버, 초대 링크, 기여(제안·복기 기록에서 계산), 데모 도구
import { useState } from 'react'
import { actions, useGame } from '../store'

export function GuildScreen() {
  const s = useGame()
  const g = s.guild!
  const [copied, setCopied] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const link = `${location.origin}${location.pathname}?invite=${g.code}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      /* 복사 불가 환경 */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // 멤버별 기여도는 따로 저장하지 않고 기록에서 센다 (데이터 명세 원칙)
  const stats = g.members.map((m) => ({
    m,
    proposals: g.proposals.filter((p) => p.proposerId === m.id).length,
    retros: g.retros.filter((r) => r.authorId === m.id).length,
    opposes: g.proposals.reduce((n, p) => n + p.votes.filter((v) => v.memberId === m.id && !v.agree).length, 0),
  }))

  return (
    <div className="screen">
      <header className="top">
        <div>
          <div className="eyebrow">길드 {g.members.length}/5명</div>
          <h1>{g.name}</h1>
        </div>
      </header>

      <section className="card invite">
        <div className="card-title">친구 초대</div>
        <div className="code">{g.code}</div>
        <button className="btn primary block" onClick={copy}>
          {copied ? '복사됨!' : '초대 링크 복사'}
        </button>
        <p className="fineprint">고양이는 혼자 키울 수 없어요. 친구가 링크로 들어오면 같은 고양이를 함께 봐요 (Firebase 연결 후 작동).</p>
      </section>

      <h2 className="section-title">멤버</h2>
      <ul className="members">
        {stats.map(({ m, proposals, retros, opposes }) => (
          <li key={m.id}>
            <span className="avatar">{m.nickname.slice(0, 1)}</span>
            <div>
              <b>
                {m.nickname}
                {m.isMe && <span className="me-tag">나</span>}
                {m.isBot && <span className="bot-tag">데모</span>}
              </b>
              <small>
                제안 {proposals} · 반대 이유 {opposes} · 복기 {retros}
              </small>
            </div>
          </li>
        ))}
      </ul>

      <section className="card demo">
        <div className="card-title">🛠 데모 도구 (테스트용)</div>
        <p className="muted">현재 거래일 {s.day}. 시세는 데모용 가상 값이에요.</p>
        <div className="row gap">
          <button className="btn" onClick={actions.nextDay}>
            📅 하루 지나기
          </button>
          <button
            className="btn danger"
            onClick={() => {
              if (confirmReset) actions.reset()
              else {
                setConfirmReset(true)
                setTimeout(() => setConfirmReset(false), 3000)
              }
            }}
          >
            {confirmReset ? '한 번 더 누르면 초기화' : '처음부터'}
          </button>
        </div>
      </section>
    </div>
  )
}
