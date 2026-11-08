// 같이 투자: 금고 → 종목 살펴보기 → 제안(종목·금액·이유 3칸·AI 검토) → 의견 → 모의매매 → 같이 돌아보기 (F4·F5·F6)
import { useState } from 'react'
import { actions, majority, me, memberName, mustRetro, RULES, unlocked, useGame, vault } from '../store'
import { asOfDate, asOfLabel, changePct, comparePair, feeAsOf, history, priceOf, swingOf, tickerOf, TICKERS } from '../data/market'
import { companyOf, moneyLabel } from '../data/companies'
import { Empty } from '../components/ui'
import { Page } from '../components/Page'
import { PriceChart } from '../components/Chart'
import { Avatar } from '../components/Avatar'
import { ART } from '../components/CatView'
import type { AiResult, Guild, Proposal } from '../types'
import type { Tab } from '../App'
import { InvestAccount } from './InvestAccount'
import { MarketPage, Star } from './Market'
import { OrderBook } from './OrderBook'

// 두 날짜(YYYY-MM-DD) 사이의 날수
const daysBetween = (a: string, b: string) => Math.max(0, Math.round((Date.parse(`${b}T00:00:00`) - Date.parse(`${a}T00:00:00`)) / 86_400_000))

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
  const canPropose = true // 근거 3칸 + AI 확인이 곧 관문이라 퀘스트 잠금 없이 바로 거래
  const [market, setMarket] = useState(false)
  const [selling, setSelling] = useState<{ p: Proposal; price: number } | null>(null)
  const [order, setOrder] = useState<{ price: number; qty: number; type: 'limit' | 'market' } | null>(null)

  const lists = {
    voting: g.proposals.filter((p) => p.status === 'voting'),
    holding: g.proposals.filter((p) => p.status === 'holding'),
    done: g.proposals.filter((p) => p.status === 'sold' || p.status === 'rejected'),
  }

  return (
    <div className="tab-panel">
      <InvestAccount g={g} day={s.day} go={go} onOpen={setViewing} onMarket={() => setMarket(true)} />

      <div className="section-head invest-guild-head">
        <h2>주문 현황</h2>
        <span className="muted">길드 {majority(g)}명이 확인하면 체결돼요 · {asOfLabel() ?? `거래일 ${s.day}`}</span>
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

      {market && <MarketPage day={s.day} onOpen={setViewing} onClose={() => setMarket(false)} />}
      {viewing && (
        <TickerSheet
          code={viewing}
          day={s.day}
          compare={tools.has('etf_compare')}
          canPropose={canPropose}
          holding={g.proposals.filter((p) => p.status === 'holding' && tickerOf(p.ticker).code === tickerOf(viewing).code)}
          onClose={() => setViewing(null)}
          g={g}
          onPropose={() => {
            setWriting(viewing)
            setViewing(null)
            setMarket(false)
          }}
          onBuy={(o) => {
            setOrder(o)
            setWriting(viewing)
          }}
          onSell={(p, price) => setSelling({ p, price })}
        />
      )}
      {selling && (
        <SellSheet
          p={selling.p}
          price={selling.price}
          day={s.day}
          onClose={() => setSelling(null)}
          onDone={() => {
            setSelling(null)
            setViewing(null)
          }}
        />
      )}
      {writing !== null && (
        <ProposalForm
          g={g}
          day={s.day}
          start={writing}
          compare={tools.has('etf_compare')}
          order={order}
          onClose={(done) => {
            setWriting(null)
            setOrder(null)
            if (done) {
              setViewing(null)
              setMarket(false)
            }
          }}
        />
      )}
    </div>
  )
}

// ───────── 종목 상세 ─────────

function TickerSheet({
  code,
  day,
  holding,
  g,
  onClose,
  onBuy,
  onSell,
}: {
  code: string
  day: number
  compare: boolean
  canPropose?: boolean
  holding: Proposal[]
  g: Guild
  onClose: () => void
  onPropose?: () => void
  onBuy: (o: { price: number; qty: number; type: 'limit' | 'market' }) => void
  onSell: (p: Proposal, price: number) => void
}) {
  const [view, setView] = useState<'order' | 'info'>('order')
  const t = tickerOf(code)
  const [span, setSpan] = useState(20)
  const data = history(code, day, span)
  const sw = swingOf(code)
  const pair = comparePair(code)
  const co = companyOf(t.code)
  return (
    <Page title={t.name} sub={asOfLabel() ?? '종목 자세히 보기'} onExit={onClose}>
      <div className="tk-head">
        <div className="tk-star">
          <Star code={t.code} size={26} />
        </div>
        <div className="tk-price num">{priceOf(code, day).toLocaleString()}원</div>
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
      <div className="tk-tabs">
        <button className={view === 'order' ? 'on' : ''} onClick={() => setView('order')}>
          호가·주문
        </button>
        <button className={view === 'info' ? 'on' : ''} onClick={() => setView('info')}>
          차트·정보
        </button>
      </div>
      {view === 'order' ? (
        <OrderBook g={g} code={t.code} day={day} holding={holding} onBuy={onBuy} onSell={onSell} />
      ) : (
      <>
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
          <dt>종목코드</dt>
          <dd>
            {t.code} · {t.index ?? t.track}
          </dd>
        </div>
        {t.fee && (
          <div>
            <dt>
              총보수 (1년)
              <small className="fee-asof">{feeAsOf()}</small>
            </dt>
            <dd>{t.fee}</dd>
          </div>
        )}
      </dl>

      {t.risk && (
        <p className="tk-risk">
          <img src={ART.face_wow} alt="" />
          {t.risk}
        </p>
      )}

      {co && (
        <section className="tk-fin">
          <h3 className="card-title small">이 회사는 얼마나 벌까</h3>
          <div className="tk-fin-row">
            <div>
              <small>매출액</small>
              <b>{moneyLabel(co.revenue)}</b>
            </div>
            <div>
              <small>영업이익</small>
              <b>{moneyLabel(co.profit)}</b>
            </div>
          </div>
          <p className="fineprint">{co.period} · 금융감독원 전자공시(DART)에 회사가 올린 숫자예요.</p>
        </section>
      )}

      {pair.length > 0 && (
        <section className="tk-compare">
          <h3 className="card-title small">비교해보기</h3>
          <p className="sub small">{t.index ? `같은 '${t.index}'를 따라가는데 보수가 달라요.` : '비슷한 상품과 나란히 봐요.'}</p>
          <table>
            <thead>
              <tr>
                <th>　</th>
                <th>{t.name}</th>
                {pair.map((o) => (
                  <th key={o.code}>{o.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>총보수</th>
                <td className="hi">{t.fee ?? '-'}</td>
                {pair.map((o) => (
                  <td key={o.code}>{o.fee ?? '-'}</td>
                ))}
              </tr>
              <tr>
                <th>담은 것</th>
                <td>{t.index ?? t.track}</td>
                {pair.map((o) => (
                  <td key={o.code}>{o.index ?? o.track}</td>
                ))}
              </tr>
              <tr>
                <th>한 주 값</th>
                <td>{priceOf(t.code, day).toLocaleString()}원</td>
                {pair.map((o) => (
                  <td key={o.code}>{priceOf(o.code, day).toLocaleString()}원</td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="fineprint">보수는 {feeAsOf()}예요. 운용사가 바꿀 수 있으니 살 때 다시 확인해요.</p>
        </section>
      )}

      <section className="tk-checks">
        <h3 className="card-title small">확인할 점</h3>
        <ol>
          {t.checks?.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
      </section>
      <p className="fineprint">
        {asOfLabel()
          ? `${asOfLabel()} · 한국거래소 종가예요(공공데이터포털). 사고파는 건 연습용 돈으로만 해요.`
          : '연습용 가격이에요. 종가를 못 받아와서 지금은 연습용 숫자로 움직여요.'}
      </p>
      {holding.length > 0 && (
        <section className="tk-own">
          <h3 className="card-title small">내 길드가 가진 것</h3>
          {holding.map((p) => (
            <div key={p.id} className="tk-own-row">
              <span>
                {p.qty}주 · 평균 {p.buyPrice!.toLocaleString()}원
              </span>
              <b className={priceOf(p.ticker, day) >= p.buyPrice! ? 'up' : 'down'}>
                {(((priceOf(p.ticker, day) - p.buyPrice!) / p.buyPrice!) * 100).toFixed(2)}%
              </b>
            </div>
          ))}
        </section>
      )}
      </>
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
  // 들고 있은 날: 실제 종가로 샀으면 진짜 날짜 차이로, 아니면 데모 거래일 차이로
  const heldByDate = p.createdDate ? daysBetween(p.createdDate, p.soldDate ?? asOfDate() ?? p.createdDate) : null
  const held = heldByDate ?? (p.status === 'holding' ? day - p.createdDay : (p.soldDay ?? day) - p.createdDay)

  return (
    <article className={`proposal ${p.status}`}>
      <button className="proposal-head" onClick={() => setOpen(!open)}>
        <Avatar g={g} id={p.proposerId} size={40} />
        <div className="grow">
          <span className={`badge ${p.status}`}>{statusLabel}</span>
          <h3>{t.name}</h3>
          <small>
            {memberName(g, p.proposerId)} · <span className="num">{p.amount.toLocaleString()}원</span>
          </small>
        </div>
        <div className="proposal-right">
          {(p.status === 'holding' || p.status === 'sold') && (
            <span className={`pnl ${pnl >= 0 ? 'up' : 'down'}`}>
              {pnl >= 0 ? '+' : ''}
              {pnl.toLocaleString()}원
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
                <b>{p.buyPrice?.toLocaleString()}원</b>
                <span>지금 가격</span>
                <b>{now.toLocaleString()}원</b>
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

const STEPS = ['종목', '수량', '근거', '확인']

function ProposalForm({ g, day, start, compare, order, onClose }: { g: Guild; day: number; start: string; compare: boolean; order?: { price: number; qty: number; type: 'limit' | 'market' } | null; onClose: (done?: boolean) => void }) {
  const [step, setStep] = useState(order ? 2 : start ? 1 : 0)
  const [ticker, setTicker] = useState(start || '069500')
  const [qtyIn, setQtyIn] = useState(0)
  const [reasons, setReasons] = useState<[string, string, string]>(['', '', ''])
  const [focus, setFocus] = useState(0)
  const [result, setResult] = useState<AiResult | null>(null)
  const [checking, setChecking] = useState(false)
  const price = order?.price ?? priceOf(ticker, day)
  const maxQty = Math.floor(g.cash / price)
  const qty = order?.qty ?? Math.min(qtyIn || Math.max(1, Math.floor(1_000_000 / price)), maxQty)
  const amount = qty * price
  const share = Math.round((amount / vault(g, day).total) * 100)

  const submit = () => {
    setChecking(true)
    setResult(null)
    setStep(3)
    setTimeout(() => {
      const r = actions.propose(ticker, amount, reasons, order ?? undefined)
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
    <Page title="매수 주문" sub={`${step + 1}/4 · ${STEPS[step]}`} onExit={onClose} confirm={!result?.pass}>
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
                    <span className="num">{priceOf(t.code, day).toLocaleString()}원</span>
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
            <small className="sub">
              {tickerOf(ticker).name} · 1주 {price.toLocaleString()}원
            </small>
            <div className="qty-step">
              <button onClick={() => setQtyIn(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="한 주 빼기">
                −
              </button>
              <div>
                <b className="num">{qty.toLocaleString()}주</b>
                <small className="num">{amount.toLocaleString()}원</small>
              </div>
              <button onClick={() => setQtyIn(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} aria-label="한 주 더하기">
                +
              </button>
            </div>
            <small className="sub">
              주문가능금액 {g.cash.toLocaleString()}원 · 내 계좌의 {share}%
            </small>
          </div>
          <div className="chips qty-chips">
            {[10, 25, 50, 100].map((r) => {
              const q = Math.floor((g.cash * r) / 100 / price)
              return (
                <button key={r} className="chip" disabled={q < 1} onClick={() => setQtyIn(q)}>
                  {r === 100 ? '최대' : `${r}%`}
                </button>
              )
            })}
          </div>
          {share >= 40 && <p className="note-warn">내 계좌의 {share}%예요. 한 번에 많이 쓰면 친구들이 걱정할 수 있어요.</p>}
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
          {order && (
            <div className="order-sum">
              <span>
                {tickerOf(ticker).name} · {order.type === 'limit' ? '지정가' : '시장가'}
              </span>
              <b className="num">
                {order.price.toLocaleString()}원 × {order.qty}주 = {(order.price * order.qty).toLocaleString()}원
              </b>
            </div>
          )}
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
            <button className="btn" onClick={() => (order ? onClose() : setStep(1))}>
              이전
            </button>
            <button className="btn btn-primary" disabled={reasons.some((r) => r.trim().length < 4)} onClick={submit}>
              근거 확인받고 주문
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
              <p className="review-title">주문을 넣었어요! 길드 친구들이 확인하면 체결돼요</p>
              <p className="sub">이유 확인 통과 · 경험치 +{RULES.exp.proposalPass}</p>
              <div className="review-sum">
                <span>{tickerOf(ticker).name}</span>
                <b className="num">
                  {amount.toLocaleString()}원 · {qty}주
                </b>
              </div>
              <button className="btn btn-primary btn-block" onClick={() => onClose(true)}>
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

// ───────── 매도: 왜 파는지 한 줄 쓰고 팔기 ─────────

const SELL_CHIPS = ['산 이유가 달라졌어요', '목표했던 만큼 올랐어요', '다른 종목이 더 맞아 보여요', '손실이 더 커질까 걱정돼요']

function SellSheet({ p, day, price: at, onClose, onDone }: { p: Proposal; day: number; price?: number; onClose: () => void; onDone: () => void }) {
  const [why, setWhy] = useState('')
  const price = at ?? priceOf(p.ticker, day)
  const pnl = (price - p.buyPrice!) * p.qty!
  return (
    <Page title="매도 주문" sub={tickerOf(p.ticker).name} onExit={onClose} confirm={why.length > 0}>
      <div className="amount-box">
        <small className="sub">
          {p.qty}주 × {price.toLocaleString()}원
        </small>
        <div className="amount-big num">{(p.qty! * price).toLocaleString()}원</div>
        <small className={pnl >= 0 ? 'up' : 'down'}>
          산 값보다 {pnl >= 0 ? '+' : ''}
          {pnl.toLocaleString()}원
        </small>
      </div>
      <div className="sell-why">
        <small>처음 산 이유</small>
        <p>{p.reasons[0]}</p>
      </div>
      <label className="small-label">
        왜 지금 팔아요?
        <textarea rows={3} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="처음 이유와 비교해서 써봐요 (5자 이상)" />
      </label>
      <div className="chips">
        {SELL_CHIPS.map((c) => (
          <button key={c} className="chip" onClick={() => setWhy(c + ' ')}>
            + {c}
          </button>
        ))}
      </div>
      <button
        className="btn btn-block order-sell"
        disabled={why.trim().length < 5}
        onClick={() => {
          actions.sell(p.id, why.trim(), price)
          onDone()
        }}
      >
        매도하기
      </button>
      <p className="fineprint">팔고 나면 '지난 이야기'에서 길드와 같이 돌아봐요.</p>
    </Page>
  )
}
