// 같이 투자: 금고 → 종목 살펴보기 → 제안(종목·금액·이유 3칸·AI 검토) → 의견 → 모의매매 → 같이 돌아보기 (F4·F5·F6)
import { useState } from 'react'
import { actions, majority, me, memberName, mustRetro, RULES, unlocked, useGame, vault } from '../store'
import { changePct, history, priceOf, swingOf, tickerOf, TICKERS } from '../data/market'
import { Empty, Gold } from '../components/ui'
import { Page } from '../components/Page'
import { PriceChart } from '../components/Chart'
import { Avatar } from '../components/Avatar'
import { ART } from '../components/CatView'
import { Lock } from '../components/Icons'
import type { AiResult, Guild, Proposal } from '../types'
import type { Tab } from '../App'

const REASON_LABELS = ['왜 사고 싶어?', '아직 모르는 건?', '안 사기로 한 건?'] as const
const REASON_PH = [
  '직접 찾아본 사실로 써봐요',
  '확인 못 한 것, 걱정되는 것',
  '같이 봤다가 안 고른 것과 이유',
]
// 이유 칸마다 무엇을 써볼지 고르는 칩 (누르면 문장 앞부분이 들어감)
const REASON_CHIPS = [
  ['담긴 회사·산업', '수수료(보수)', '최근 흔들림', '오래 들고 갈 이유'],
  ['환율 영향', '한 회사 비중', '앞으로의 실적', '금리 변화'],
  ['비슷한 다른 ETF', '한 종목만 사기', '지금 바로 사기'],
]
const CHIP_TEXT: Record<string, string> = {
  '담긴 회사·산업': '이 상품에는 ',
  '수수료(보수)': '총보수가 ',
  '최근 흔들림': '최근 가격 흔들림을 보니 ',
  '오래 들고 갈 이유': '오래 들고 갈 이유는 ',
  '환율 영향': '환율이 바뀌면 ',
  '한 회사 비중': '한 회사가 차지하는 비중은 ',
  '앞으로의 실적': '앞으로의 실적은 ',
  '금리 변화': '금리가 바뀌면 ',
  '비슷한 다른 ETF': '비슷한 ',
  '한 종목만 사기': '회사 하나만 사는 건 ',
  '지금 바로 사기': '금고를 한 번에 다 쓰는 건 ',
}

const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`

export function Invest({ go }: { go: (t: Tab) => void }) {
  const s = useGame()
  const g = s.guild!
  const tools = unlocked(s)
  const [writing, setWriting] = useState<string | null>(null) // 제안할 종목 (null = 닫힘)
  const [viewing, setViewing] = useState<string | null>(null) // 종목 상세
  const [filter, setFilter] = useState<'all' | 'voting' | 'holding' | 'done'>('all')
  const canPropose = tools.has('invest')

  const lists = {
    voting: g.proposals.filter((p) => p.status === 'voting'),
    holding: g.proposals.filter((p) => p.status === 'holding'),
    done: g.proposals.filter((p) => p.status === 'sold' || p.status === 'rejected'),
  }

  return (
    <div className="tab-panel">
      <header className="top">
        <div>
          <div className="eyebrow">{majority(g)}명이 좋다고 하면 사요 · 거래일 {s.day}</div>
          <h1>같이 투자</h1>
        </div>
      </header>

      <VaultCard g={g} day={s.day} onOpen={setViewing} />

      {canPropose ? (
        <button className="btn btn-primary btn-block" onClick={() => setWriting('')}>
          새로 제안하기
        </button>
      ) : (
        <div className="card locked-card">
          <div className="lock-circle">
            <Lock size={24} />
          </div>
          <h3>기초 마을부터 다녀와요</h3>
          <p className="muted">퀘스트 3개를 끝내면 나도 제안할 수 있어요. 친구 제안엔 지금도 의견을 낼 수 있어요.</p>
          <button className="btn btn-primary" onClick={() => go('map')}>
            지도로 가기
          </button>
        </div>
      )}

      <div className="section-head">
        <h2>살펴볼 종목</h2>
        <span className="muted">눌러서 자세히</span>
      </div>
      <div className="ticker-strip">
        {TICKERS.map((t) => {
          const ch = changePct(t.code, s.day, 5)
          return (
            <button key={t.code} className="tk-card" onClick={() => setViewing(t.code)}>
              <span className="tk-name">{t.name}</span>
              <PriceChart data={history(t.code, s.day, 12)} height={40} compact />
              <span className="tk-row">
                <b className="num">{priceOf(t.code, s.day).toLocaleString()}G</b>
                <span className={`num ${ch >= 0 ? 'up' : 'down'}`}>{pct(ch)}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="seg filter">
        {(
          [
            ['all', '전체'],
            ['voting', `의견 ${lists.voting.length}`],
            ['holding', `보유 ${lists.holding.length}`],
            ['done', `지난 ${lists.done.length}`],
          ] as const
        ).map(([k, label]) => (
          <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
            {label}
          </button>
        ))}
      </div>

      {(filter === 'all' || filter === 'voting') && (
        <Section title="의견 모으는 중" empty="지금은 조용해요" list={lists.voting} g={g} day={s.day} onOpen={setViewing} />
      )}
      {(filter === 'all' || filter === 'holding') && (
        <Section title="길드가 가진 것" empty="아직 산 게 없어요" list={lists.holding} g={g} day={s.day} onOpen={setViewing} />
      )}
      {(filter === 'all' || filter === 'done') && (
        <Section title="지난 이야기" empty="팔고 나면 여기서 같이 돌아봐요" list={lists.done} g={g} day={s.day} onOpen={setViewing} />
      )}

      {viewing && (
        <TickerSheet
          code={viewing}
          day={s.day}
          compare={tools.has('etf_compare')}
          canPropose={canPropose}
          onClose={() => setViewing(null)}
          onPropose={() => {
            setWriting(viewing)
            setViewing(null)
          }}
        />
      )}
      {writing !== null && <ProposalForm g={g} day={s.day} start={writing} compare={tools.has('etf_compare')} onClose={() => setWriting(null)} />}
    </div>
  )
}

// ───────── 금고 요약 ─────────

const SEG_COLORS = ['var(--blue)', 'var(--pink)', '#9fc7a8', '#d8c3a5', '#b8a9d9']

function VaultCard({ g, day, onOpen }: { g: Guild; day: number; onOpen: (code: string) => void }) {
  const v = vault(g, day)
  const parts = [{ label: '현금', value: v.cash, color: 'var(--faint)' }, ...v.holdings.map((h, i) => ({ label: tickerOf(h.p.ticker).name, value: h.value, color: SEG_COLORS[i % SEG_COLORS.length], code: h.p.ticker }))]
  return (
    <section className="card vault-card">
      <div className="vault-top">
        <div>
          <span className="sub small">길드 금고 전체</span>
          <div className="vault-total">
            <Gold value={v.total} size={22} />
          </div>
        </div>
        <div className="vault-pnl">
          <span className="sub small">지금 평가손익</span>
          <b className={`num ${v.pnl >= 0 ? 'up' : 'down'}`}>
            {v.pnl >= 0 ? '+' : ''}
            {v.pnl.toLocaleString()}G
          </b>
        </div>
      </div>
      <div className="alloc" aria-label="금고 비중">
        {parts.map((p) => (
          <i key={p.label} style={{ flex: p.value, background: p.color }} />
        ))}
      </div>
      <ul className="alloc-legend">
        {parts.map((p) => (
          <li key={p.label}>
            <i style={{ background: p.color }} />
            {'code' in p && p.code ? (
              <button className="link" onClick={() => onOpen(p.code!)}>
                {p.label}
              </button>
            ) : (
              <span>{p.label}</span>
            )}
            <span className="num muted">{Math.round((p.value / v.total) * 100)}%</span>
          </li>
        ))}
      </ul>
      {v.realized !== 0 && (
        <p className="fineprint">
          지금까지 팔아서 생긴 손익 {v.realized >= 0 ? '+' : ''}
          {v.realized.toLocaleString()}G · 수익이 나도 레벨은 오르지 않아요
        </p>
      )}
    </section>
  )
}

// ───────── 종목 상세 ─────────

function TickerSheet({
  code,
  day,
  compare,
  canPropose,
  onClose,
  onPropose,
}: {
  code: string
  day: number
  compare: boolean
  canPropose: boolean
  onClose: () => void
  onPropose: () => void
}) {
  const t = tickerOf(code)
  const [span, setSpan] = useState(20)
  const data = history(code, day, span)
  const sw = swingOf(code)
  return (
    <Page title={t.name} sub="종목 자세히 보기" onExit={onClose}>
      <div className="tk-head">
        <div className="tk-price num">{priceOf(code, day).toLocaleString()}G</div>
        <div className="tk-changes">
          {[1, 5, 20].map((d) => {
            const c = changePct(code, day, d)
            return (
              <span key={d} className={`chg ${c >= 0 ? 'up' : 'down'}`}>
                {d === 1 ? '하루' : `${d}일`} {pct(c)}
              </span>
            )
          })}
        </div>
      </div>
      <div className="chart-box">
        <PriceChart data={data} height={150} />
        <div className="seg mini">
          {[5, 10, 20, 30].map((n) => (
            <button key={n} className={span === n ? 'on' : ''} onClick={() => setSpan(n)}>
              {n}일
            </button>
          ))}
        </div>
      </div>
      <dl className="facts">
        <div>
          <dt>무엇을 담았나</dt>
          <dd>{t.holds}</dd>
        </div>
        <div>
          <dt>흔들림</dt>
          <dd>
            <span className={`pill pill-${sw.tone}`}>{sw.label}</span>
          </dd>
        </div>
        <div>
          <dt>총보수 (1년)</dt>
          <dd>{compare ? t.fee : <span className="muted">ETF 숲 '비교하는 법'을 끝내면 보여요</span>}</dd>
        </div>
      </dl>
      <p className="fineprint">연습용 가격이에요. 실제 시세는 서비스 연결 후 하루 한 번 종가로 바뀌어요.</p>
      {canPropose && (
        <button className="btn btn-primary btn-block" onClick={onPropose}>
          이 종목으로 제안하기
        </button>
      )}
    </Page>
  )
}

// ───────── 제안 목록 ─────────

function Section({ title, empty, list, g, day, onOpen }: { title: string; empty: string; list: Proposal[]; g: Guild; day: number; onOpen: (c: string) => void }) {
  return (
    <>
      <h2 className="section-title">{title}</h2>
      {list.length ? list.map((p) => <ProposalCard key={p.id} g={g} p={p} day={day} onOpen={onOpen} />) : <Empty>{empty}</Empty>}
    </>
  )
}

function ProposalCard({ g, p, day, onOpen }: { g: Guild; p: Proposal; day: number; onOpen: (c: string) => void }) {
  const t = tickerOf(p.ticker)
  const myId = me(g).id
  const myVote = p.votes.find((v) => v.memberId === myId)
  const needRetro = mustRetro(g, p, myId)
  const [open, setOpen] = useState((p.status === 'voting' && !myVote) || needRetro)
  const [opposing, setOpposing] = useState(false)
  const [retroOpen, setRetroOpen] = useState(false)
  const [oppose, setOppose] = useState('')
  const yes = p.votes.filter((v) => v.agree).length
  const need = majority(g)
  const now = priceOf(p.ticker, day)
  const last = p.sellPrice ?? now
  const pnl = p.qty && p.buyPrice ? p.qty * (last - p.buyPrice) : 0
  const ret = p.buyPrice ? ((last - p.buyPrice) / p.buyPrice) * 100 : 0
  const retros = g.retros.filter((r) => r.proposalId === p.id)
  const statusLabel = { voting: '의견 모으는 중', holding: '갖고 있어요', sold: '팔았어요', rejected: '이번엔 패스' }[p.status]
  const held = p.status === 'holding' ? day - p.createdDay : (p.soldDay ?? day) - p.createdDay

  return (
    <article className={`proposal ${p.status}`}>
      <button className="proposal-head" onClick={() => setOpen(!open)}>
        <Avatar g={g} id={p.proposerId} size={40} />
        <div className="grow">
          <span className={`badge ${p.status}`}>{statusLabel}</span>
          <h3>{t.name}</h3>
          <small>
            {memberName(g, p.proposerId)} · <Gold value={p.amount} size={13} />
          </small>
        </div>
        <div className="proposal-right">
          {(p.status === 'holding' || p.status === 'sold') && (
            <span className={`pnl ${pnl >= 0 ? 'up' : 'down'}`}>
              {pnl >= 0 ? '+' : ''}
              {pnl.toLocaleString()}G
              <small>{pct(ret)}</small>
            </span>
          )}
          {needRetro && <span className="dot-alert">돌아보기</span>}
        </div>
      </button>

      {p.status === 'voting' && (
        <div className="vote-meter">
          <div className="vote-track">
            {Array.from({ length: g.members.length }, (_, i) => (
              <i key={i} className={i < yes ? 'yes' : i < p.votes.length ? 'no' : ''} />
            ))}
          </div>
          <span className="small sub">
            좋아 {yes} / {need}명 필요
          </span>
          <span className="voters">
            {p.votes.map((v) => (
              <span key={v.memberId} className={`voter ${v.agree ? 'yes' : 'no'}`}>
                <Avatar g={g} id={v.memberId} size={22} />
              </span>
            ))}
          </span>
        </div>
      )}

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
          <p className="ai-pass">
            <img src={ART.face_calm} alt="" /> AI 친구가 이유를 확인했어요
          </p>
          <button className="text-btn" onClick={() => onOpen(p.ticker)}>
            {t.name} 자세히 보기 ›
          </button>

          {p.votes.some((v) => v.reason) && (
            <ul className="vote-list">
              {p.votes
                .filter((v) => v.reason)
                .map((v) => (
                  <li key={v.memberId}>
                    <Avatar g={g} id={v.memberId} size={26} />
                    <div>
                      <b>{memberName(g, v.memberId)}의 걱정</b>
                      <span>"{v.reason}"</span>
                    </div>
                  </li>
                ))}
            </ul>
          )}

          {p.status === 'voting' && !myVote && !opposing && (
            <div className="row">
              <button className="btn btn-primary" onClick={() => actions.vote(p.id, true)}>
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
                어떤 게 걱정돼? · 경험치 +{RULES.exp.opposeReason}
                <input value={oppose} onChange={(e) => setOppose(e.target.value)} maxLength={80} placeholder="한 줄이면 충분해요" />
              </label>
              <div className="chips">
                {['한 산업에 몰려 있어', '수수료가 높아', '금고에서 비중이 커', '최근에 너무 올랐어'].map((c) => (
                  <button key={c} className="chip" onClick={() => setOppose(c)}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="row">
                <button className="btn" onClick={() => setOpposing(false)}>
                  취소
                </button>
                <button className="btn btn-primary" disabled={oppose.trim().length < 6} onClick={() => actions.vote(p.id, false, oppose.trim())}>
                  의견 보내기
                </button>
              </div>
            </div>
          )}
          {p.status === 'voting' && myVote && <p className="muted">의견 보냈어요 · 친구들 기다리는 중</p>}

          {p.status === 'holding' && (
            <div className="hold">
              <PriceChart data={history(p.ticker, day, Math.max(5, held + 3))} height={90} base={p.buyPrice} />
              <div className="hold-grid">
                <span>산 가격</span>
                <b>{p.buyPrice?.toLocaleString()}G</b>
                <span>지금 가격</span>
                <b>{now.toLocaleString()}G</b>
                <span>수량 · 들고 있은 날</span>
                <b>
                  {p.qty}주 · {held}일
                </b>
              </div>
              <button className="btn" onClick={() => actions.sell(p.id)}>
                팔기
              </button>
            </div>
          )}

          {p.status === 'sold' && (
            <div className="retro-box">
              <div className="result-strip">
                <div>
                  <small>산 가격</small>
                  <b className="num">{p.buyPrice?.toLocaleString()}</b>
                </div>
                <span className="arrow">→</span>
                <div>
                  <small>판 가격</small>
                  <b className="num">{p.sellPrice?.toLocaleString()}</b>
                </div>
                <div className={`result-pct ${ret >= 0 ? 'up' : 'down'}`}>{pct(ret)}</div>
              </div>
              {retros.map((r) => (
                <div key={r.id} className="retro">
                  <div className="retro-who">
                    <Avatar g={g} id={r.authorId} size={24} />
                    <small>
                      {memberName(g, r.authorId)} · {r.role === 'proposer' ? '제안한 사람' : '걱정한 사람'}
                    </small>
                  </div>
                  {r.parts ? (
                    <dl className="retro-parts">
                      <dt>맞았던 것</dt>
                      <dd>{r.parts[0]}</dd>
                      <dt>빗나간 것</dt>
                      <dd>{r.parts[1]}</dd>
                      <dt>다음엔</dt>
                      <dd>{r.parts[2]}</dd>
                    </dl>
                  ) : (
                    <p>{r.text}</p>
                  )}
                </div>
              ))}
              {needRetro && (
                <button className="btn btn-primary btn-block" onClick={() => setRetroOpen(true)}>
                  돌아보기 쓰기 · 경험치 +{RULES.exp.retro}
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {retroOpen && <RetroForm g={g} p={p} onClose={() => setRetroOpen(false)} />}
    </article>
  )
}

function RetroForm({ g, p, onClose }: { g: Guild; p: Proposal; onClose: () => void }) {
  const [parts, setParts] = useState<[string, string, string]>(['', '', ''])
  const myId = me(g).id
  const mine = p.proposerId === myId ? p.reasons[0] : p.votes.find((v) => v.memberId === myId)?.reason
  const labels = ['내 이유 중 맞았던 것', '빗나간 것', '다음엔 이렇게']
  const last = p.sellPrice ?? 0
  const ret = p.buyPrice ? ((last - p.buyPrice) / p.buyPrice) * 100 : 0
  return (
    <Page title="같이 돌아보기" sub={tickerOf(p.ticker).name} onExit={onClose} confirm>
    <div className="retro-form page-form">
      <div className="result-strip">
        <div>
          <small>산 가격</small>
          <b className="num">{p.buyPrice?.toLocaleString()}</b>
        </div>
        <span className="arrow">→</span>
        <div>
          <small>판 가격</small>
          <b className="num">{p.sellPrice?.toLocaleString()}</b>
        </div>
        <div className={`result-pct ${ret >= 0 ? 'up' : 'down'}`}>{pct(ret)}</div>
      </div>
      <div className="retro-form-head">
        <img src={ART.face_calm} alt="" />
        <div>
          <b>같이 돌아보기</b>
          <small>벌었든 잃었든 경험치 +{RULES.exp.retro}</small>
        </div>
      </div>
      {mine && (
        <div className="my-reason">
          <small>그때 내가 쓴 이유</small>
          <p>"{mine}"</p>
        </div>
      )}
      {labels.map((l, i) => (
        <label key={l} className="small-label">
          {l}
          <textarea
            rows={2}
            value={parts[i]}
            onChange={(e) => {
              const n = [...parts] as [string, string, string]
              n[i] = e.target.value
              setParts(n)
            }}
          />
        </label>
      ))}
      <button
        className="btn btn-primary btn-block"
        disabled={parts.some((x) => x.trim().length < 4)}
        onClick={() => {
          actions.writeMyRetro(p.id, parts.map((x) => x.trim()) as [string, string, string])
          onClose()
        }}
      >
        다 썼어요
      </button>
    </div>
    </Page>
  )
}

// ───────── 제안 쓰기 (단계별) ─────────

const STEPS = ['종목', '금액', '이유', '확인']

function ProposalForm({ g, day, start, compare, onClose }: { g: Guild; day: number; start: string; compare: boolean; onClose: () => void }) {
  const [step, setStep] = useState(start ? 1 : 0)
  const [ticker, setTicker] = useState(start || 'K200')
  const [amount, setAmount] = useState(50_000)
  const [reasons, setReasons] = useState<[string, string, string]>(['', '', ''])
  const [focus, setFocus] = useState(0)
  const [result, setResult] = useState<AiResult | null>(null)
  const [checking, setChecking] = useState(false)
  const price = priceOf(ticker, day)
  const qty = Math.floor(amount / price)
  const share = Math.round((amount / vault(g, day).total) * 100)

  const submit = () => {
    setChecking(true)
    setResult(null)
    setStep(3)
    setTimeout(() => {
      const r = actions.propose(ticker, amount, reasons)
      setChecking(false)
      setResult(r)
    }, 1100)
  }

  const setReason = (i: number, v: string) => {
    const n = [...reasons] as [string, string, string]
    n[i] = v
    setReasons(n)
  }

  return (
    <Page title="친구들한테 제안하기" sub={`${step + 1}/4 · ${STEPS[step]}`} onExit={onClose} confirm={!result?.pass}>
      <ol className="stepper">
        {STEPS.map((l, i) => (
          <li key={l} className={i === step ? 'on' : i < step ? 'done' : ''}>
            <span>{i + 1}</span>
            {l}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <div className="ticker-list">
            {TICKERS.map((t) => {
              const ch = changePct(t.code, day, 5)
              const sw = swingOf(t.code)
              return (
                <button key={t.code} className={`ticker ${ticker === t.code ? 'on' : ''}`} onClick={() => setTicker(t.code)}>
                  <span className="tk-l">
                    <b>{t.name}</b>
                    <small>{compare ? `${t.holds} · 보수 ${t.fee}` : t.holds}</small>
                  </span>
                  <span className="tk-r">
                    <span className="num">{priceOf(t.code, day).toLocaleString()}G</span>
                    <span className="tk-tags">
                      <span className={`num ${ch >= 0 ? 'up' : 'down'}`}>5일 {pct(ch)}</span>
                      <span className={`pill pill-${sw.tone}`}>흔들림 {sw.label}</span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          {!compare && <p className="fineprint">ETF 숲 마지막 퀘스트를 끝내면 보수까지 나란히 볼 수 있어요</p>}
          <button className="btn btn-primary btn-block" onClick={() => setStep(1)}>
            다음
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <div className="amount-box">
            <small className="sub">{tickerOf(ticker).name} · 1주 {price.toLocaleString()}G</small>
            <div className="amount-big num">{amount.toLocaleString()}G</div>
            <small className="sub">
              {qty}주 살 수 있어요 · 금고의 {share}%
            </small>
          </div>
          <div className="chips">
            {[10_000, 20_000, 30_000, 50_000, 80_000].map((a) => {
              const q = Math.floor(a / price)
              return (
                <button key={a} className={`chip ${amount === a ? 'on' : ''}`} disabled={q < 1 || a > g.gold} onClick={() => setAmount(a)}>
                  {(a / 10000).toFixed(0)}만G · {q}주
                </button>
              )
            })}
          </div>
          {share >= 40 && <p className="note-warn">금고의 {share}%예요. 한 번에 많이 쓰면 친구들이 걱정할 수 있어요.</p>}
          <div className="row">
            <button className="btn" onClick={() => setStep(0)}>
              이전
            </button>
            <button className="btn btn-primary" disabled={qty < 1} onClick={() => setStep(2)}>
              다음
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          {REASON_LABELS.map((label, i) => (
            <div key={label} className={`reason-field ${focus === i ? 'focus' : ''}`}>
              <label className="small-label">
                <span className="rf-head">
                  {label}
                  <span className="num muted">{reasons[i].length}자</span>
                </span>
                <textarea rows={3} value={reasons[i]} placeholder={REASON_PH[i]} onFocus={() => setFocus(i)} onChange={(e) => setReason(i, e.target.value)} />
              </label>
              {focus === i && (
                <div className="chips">
                  {REASON_CHIPS[i].map((c) => (
                    <button key={c} className="chip" onClick={() => setReason(i, reasons[i] + (reasons[i] && !reasons[i].endsWith(' ') ? ' ' : '') + CHIP_TEXT[c])}>
                      + {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="row">
            <button className="btn" onClick={() => setStep(1)}>
              이전
            </button>
            <button className="btn btn-primary" disabled={reasons.some((r) => r.trim().length < 4)} onClick={submit}>
              이유 확인받기
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <div className="review">
          <img className="review-cat" src={checking ? ART.face_sleepy : result?.pass ? ART.face_happy : ART.face_wow} alt="" />
          {checking ? (
            <p className="review-title">AI 친구가 이유를 읽는 중…</p>
          ) : result?.pass ? (
            <>
              <p className="review-title">좋아요, 친구들한테 올렸어요!</p>
              <p className="sub">이유 확인 통과 · 경험치 +{RULES.exp.proposalPass}</p>
              <div className="review-sum">
                <span>{tickerOf(ticker).name}</span>
                <b className="num">
                  {amount.toLocaleString()}G · {qty}주
                </b>
              </div>
              <button className="btn btn-primary btn-block" onClick={onClose}>
                확인
              </button>
            </>
          ) : (
            result && (
              <>
                <p className="review-title">조금만 더 써볼까요?</p>
                <div className="ai-result no">
                  <p>{result.message}</p>
                  {result.hint && <p className="hint">{result.hint}</p>}
                </div>
                <button className="btn btn-primary btn-block" onClick={() => setStep(2)}>
                  이유 고치기
                </button>
              </>
            )
          )}
        </div>
      )}
    </Page>
  )
}
