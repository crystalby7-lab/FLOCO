// 증권 앱 주문창: 왼쪽 호가(파는 사람 / 사는 사람), 오른쪽 주문(지정가·시장가, 가격, 수량).
// 실제 호가는 증권사 API가 있어야 해서, 실제 종가를 가운데에 두고 연습용 호가를 만든다.
// 체결 규칙도 실제처럼: 사려는 값이 가장 싼 매도호가보다 낮으면 체결되지 않는다.
import { useState } from 'react'
import { priceOf, tickerOf } from '../data/market'
import { actions, useGame } from '../store'
import { Coach, ORDER_GUIDE } from '../components/Coach'
import { Term } from './InvestAccount'
import type { Guild, Proposal } from '../types'

// 호가 한 칸의 크기 (ETF는 5원, 주식은 가격대별 한국거래소 기준)
export function tickOf(code: string, price: number) {
  if (tickerOf(code).kind === 'etf') return 5
  if (price < 2000) return 1
  if (price < 5000) return 5
  if (price < 20000) return 10
  if (price < 50000) return 50
  if (price < 200000) return 100
  if (price < 500000) return 500
  return 1000
}

// 같은 날·같은 종목이면 늘 같은 잔량이 나오게
function qtyAt(code: string, day: number, i: number) {
  const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 97 + day * 31 + i * 7
  const x = Math.sin(seed) * 10000
  const r = x - Math.floor(x)
  return Math.round(200 + r * 4800 * (1 - Math.abs(i) / 14))
}

// 가장 싼 매도호가 = 종가 + 1틱, 가장 비싼 매수호가 = 종가
export function bookOf(code: string, day: number) {
  const close = priceOf(code, day)
  const tick = tickOf(code, close)
  const ask = close + tick
  const asks = Array.from({ length: 8 }, (_, i) => ({ p: ask + (7 - i) * tick, q: qtyAt(code, day, 7 - i + 1) }))
  const bids = Array.from({ length: 8 }, (_, i) => ({ p: close - i * tick, q: qtyAt(code, day, -(i + 1)) }))
  return { close, tick, ask, bid: close, asks, bids }
}

const won = (n: number) => n.toLocaleString()

export function OrderBook({
  g,
  code,
  day,
  holding,
  onBuy,
  onSell,
}: {
  g: Guild
  code: string
  day: number
  holding: Proposal[]
  onBuy: (o: { price: number; qty: number; type: 'limit' | 'market' }) => void
  onSell: (p: Proposal, price: number) => void
}) {
  const b = bookOf(code, day)
  const gs = useGame()
  const [coach, setCoach] = useState(!gs.guides.includes('order'))
  const prev = priceOf(code, day - 1)
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [type, setType] = useState<'limit' | 'market'>('limit')
  const [price, setPrice] = useState(b.ask)
  const own = holding[0]
  const ownQty = holding.reduce((a, p) => a + (p.qty ?? 0), 0)

  // 실제로 체결될 값
  const fill = side === 'buy' ? (type === 'market' ? b.ask : price >= b.ask ? b.ask : null) : type === 'market' ? b.bid : price <= b.bid ? b.bid : null
  const unit = type === 'market' ? (side === 'buy' ? b.ask : b.bid) : price
  const maxQty = side === 'buy' ? Math.floor(g.cash / unit) : ownQty
  const [qtyIn, setQtyIn] = useState(0)
  const qty = Math.max(0, Math.min(qtyIn || (side === 'buy' ? Math.min(maxQty, Math.max(1, Math.floor(1_000_000 / unit))) : ownQty), maxQty))
  const total = qty * unit

  const pick = (p: number) => {
    setType('limit')
    setPrice(p)
  }
  const rate = (p: number) => ((p - prev) / prev) * 100
  const tone = (p: number) => (p > prev ? 'up' : p < prev ? 'down' : '')
  const maxQ = Math.max(...b.asks.map((a) => a.q), ...b.bids.map((x) => x.q))

  return (
    <>
    <button className="ob-guide" onClick={() => setCoach(true)}>
      처음이에요? 주문창 가이드 보기
    </button>
    <div className="ob">
      <div className="ob-book">
        <div className="ob-head">
          <Term id="hoga">
            <small>호가</small>
          </Term>
          <small>잔량</small>
        </div>
        {b.asks.map((a) => (
          <button key={'a' + a.p} className={`ob-row ask ${price === a.p && type === 'limit' ? 'sel' : ''}`} onClick={() => pick(a.p)}>
            <i style={{ width: `${(a.q / maxQ) * 100}%` }} />
            <span className={tone(a.p)}>
              {won(a.p)}
              <em>{rate(a.p).toFixed(2)}%</em>
            </span>
            <small>{won(a.q)}</small>
          </button>
        ))}
        <div className="ob-now">
          <span>종가</span>
          <b className={tone(b.close)}>{won(b.close)}</b>
        </div>
        {b.bids.map((a) => (
          <button key={'b' + a.p} className={`ob-row bid ${price === a.p && type === 'limit' ? 'sel' : ''}`} onClick={() => pick(a.p)}>
            <i style={{ width: `${(a.q / maxQ) * 100}%` }} />
            <span className={tone(a.p)}>
              {won(a.p)}
              <em>{rate(a.p).toFixed(2)}%</em>
            </span>
            <small>{won(a.q)}</small>
          </button>
        ))}
        <p className="ob-note">연습용 호가예요 · 실제 종가 기준</p>
      </div>

      <div className="ob-form">
        <div className="ob-side">
          <button className={side === 'buy' ? 'on buy' : ''} onClick={() => setSide('buy')}>
            매수
          </button>
          <button className={side === 'sell' ? 'on sell' : ''} disabled={!own} onClick={() => setSide('sell')}>
            매도
          </button>
        </div>
        <div className="ob-type">
          {(['limit', 'market'] as const).map((t) => (
            <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>
              {t === 'limit' ? '지정가' : '시장가'}
            </button>
          ))}
          <Term id={type === 'limit' ? 'limit' : 'marketOrder'} />
        </div>

        <label className="ob-label">가격</label>
        <div className={`ob-step ${type === 'market' ? 'off' : ''}`}>
          <button disabled={type === 'market'} onClick={() => setPrice(price - b.tick)}>
            −
          </button>
          <b>{type === 'market' ? '시장가' : won(price)}</b>
          <button disabled={type === 'market'} onClick={() => setPrice(price + b.tick)}>
            +
          </button>
        </div>

        <label className="ob-label">수량</label>
        <div className="ob-step">
          <button disabled={qty <= 1} onClick={() => setQtyIn(Math.max(1, qty - 1))}>
            −
          </button>
          <b>{won(qty)}주</b>
          <button disabled={qty >= maxQty} onClick={() => setQtyIn(qty + 1)}>
            +
          </button>
        </div>
        {side === 'buy' && (
          <div className="ob-pcts">
            {[10, 25, 50, 100].map((r) => (
              <button key={r} onClick={() => setQtyIn(Math.max(1, Math.floor((g.cash * r) / 100 / unit)))}>
                {r === 100 ? '최대' : `${r}%`}
              </button>
            ))}
          </div>
        )}

        <div className="ob-sum">
          <div>
            <small>{side === 'buy' ? '주문가능' : '보유'}</small>
            <span>{side === 'buy' ? `${won(g.cash)}원` : `${won(ownQty)}주`}</span>
          </div>
          <div>
            <small>주문금액</small>
            <b>{won(total)}원</b>
          </div>
        </div>

        {fill === null ? (
          <p className="ob-warn">
            {side === 'buy'
              ? `가장 싼 매도호가가 ${won(b.ask)}원이라, 이 가격엔 팔 사람이 없어요. 실제 시장에선 대기 주문으로 남아요.`
              : `가장 비싼 매수호가가 ${won(b.bid)}원이라, 이 가격엔 살 사람이 없어요.`}
          </p>
        ) : (
          <p className="ob-fill">
            {won(fill)}원에 체결될 거예요{side === 'buy' && type === 'limit' && price > b.ask ? ' (더 싼 매도호가부터 사요)' : ''}
          </p>
        )}

        <button
          className={`btn ob-go ${side}`}
          disabled={fill === null || qty < 1}
          onClick={() => (side === 'buy' ? onBuy({ price: fill!, qty, type }) : onSell(own!, fill!))}
        >
          {side === 'buy' ? '근거 쓰고 매수' : '이유 쓰고 매도'}
        </button>
      </div>
    </div>
    {coach && (
      <Coach
        steps={ORDER_GUIDE}
        onDone={() => {
          setCoach(false)
          actions.seeGuide('order')
        }}
      />
    )}
    </>
  )
}
