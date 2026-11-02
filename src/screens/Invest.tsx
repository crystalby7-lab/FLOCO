// 공동 투자: 제안(이유 3칸 + AI 검토) → 투표 → 모의매매 → 공동 복기 (F4·F5·F6)
import { useState } from 'react'
import { actions, majority, me, memberName, mustRetro, RULES, unlocked, useGame } from '../store'
import { changePct, priceOf, tickerOf, TICKERS } from '../data/market'
import { Empty, Gold, Sheet } from '../components/ui'
import type { AiResult, Guild, Proposal } from '../types'
import type { Tab } from '../App'

const REASON_LABELS = ['왜 사는지', '무엇을 확인하지 않았는지', '무엇을 사지 않기로 했는지'] as const
const REASON_PH = [
  '무엇을 담은 상품인지, 직접 확인한 사실을 근거로',
  '아직 모르는 위험이나 확인 못 한 것',
  '비교했다가 고르지 않은 것과 그 이유',
]

export function Invest({ go }: { go: (t: Tab) => void }) {
  const s = useGame()
  const g = s.guild!
  const [writing, setWriting] = useState(false)
  const tools = unlocked(s)

  if (!tools.has('invest')) {
    return (
      <div className="screen">
        <header className="top">
          <div>
            <div className="eyebrow">길드 금고</div>
            <h1>공동 투자</h1>
          </div>
        </header>
        <div className="card locked-card">
          <div className="big-emoji">🔒</div>
          <h3>기초 마을을 먼저 완료해요</h3>
          <p className="muted">저축·투자·도박의 차이를 배우면 길드에 투자 제안을 올릴 수 있어요. 친구 제안에 투표는 지금도 할 수 있어요.</p>
          <button className="btn primary" onClick={() => go('map')}>
            퀘스트 지도로 가기
          </button>
        </div>
        <ProposalSections g={g} day={s.day} />
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="top">
        <div>
          <div className="eyebrow">거래일 {s.day} · 과반 {majority(g)}명 찬성 시 매수</div>
          <h1>공동 투자</h1>
        </div>
        <div className="vault">
          <div className="eyebrow">금고</div>
          <Gold value={g.gold} />
        </div>
      </header>
      <button className="btn primary block" onClick={() => setWriting(true)}>
        ✍️ 투자 제안하기
      </button>
      <ProposalSections g={g} day={s.day} />
      {writing && <ProposalForm g={g} day={s.day} compare={tools.has('etf_compare')} onClose={() => setWriting(false)} />}
    </div>
  )
}

function ProposalSections({ g, day }: { g: Guild; day: number }) {
  const voting = g.proposals.filter((p) => p.status === 'voting')
  const holding = g.proposals.filter((p) => p.status === 'holding')
  const done = g.proposals.filter((p) => p.status === 'sold' || p.status === 'rejected')
  return (
    <>
      <h2 className="section-title">🗳 투표 중</h2>
      {voting.length ? voting.map((p) => <ProposalCard key={p.id} g={g} p={p} day={day} />) : <Empty>투표 중인 제안이 없어요.</Empty>}
      <h2 className="section-title">💼 보유 중</h2>
      {holding.length ? holding.map((p) => <ProposalCard key={p.id} g={g} p={p} day={day} />) : <Empty>길드가 가진 종목이 없어요.</Empty>}
      <h2 className="section-title">📝 지난 결정과 복기</h2>
      {done.length ? done.map((p) => <ProposalCard key={p.id} g={g} p={p} day={day} />) : <Empty>아직 끝난 결정이 없어요.</Empty>}
    </>
  )
}

function ProposalCard({ g, p, day }: { g: Guild; p: Proposal; day: number }) {
  const t = tickerOf(p.ticker)
  const myId = me(g).id
  const myVote = p.votes.find((v) => v.memberId === myId)
  const [open, setOpen] = useState(p.status === 'voting' && !myVote)
  const [opposing, setOpposing] = useState(false)
  const [oppose, setOppose] = useState('')
  const [retro, setRetro] = useState('')
  const yes = p.votes.filter((v) => v.agree).length
  const no = p.votes.length - yes
  const now = priceOf(p.ticker, day)
  const pnl = p.qty && p.buyPrice ? p.qty * ((p.sellPrice ?? now) - p.buyPrice) : 0
  const retros = g.retros.filter((r) => r.proposalId === p.id)
  const needRetro = mustRetro(g, p, myId)

  const statusLabel = { voting: '투표 중', holding: '보유 중', sold: '매도 완료', rejected: '부결' }[p.status]

  return (
    <article className={`proposal ${p.status}`}>
      <button className="proposal-head" onClick={() => setOpen(!open)}>
        <div>
          <span className={`badge ${p.status}`}>{statusLabel}</span>
          <h3>{t.name}</h3>
          <small>
            {memberName(g, p.proposerId)}님 제안 · <Gold value={p.amount} />
          </small>
        </div>
        <div className="proposal-right">
          {p.status === 'voting' && (
            <span className="votes">
              👍 {yes} ✋ {no}
            </span>
          )}
          {(p.status === 'holding' || p.status === 'sold') && (
            <span className={`pnl ${pnl >= 0 ? 'up' : 'down'}`}>
              {pnl >= 0 ? '+' : ''}
              {pnl.toLocaleString()}G
            </span>
          )}
          {needRetro && <span className="dot-alert">복기</span>}
          <span className="chev">{open ? '▴' : '▾'}</span>
        </div>
      </button>

      {open && (
        <div className="proposal-body">
          <ol className="reasons">
            {p.reasons.map((r, i) => (
              <li key={i}>
                <small>{REASON_LABELS[i]}</small>
                <p>{r}</p>
              </li>
            ))}
          </ol>
          <p className="ai-pass">🤖 AI 근거 검토 통과</p>

          {p.votes.length > 0 && (
            <ul className="vote-list">
              {p.votes.map((v) => (
                <li key={v.memberId}>
                  <b>{v.agree ? '👍' : '✋'} {memberName(g, v.memberId)}</b>
                  {v.reason && <span>"{v.reason}"</span>}
                </li>
              ))}
            </ul>
          )}

          {p.status === 'voting' && !myVote && !opposing && (
            <div className="row gap">
              <button className="btn primary" onClick={() => actions.vote(p.id, true)}>
                👍 찬성
              </button>
              <button className="btn" onClick={() => setOpposing(true)}>
                ✋ 반대
              </button>
            </div>
          )}
          {p.status === 'voting' && !myVote && opposing && (
            <div className="form">
              <label className="small-label">
                반대 이유 한 줄 (경험치 +{RULES.exp.opposeReason})
                <input value={oppose} onChange={(e) => setOppose(e.target.value)} maxLength={80} placeholder="어떤 점이 걱정되나요?" />
              </label>
              <div className="row gap">
                <button className="btn" onClick={() => setOpposing(false)}>
                  취소
                </button>
                <button className="btn primary" disabled={oppose.trim().length < 8} onClick={() => actions.vote(p.id, false, oppose.trim())}>
                  반대 제출
                </button>
              </div>
            </div>
          )}
          {p.status === 'voting' && myVote && <p className="muted">투표 완료 · 다른 길드원을 기다리는 중</p>}

          {p.status === 'holding' && (
            <div className="hold">
              <div className="hold-grid">
                <span>산 가격</span>
                <b>{p.buyPrice?.toLocaleString()}G</b>
                <span>지금 가격</span>
                <b>{now.toLocaleString()}G</b>
                <span>수량</span>
                <b>{p.qty}주</b>
              </div>
              <button className="btn" onClick={() => actions.sell(p.id)}>
                매도하기
              </button>
              <p className="fineprint">데모에선 누구나 매도할 수 있어요. 매도 방식(투표 여부)은 미팅에서 정해주세요.</p>
            </div>
          )}

          {p.status === 'sold' && (
            <div className="retro-box">
              <div className="hold-grid">
                <span>산 가격</span>
                <b>{p.buyPrice?.toLocaleString()}G</b>
                <span>판 가격</span>
                <b>{p.sellPrice?.toLocaleString()}G</b>
              </div>
              {retros.map((r) => (
                <div key={r.id} className="retro">
                  <small>
                    {memberName(g, r.authorId)} · {r.role === 'proposer' ? '제안자' : '반대자'} 복기
                  </small>
                  <p>{r.text}</p>
                </div>
              ))}
              {needRetro && (
                <div className="form">
                  <label className="small-label">
                    내 복기 · 결과가 아니라 판단을 돌아봐요 (경험치 +{RULES.exp.retro}, 수익과 무관)
                    <textarea
                      rows={3}
                      value={retro}
                      onChange={(e) => setRetro(e.target.value)}
                      placeholder="내 이유 중 맞았던 것 / 틀렸던 것 / 다음에 바꿀 것"
                    />
                  </label>
                  <button className="btn primary" disabled={retro.trim().length < 20} onClick={() => actions.writeMyRetro(p.id, retro.trim())}>
                    복기 제출
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function ProposalForm({ g, day, compare, onClose }: { g: Guild; day: number; compare: boolean; onClose: () => void }) {
  const [ticker, setTicker] = useState('K200')
  const [amount, setAmount] = useState(50_000)
  const [reasons, setReasons] = useState<[string, string, string]>(['', '', ''])
  const [result, setResult] = useState<AiResult | null>(null)
  const [checking, setChecking] = useState(false)

  const submit = () => {
    setChecking(true)
    setResult(null)
    setTimeout(() => {
      const r = actions.propose(ticker, amount, reasons)
      setChecking(false)
      setResult(r)
      if (r.pass) setTimeout(onClose, 1200)
    }, 700)
  }

  return (
    <Sheet title="투자 제안하기" onClose={onClose}>
      <div className="field-label">종목</div>
      <div className="ticker-list">
        {TICKERS.map((t) => {
          const ch = changePct(t.code, day, 5)
          return (
            <button key={t.code} className={`ticker ${ticker === t.code ? 'on' : ''}`} onClick={() => setTicker(t.code)}>
              <b>{t.name}</b>
              <span className="num">{priceOf(t.code, day).toLocaleString()}G</span>
              {compare && (
                <span className="compare">
                  <small>{t.holds}</small>
                  <small>
                    보수 {t.fee} · 5일 <em className={ch >= 0 ? 'up' : 'down'}>{ch >= 0 ? '+' : ''}{ch.toFixed(1)}%</em>
                  </small>
                </span>
              )}
            </button>
          )
        })}
      </div>
      {!compare && <p className="fineprint">🔒 ETF 숲 '비교하는 법'을 완료하면 담은 것·보수·흔들림을 나란히 볼 수 있어요.</p>}

      <div className="field-label">금액 · 금고 {g.gold.toLocaleString()}G</div>
      <div className="chips">
        {[10_000, 20_000, 30_000, 50_000].map((a) => {
          const q = Math.floor(a / priceOf(ticker, day))
          return (
            <button key={a} className={`chip ${amount === a ? 'on' : ''}`} disabled={q < 1 || a > g.gold} onClick={() => setAmount(a)}>
              {a.toLocaleString()}G · {q}주
            </button>
          )
        })}
      </div>

      {REASON_LABELS.map((label, i) => (
        <label key={label} className="small-label">
          {i + 1}. {label}
          <textarea
            rows={2}
            value={reasons[i]}
            placeholder={REASON_PH[i]}
            onChange={(e) => {
              const next = [...reasons] as [string, string, string]
              next[i] = e.target.value
              setReasons(next)
            }}
          />
        </label>
      ))}

      {result && (
        <div className={`ai-result ${result.pass ? 'ok' : 'no'}`}>
          <b>🤖 {result.pass ? '통과' : '반려'}</b>
          <p>{result.message}</p>
          {result.hint && <p className="hint">💡 {result.hint}</p>}
        </div>
      )}

      <button className="btn primary block" disabled={checking || reasons.some((r) => !r.trim())} onClick={submit}>
        {checking ? 'AI가 근거를 읽는 중…' : 'AI 검토 받고 제안하기'}
      </button>
      <p className="fineprint">AI가 반려한 제안은 올라가지 않아요. 수익이 나도 근거 없는 매매엔 보상이 없어요.</p>
    </Sheet>
  )
}
