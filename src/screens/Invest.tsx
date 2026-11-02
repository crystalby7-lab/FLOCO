// 공동 투자: 제안(이유 3칸 + AI 검토) → 투표 → 모의매매 → 공동 복기 (F4·F5·F6)
import { useState } from 'react'
import { actions, majority, me, memberName, mustRetro, RULES, unlocked, useGame } from '../store'
import { changePct, priceOf, tickerOf, TICKERS } from '../data/market'
import { Empty, Gold, Sheet } from '../components/ui'
import type { AiResult, Guild, Proposal } from '../types'
import type { Tab } from '../App'
import { Lock } from '../components/Icons'

const REASON_LABELS = ['왜 사고 싶어?', '아직 모르는 건?', '안 사기로 한 건?'] as const
const REASON_PH = [
  '직접 찾아본 걸로 써봐요 (담긴 회사, 수수료 등)',
  '확인 못 한 것, 걱정되는 것',
  '같이 봤다가 안 고른 것과 이유',
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
            <h1>같이 투자</h1>
          </div>
        </header>
        <div className="card locked-card">
          <div className="lock-circle"><Lock size={26} /></div>
          <h3>기초 마을부터 다녀와요</h3>
          <p className="muted">퀘스트 3개를 끝내면 나도 제안할 수 있어요. 친구 제안엔 지금도 의견을 낼 수 있어요.</p>
          <button className="btn primary" onClick={() => go('map')}>
            지도로 가기
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
          <div className="eyebrow">{majority(g)}명이 좋다고 하면 사요</div>
          <h1>같이 투자</h1>
        </div>
        <div className="vault">
          <div className="eyebrow">금고</div>
          <Gold value={g.gold} />
        </div>
      </header>
      <button className="btn primary block" onClick={() => setWriting(true)}>
        새로 제안하기
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
      <h2 className="section-title">의견 모으는 중</h2>
      {voting.length ? voting.map((p) => <ProposalCard key={p.id} g={g} p={p} day={day} />) : <Empty>지금은 조용해요</Empty>}
      <h2 className="section-title">길드가 가진 것</h2>
      {holding.length ? holding.map((p) => <ProposalCard key={p.id} g={g} p={p} day={day} />) : <Empty>아직 산 게 없어요</Empty>}
      <h2 className="section-title">지난 이야기</h2>
      {done.length ? done.map((p) => <ProposalCard key={p.id} g={g} p={p} day={day} />) : <Empty>팔고 나면 여기서 같이 돌아봐요</Empty>}
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

  const statusLabel = { voting: '의견 모으는 중', holding: '갖고 있어요', sold: '팔았어요', rejected: '이번엔 패스' }[p.status]

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
              좋아 {yes} · 글쎄 {no}
            </span>
          )}
          {(p.status === 'holding' || p.status === 'sold') && (
            <span className={`pnl ${pnl >= 0 ? 'up' : 'down'}`}>
              {pnl >= 0 ? '+' : ''}
              {pnl.toLocaleString()}G
            </span>
          )}
          {needRetro && <span className="dot-alert">돌아보기</span>}
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
          <p className="ai-pass">AI 친구가 이유를 확인했어요</p>

          {p.votes.length > 0 && (
            <ul className="vote-list">
              {p.votes.map((v) => (
                <li key={v.memberId}>
                  <b>{memberName(g, v.memberId)} · {v.agree ? '좋아' : '글쎄'}</b>
                  {v.reason && <span>"{v.reason}"</span>}
                </li>
              ))}
            </ul>
          )}

          {p.status === 'voting' && !myVote && !opposing && (
            <div className="row gap">
              <button className="btn primary" onClick={() => actions.vote(p.id, true)}>
                좋아
              </button>
              <button className="btn" onClick={() => setOpposing(true)}>
                글쎄, 걱정돼
              </button>
            </div>
          )}
          {p.status === 'voting' && !myVote && opposing && (
            <div className="form">
              <label className="small-label">
                어떤 게 걱정돼? (경험치 +{RULES.exp.opposeReason})
                <input value={oppose} onChange={(e) => setOppose(e.target.value)} maxLength={80} placeholder="한 줄이면 충분해요" />
              </label>
              <div className="row gap">
                <button className="btn" onClick={() => setOpposing(false)}>
                  취소
                </button>
                <button className="btn primary" disabled={oppose.trim().length < 8} onClick={() => actions.vote(p.id, false, oppose.trim())}>
                  의견 보내기
                </button>
              </div>
            </div>
          )}
          {p.status === 'voting' && myVote && <p className="muted">의견 보냈어요 · 친구들 기다리는 중</p>}

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
                팔기
              </button>
              
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
                    {memberName(g, r.authorId)} · {r.role === 'proposer' ? '제안한 사람' : '걱정한 사람'}
                  </small>
                  <p>{r.text}</p>
                </div>
              ))}
              {needRetro && (
                <div className="form">
                  <label className="small-label">
                    돌아보기 · 벌었든 잃었든 경험치 +{RULES.exp.retro}
                    <textarea
                      rows={3}
                      value={retro}
                      onChange={(e) => setRetro(e.target.value)}
                      placeholder="내 이유 중 맞았던 것, 빗나간 것, 다음엔 바꿀 것"
                    />
                  </label>
                  <button className="btn primary" disabled={retro.trim().length < 20} onClick={() => actions.writeMyRetro(p.id, retro.trim())}>
                    다 썼어요
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
    <Sheet title="친구들한테 제안하기" onClose={onClose}>
      <div className="field-label">뭘 살까?</div>
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
      {!compare && <p className="fineprint">ETF 숲 마지막 퀘스트를 끝내면 비교 도구가 열려요</p>}

      <div className="field-label">얼마나? <span className="muted">금고 {g.gold.toLocaleString()}G</span></div>
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
          {label}
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
          <b>{result.pass ? '좋아요, 올렸어요!' : '조금만 더 써볼까요?'}</b>
          <p>{result.message}</p>
          {result.hint && <p className="hint">{result.hint}</p>}
        </div>
      )}

      <button className="btn primary block" disabled={checking || reasons.some((r) => !r.trim())} onClick={submit}>
        {checking ? 'AI 친구가 읽는 중…' : '이유 확인받고 올리기'}
      </button>
      <p className="fineprint">이유가 확인돼야 친구들한테 올라가요</p>
    </Sheet>
  )
}
