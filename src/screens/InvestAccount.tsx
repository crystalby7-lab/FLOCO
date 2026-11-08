// 투자 탭 윗부분: 실제 증권 앱처럼 생긴 '플로코 모의투자 계좌'.
// 숫자마다 ⓘ를 누르면 고양이가 그 말이 무슨 뜻인지 설명해줘서, 화면을 보면서 용어를 배운다.
import { useState, type ReactNode } from 'react'
import { actions, RULES, useGame, vault } from '../store'
import { TickerRow } from './Market'
import { ACCOUNT_GUIDE, Coach } from '../components/Coach'
import { asOfLabel, changePct, kospiChange, tickerOf } from '../data/market'
import { ART } from '../components/CatView'
import { Page } from '../components/Page'
import type { Guild } from '../types'
import type { Tab } from '../App'

// 무엇을 따라가는 종목인지 (국내 / 미국 / 그 외)
const marketOf = (code: string) => tickerOf(code).market
const isUS = (code: string) => marketOf(code) === 'us'
const flagOf = (code: string) => (marketOf(code) === 'us' ? '🇺🇸' : marketOf(code) === 'kr' ? '🇰🇷' : '🌏')
const won = (n: number) => `${Math.round(n).toLocaleString()}원`
// 2026-11-06 → 11월 6일
const dayLabel = (iso: string) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`
const signed = (n: number) => `${n >= 0 ? '+' : ''}${Math.round(n).toLocaleString()}원`
const pctTxt = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
const tone = (v: number) => (v > 0 ? 'up' : v < 0 ? 'down' : '')

// 용어 사전: 숫자 옆 ⓘ를 누르면 나온다
const TERMS: Record<string, { title: string; body: string; ex: string }> = {
  total: { title: '총 자산', body: '계좌에 있는 현금과, 지금 가진 종목을 오늘 값으로 계산한 금액을 더한 거예요.', ex: '현금 50,000원 + 종목 평가금 52,000원 = 총 자산 102,000원' },
  cash: { title: '주문가능금액', body: '지금 바로 새 종목을 살 때 쓸 수 있는 현금이에요. 이미 산 종목에 들어간 돈은 빠져 있어요.', ex: '계좌 1,000,000원 중 30,000원으로 ETF를 샀다면 주문가능금액은 70,000원' },
  invested: { title: '투자중 금액', body: '가지고 있는 종목들을 오늘 값으로 계산한 금액이에요. 값이 오르내리면 같이 바뀌어요.', ex: '10주 × 오늘 값 2,100원 = 21,000원' },
  eval: { title: '평가금', body: '아직 팔지 않은 종목을 지금 판다고 쳤을 때의 금액이에요. 팔기 전까지는 확정된 돈이 아니에요.', ex: '샀을 때 20,000원 → 지금 평가금 21,000원' },
  pnl: { title: '수익금', body: '평가금에서 처음 산 금액을 뺀 거예요. 빨간색은 이익, 파란색은 손해예요.', ex: '21,000원 - 20,000원 = +1,000원' },
  rate: { title: '수익률', body: '처음 넣은 돈에 비해 몇 % 늘었거나 줄었는지예요. 금액이 달라도 서로 비교할 수 있어요.', ex: '20,000원으로 1,000원 벌면 +5%' },
  avg: { title: '평균 단가', body: '여러 번에 나눠 샀다면, 한 주를 평균 얼마에 샀는지예요.', ex: '2,000원에 1주, 2,200원에 1주 → 평균 2,100원' },
  market: { title: '장 운영 시간', body: '주식은 정해진 시간에만 사고팔 수 있어요. 한국은 오전 9시~오후 3시 30분, 미국은 한국 시간으로 밤에 열려요.', ex: '장이 닫혀 있으면 다음 날 열릴 때 가격이 바뀌어요' },
  hoga: { title: '호가', body: '사고 싶은 사람과 팔고 싶은 사람이 부른 가격표예요. 위쪽 파란 칸은 팔려는 가격(매도호가), 아래 빨간 칸은 사려는 가격(매수호가), 옆 숫자는 그 가격에 몇 주가 기다리는지(잔량)예요.', ex: '가장 싼 매도호가 25,535원에 사면 바로 체결돼요' },
  limit: { title: '지정가 주문', body: '내가 정한 가격에만 사거나 팔아요. 그 가격에 팔 사람(살 사람)이 없으면 체결되지 않고 기다려요.', ex: '25,500원에 사겠다고 했는데 가장 싼 매도호가가 25,535원이면 안 사져요' },
  marketOrder: { title: '시장가 주문', body: '가격을 정하지 않고 지금 있는 가장 좋은 호가로 바로 사고팔아요. 빨리 체결되지만 생각보다 비싸게 살 수 있어요.', ex: '시장가 매수 → 가장 싼 매도호가에 바로 체결' },
  today: { title: '오늘 등락', body: '어제와 비교해 오늘 값이 얼마나 움직였는지예요. 하루 숫자보다 산 이유가 그대로인지가 더 중요해요.', ex: '어제 2,000원 → 오늘 2,040원 = +2%' },
}

export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const t = TERMS[id]
  return (
    <>
      <button
        className="term-btn"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label={`${t.title} 뜻 보기`}
      >
        {children}
        <i>i</i>
      </button>
      {open && (
        <div className="ask-layer" onClick={() => setOpen(false)}>
          <div className="ask-sheet term-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ask-cat">
              <img src={ART.t_think} alt="" style={{ height: 76 }} />
            </div>
            <h3>{t.title}</h3>
            <p>{t.body}</p>
            <div className="term-ex">
              <small>예를 들면</small>
              {t.ex}
            </div>
            <button className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
              알겠어요
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// 실제 시각으로 장이 열렸는지 (한국 09:00~15:30, 미국 정규장 한국시간 23:30~06:00 근사)
function sessionOf(kind: 'kr' | 'us') {
  const kst = new Date(Date.now() + (new Date().getTimezoneOffset() + 540) * 60000)
  const day = kst.getDay()
  const m = kst.getHours() * 60 + kst.getMinutes()
  if (kind === 'kr') return day >= 1 && day <= 5 && m >= 540 && m < 930
  const open = (day >= 1 && day <= 5 && m >= 1410) || (day >= 2 && day <= 6 && m < 360)
  return open
}

export function InvestAccount({ g, day, go, onOpen, onMarket }: { g: Guild; day: number; go: (t: Tab) => void; onOpen: (code: string) => void; onMarket: () => void }) {
  const gs = useGame()
  const watch = gs.watch
  const [coach, setCoach] = useState(!gs.guides.includes('account'))
  const [tab, setTab] = useState<'own' | 'watch'>('own')
  const [region, setRegion] = useState<'all' | 'kr' | 'us'>('all')
  const [sort, setSort] = useState<'value' | 'rate'>('value')
  const [page, setPage] = useState<null | 'assets' | 'rewards' | 'trades' | 'tips'>(null)
  const v = vault(g, day)
  const totalPnl = v.total - RULES.startCash
  const totalRate = (totalPnl / RULES.startCash) * 100
  const cost = v.holdings.reduce((a, h) => a + h.p.qty! * h.p.buyPrice!, 0)
  const rate = cost ? (v.pnl / cost) * 100 : 0
  const kr = v.holdings.filter((h) => !isUS(h.p.ticker))
  const us = v.holdings.filter((h) => isUS(h.p.ticker))
  const shown = (region === 'kr' ? kr : region === 'us' ? us : v.holdings).slice().sort((a, b) => (sort === 'value' ? b.value - a.value : b.pct - a.pct))

  return (
    <div className="acct">
      <div className="acct-tabs">
        <button className={tab === 'own' ? 'on' : ''} onClick={() => setTab('own')}>
          보유
        </button>
        <button className={tab === 'watch' ? 'on' : ''} onClick={() => setTab('watch')}>
          관심
        </button>
        <span className="grow" />
        <button className="acct-guide-btn" onClick={() => setCoach(true)}>
          가이드
        </button>
        <button className="acct-tip-btn" onClick={() => setPage('tips')}>
          투자팁
        </button>
      </div>

      <div className="mkt-row">
        <Market name="KOSPI" hours="09:00 - 15:30 KST" flag="🇰🇷" open={sessionOf('kr')} ch={kospiChange(day)} />
        <Market name="NASDAQ" hours="09:30 - 16:00 ET" flag="🇺🇸" open={sessionOf('us')} ch={changePct('133690', day)} />
      </div>

      <button className="go-market-top" onClick={onMarket}>
        <img src={ART.t_happy} alt="" />
        <span>
          <b>투자하러 가기</b>
          <small>종목 25개 둘러보고 근거 써서 사기</small>
        </span>
        <i>›</i>
      </button>

      {tab === 'own' ? (
        <>
          <section className="acct-card">
            <div className="acct-owner">
              <span>{g.name}의 모의투자 계좌</span>
              <img src={ART.sit} alt="" />
            </div>
            <span className="acct-asof">{asOfLabel() ?? '연습용 시세'}</span>
            <Term id="total">
              <small className="acct-label">총 자산</small>
            </Term>
            <b className="acct-total">{won(v.total)}</b>
            <span className={`acct-change ${tone(totalPnl)}`}>
              {signed(totalPnl)}
              <em>
                {totalPnl >= 0 ? '▲' : '▼'} {Math.abs(totalRate).toFixed(2)}%
              </em>
              <small>시작 자산 {won(RULES.startCash)} 대비</small>
            </span>
            <div className="acct-btns">
              <button onClick={() => setPage('assets')}>
                <span className="ab-ico">📊</span>자산 구성
              </button>
              <button onClick={() => setPage('rewards')}>
                <span className="ab-ico">🎁</span>보상내역
              </button>
              <button onClick={() => setPage('trades')}>
                <span className="ab-ico">🧾</span>거래내역
              </button>
            </div>
          </section>

          <section className="acct-split">
            <div>
              <Term id="cash">
                <small>주문가능금액</small>
              </Term>
              <b className="blue-num">{won(v.cash)}</b>
            </div>
            <div>
              <Term id="invested">
                <small>투자중 금액</small>
              </Term>
              <b>{won(v.invested)}</b>
            </div>
          </section>

          <button className="acct-learn" onClick={() => go('map')}>
            <img src={ART.t_sprout} alt="" />
            퀘스트로 투자 공부하고 코인 받기 ›
          </button>

          <div className="acct-region">
            {(
              [
                ['all', `전체 ${v.holdings.length}`],
                ['kr', `🇰🇷 국내 ${kr.length}`],
                ['us', `🇺🇸 미국 ${us.length}`],
              ] as const
            ).map(([k, label]) => (
              <button key={k} className={region === k ? 'on' : ''} onClick={() => setRegion(k)}>
                {label}
              </button>
            ))}
          </div>

          <section className="acct-sum">
            <div>
              <Term id="eval">
                <small>평가금</small>
              </Term>
              <b>{won(v.invested)}</b>
            </div>
            <div>
              <Term id="pnl">
                <small>수익금</small>
              </Term>
              <b className={tone(v.pnl)}>{signed(v.pnl)}</b>
            </div>
            <div>
              <Term id="rate">
                <small>수익률</small>
              </Term>
              <b className={tone(rate)}>{pctTxt(rate)}</b>
            </div>
          </section>

          <div className="hold-head">
            <b>보유 {shown.length}종목</b>
            <div className="hold-sort">
              <button className={sort === 'value' ? 'on' : ''} onClick={() => setSort('value')}>
                평가금액순
              </button>
              <button className={sort === 'rate' ? 'on' : ''} onClick={() => setSort('rate')}>
                수익률순
              </button>
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="hold-empty">
              <img src={ART.t_think} alt="" />
              <p>
                아직 산 종목이 없어요.
                <br />
                '투자하러 가기'에서 종목을 고르고 근거를 써서 사봐요.
              </p>
              <button className="btn btn-sm" onClick={onMarket}>
                투자하러 가기
              </button>
            </div>
          ) : (
            <ul className="hold-list">
              {shown.map((h) => {
                const t = tickerOf(h.p.ticker)
                const today = changePct(h.p.ticker, day)
                return (
                  <li key={h.p.id}>
                    <button onClick={() => onOpen(h.p.ticker)}>
                      <span className="hold-ico">{flagOf(t.code)}</span>
                      <span className="hold-name">
                        <b>{t.name}</b>
                        <small>
                          {h.p.qty}주 · 평균 {won(h.p.buyPrice!)}
                        </small>
                      </span>
                      <span className="hold-num">
                        <b>{won(h.value)}</b>
                        <small className={tone(today)}>오늘 {pctTxt(today)}</small>
                        <small className={tone(h.pct)}>수익 {pctTxt(h.pct)}</small>
                      </span>
                    </button>
                    <p className="hold-why">
                      <span>산 이유</span>
                      {h.p.reasons[0]}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      ) : (
        <>
          {watch.length === 0 ? (
            <div className="hold-empty">
              <img src={ART.t_think} alt="" />
              <p>
                아직 관심 종목이 없어요.
                <br />
                종목 옆 ☆를 누르면 여기 모여요.
              </p>
              <button className="btn btn-sm" onClick={onMarket}>
                투자하러 가기
              </button>
            </div>
          ) : (
            <ul className="mk-list">
              {watch.map((c) => (
                <TickerRow key={c} code={c} day={day} onOpen={onOpen} />
              ))}
            </ul>
          )}
          <div className="watch-note">
            <Term id="today">
              <small>숫자 옆 % 는 무슨 뜻일까?</small>
            </Term>
          </div>
        </>
      )}

      {page === 'assets' && <AssetsPage g={g} day={day} onClose={() => setPage(null)} />}
      {page === 'rewards' && <RewardsPage g={g} onClose={() => setPage(null)} />}
      {page === 'trades' && <TradesPage g={g} onClose={() => setPage(null)} />}
      {page === 'tips' && <TipsPage onClose={() => setPage(null)} />}
      {coach && tab === 'own' && (
        <Coach
          steps={ACCOUNT_GUIDE}
          onDone={() => {
            setCoach(false)
            actions.seeGuide('account')
          }}
        />
      )}
    </div>
  )
}

function Market({ name, hours, flag, open, ch }: { name: string; hours: string; flag: string; open: boolean; ch: number }) {
  return (
    <div className="mkt-card">
      <span className="mkt-flag">{flag}</span>
      <div className="grow">
        <b>{name}</b>
        <small>{hours}</small>
      </div>
      <div className="mkt-right">
        <span className={`mkt-state ${open ? 'open' : ''}`}>
          <i />
          {open ? '장중' : '마감'}
        </span>
        <small className={tone(ch)}>{pctTxt(ch)}</small>
      </div>
    </div>
  )
}

// ───────── 하위 화면 ─────────

const COLORS = ['#2f6bd8', '#f08ca0', '#45b88a', '#f2b84b', '#8b6bd6']

function AssetsPage({ g, day, onClose }: { g: Guild; day: number; onClose: () => void }) {
  const v = vault(g, day)
  const parts = [{ name: '현금', value: v.cash, color: '#c9d6e6' }, ...v.holdings.map((h, i) => ({ name: tickerOf(h.p.ticker).name, value: h.value, color: COLORS[i % COLORS.length] }))]
  return (
    <Page title="자산 구성" sub="금고가 어디에 나뉘어 있나요" onExit={onClose}>
      <section className="card">
        <div className="alloc big">
          {parts.map((p) => (
            <i key={p.name} style={{ flex: p.value, background: p.color }} />
          ))}
        </div>
        <ul className="asset-list">
          {parts.map((p) => (
            <li key={p.name}>
              <i style={{ background: p.color }} />
              <span className="grow">{p.name}</span>
              <b>{won(p.value)}</b>
              <small>{Math.round((p.value / v.total) * 100)}%</small>
            </li>
          ))}
        </ul>
      </section>
      <Tip text="한 곳에 다 넣지 않고 나눠 담으면, 하나가 크게 흔들려도 금고 전체는 덜 흔들려요. 이걸 '분산'이라고 해요." />
    </Page>
  )
}

function RewardsPage({ g, onClose }: { g: Guild; onClose: () => void }) {
  const list = g.feed.filter((f) => /\+\s?\d|코인/.test(f.text) && !/경험치/.test(f.text))
  return (
    <Page title="보상내역" sub="공부하고 돌봐서 받은 보상" onExit={onClose}>
      {list.length === 0 ? (
        <p className="pp-empty">아직 받은 보상이 없어요. 퀘스트를 끝내거나 오늘 할 일을 채워봐요.</p>
      ) : (
        <ul className="hist-list card">
          {list.map((f) => (
            <li key={f.id}>
              <span className="hist-ico">{f.icon}</span>
              <span className="grow">{f.text}</span>
              <small>{new Date(f.at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</small>
            </li>
          ))}
        </ul>
      )}
      <Tip text="퀘스트를 끝내면 투자금이, 고양이를 돌보면 게임 코인이 쌓여요. 급하게 벌려고 하지 않아도 괜찮아요." />
    </Page>
  )
}

function TradesPage({ g, onClose }: { g: Guild; onClose: () => void }) {
  const rows = g.proposals
    .filter((p) => p.qty && p.buyPrice)
    .flatMap((p) => {
      const t = tickerOf(p.ticker).name
      const out = [{ id: p.id + 'b', day: p.createdDay, date: p.createdDate, kind: '매수', name: t, qty: p.qty!, price: p.buyPrice!, why: p.reasons[0] }]
      if (p.status === 'sold' && p.sellPrice)
        out.push({ id: p.id + 's', day: p.soldDay ?? p.createdDay, date: p.soldDate ?? p.createdDate, kind: '매도', name: t, qty: p.qty!, price: p.sellPrice, why: '' })
      return out
    })
    .sort((a, b) => b.day - a.day)
  return (
    <Page title="거래내역" sub="언제, 무엇을, 왜 샀고 팔았나" onExit={onClose}>
      {rows.length === 0 ? (
        <p className="pp-empty">아직 거래가 없어요. 길드 제안이 통과되면 여기에 기록돼요.</p>
      ) : (
        <ul className="hist-list card">
          {rows.map((r) => (
            <li key={r.id} className="trade">
              <span className={`trade-kind ${r.kind === '매수' ? 'up' : 'down'}`}>{r.kind}</span>
              <span className="grow">
                <b>{r.name}</b>
                <small>
                  {r.date ? dayLabel(r.date) : `거래일 ${r.day}`} · {r.qty}주 × {won(r.price)}
                </small>
                {r.why && <small className="trade-why">이유: {r.why}</small>}
              </span>
              <b>{won(r.qty * r.price)}</b>
            </li>
          ))}
        </ul>
      )}
      <Tip text="거래마다 '왜'가 함께 남아 있어요. 나중에 돌아볼 때 결과보다 이유가 맞았는지를 먼저 봐요." />
    </Page>
  )
}

const TIPS = [
  ['산 이유를 적어두기', '값이 흔들릴 때 감정이 아니라 처음 이유로 다시 판단할 수 있어요.'],
  ['한 번에 다 쓰지 않기', '주문가능금액을 남겨두면 더 좋은 기회나 실수에 대비할 수 있어요.'],
  ['나눠 담기(분산)', '여러 회사를 담은 ETF나 여러 종목으로 나누면 한 곳이 흔들려도 덜 흔들려요.'],
  ['수수료 확인하기', '총보수 0.07%와 0.45%는 작아 보여도 오래 들고 있으면 차이가 커져요.'],
  ['하루 숫자에 덜 흔들리기', '오늘 등락보다, 산 이유가 아직 맞는지를 보는 게 더 중요해요.'],
  ['모르는 건 사지 않기', '설명할 수 없는 상품은 사지 않는 것도 좋은 판단이에요.'],
]

function TipsPage({ onClose }: { onClose: () => void }) {
  return (
    <Page title="투자팁" sub="고양이 선배들이 알려주는 기본기" onExit={onClose}>
      <ul className="tips-list">
        {TIPS.map(([h, b], i) => (
          <li key={h} className="card">
            <span className="tip-no">{i + 1}</span>
            <div>
              <b>{h}</b>
              <p>{b}</p>
            </div>
          </li>
        ))}
      </ul>
    </Page>
  )
}

function Tip({ text }: { text: string }) {
  return (
    <div className="pp-quote acct-quote">
      <img src={ART.t_wave} alt="" />
      <p>{text}</p>
    </div>
  )
}
