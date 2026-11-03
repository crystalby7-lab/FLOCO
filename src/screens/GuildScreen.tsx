// 길드: 우리 길드 기록 · 친구들 · 고양이 앨범 · 초대 · 테스트 도구
import { useState } from 'react'
import { actions, me, useGame, vault } from '../store'
import { ART } from '../components/CatView'
import { Avatar } from '../components/Avatar'

// 앨범에 모을 수 있는 모습 (시트 그림 이름 → 이름표)
const ALBUM: [string, string][] = [
  ['sit', '얌전히 앉기'],
  ['side', '옆 보기'],
  ['walk', '산책'],
  ['back', '창밖 구경'],
  ['back2', '멍때리기'],
  ['stretch', '기지개'],
  ['lie', '쿨쿨 엎드리기'],
  ['lielook', '누워서 쳐다보기'],
  ['roll', '배 보이기'],
  ['hug', '생선 인형'],
  ['toy', '낚싯대 놀이'],
  ['reach', '점프!'],
  ['boba', '버블티'],
  ['bath', '목욕'],
  ['blanket', '이불 속'],
  ['sleep', '방석 낮잠'],
  ['box', '상자 속'],
  ['bed', '동굴 침대'],
  ['crown', '레벨 업'],
  ['hoodie', '하늘 후드'],
  ['beret', '베레모'],
  ['dino', '공룡 옷'],
  ['duck', '오리 옷'],
  ['scarf', '빨간 목도리'],
]

export function GuildScreen() {
  const s = useGame()
  const g = s.guild!
  const [copied, setCopied] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [zoom, setZoom] = useState<string | null>(null)
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
  const got = ALBUM.filter(([id]) => g.album.includes(id)).length

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
            <Avatar g={g} id={m.id} size={42} />
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
          </li>
        ))}
      </ul>

      <div className="section-head">
        <h2>{g.cat.name} 앨범</h2>
        <span className="pill">
          {got}/{ALBUM.length}
        </span>
      </div>
      <p className="fineprint album-note">방에서 한 번이라도 본 모습이 모여요. 옷을 입히고, 가구를 두고, 돌보면 더 많이 볼 수 있어요.</p>
      <div className="album">
        {ALBUM.map(([id, label]) => {
          const has = g.album.includes(id)
          return (
            <button key={id} className={`album-cell ${has ? '' : 'locked'}`} disabled={!has} onClick={() => setZoom(id)}>
              <img src={ART[id]} alt="" />
              <small>{has ? label : '???'}</small>
            </button>
          )
        })}
      </div>

      <section className="card invite">
        <div className="card-title">친구 부르기</div>
        <div className="code">{g.code}</div>
        <button className="btn btn-primary btn-block" onClick={copy}>
          {copied ? '복사했어요!' : '초대 링크 복사'}
        </button>
        <p className="fineprint">친구가 이 링크로 들어오면 같은 고양이를 같이 키워요 (서비스 연결 후)</p>
      </section>

      <section className="card demo">
        <div className="card-title">테스트 도구</div>
        <p className="muted">
          {me(g).nickname} · 거래일 {s.day} · 가격은 연습용이에요
        </p>
        <div className="row">
          <button className="btn" onClick={actions.nextDay}>
            하루 지나기
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

      {zoom && (
        <div className="levelup-bg" onClick={() => setZoom(null)}>
          <div className="zoom">
            <img src={ART[zoom]} alt="" />
            <b>{ALBUM.find(([id]) => id === zoom)?.[1]}</b>
          </div>
        </div>
      )}
    </div>
  )
}
