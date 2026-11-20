// 투자하러 가기: 학습용 종목 전체를 묶음별로 보고, 별로 관심 등록하고, 눌러서 자세히 → 매수
import { useRef, useState } from 'react'
import { actions, useGame } from '../store'
import { asOfLabel, changePct, history, priceOf, swingOf, TICKERS, usdOf } from '../data/market'
import { StockLogo } from '../components/StockLogo'
import { Page } from '../components/Page'
import { PriceChart } from '../components/Chart'

export const GROUPS: { id: string; label: string; codes: string[] }[] = [
  { id: 'kr', label: '국내 지수', codes: ['069500', '102110', '278530', '229200'] },
  { id: 'us', label: '미국 따라가는 국내 ETF', codes: ['360750', '379800', '133690', '381170'] },
  { id: 'usetf', label: '미국 ETF', codes: ['SPY', 'VOO', 'QQQ', 'SCHD', 'DIA'] },
  { id: 'usstock', label: '미국 주식', codes: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NFLX', 'DIS', 'KO', 'MCD', 'NKE', 'COST', 'AMD', 'SBUX'] },
  { id: 'theme', label: '섹터·테마', codes: ['091160', '139260', '305720', '305540'] },
  { id: 'world', label: '해외', codes: ['192090', '371460', '241180'] },
  { id: 'div', label: '배당·리츠', codes: ['161510', '329200'] },
  { id: 'safe', label: '채권·금', codes: ['114260', '153130', '132030'] },
  { id: 'stock', label: '대형주', codes: ['005930', '000660', '005380', '035420', '035720'] },
]

const flag = (m: string) => (m === 'us' ? '🇺🇸' : m === 'other' ? '🌏' : '🇰🇷')
const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

export function Star({ code, size = 20 }: { code: string; size?: number }) {
  const s = useGame()
  const on = s.watch.includes(code)
  return (
    <button
      className={`star-btn ${on ? 'on' : ''}`}
      aria-label={on ? '관심 종목에서 빼기' : '관심 종목에 넣기'}
      onClick={(e) => {
        e.stopPropagation()
        actions.toggleWatch(code)
      }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
        <path
          d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"
          fill={on ? '#f6c344' : 'none'}
          stroke={on ? '#e0a92a' : '#b6c2d1'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export function TickerRow({ code, day, onOpen }: { code: string; day: number; onOpen: (c: string) => void }) {
  const t = TICKERS.find((x) => x.code === code)
  if (!t) return null
  const ch = changePct(code, day)
  const sw = swingOf(code)
  return (
    <li className="mk-row">
      <button onClick={() => onOpen(code)}>
        <span className="mk-logo">
          <StockLogo code={code} size={36} />
          <i>{flag(t.market)}</i>
        </span>
        <span className="mk-name">
          <b>{t.name}</b>
          <small>
            {t.holds}
            {sw.label === '높음' && <em className="mk-hot">흔들림 높음</em>}
          </small>
        </span>
        <span className="mk-chart">
          <PriceChart data={history(code, day, 12)} height={28} compact />
        </span>
        <span className="hold-num">
          <b>{priceOf(code, day).toLocaleString()}원</b>
          {usdOf(code, day) != null && <small className="usd">${usdOf(code, day)!.toLocaleString()}</small>}
          <small className={ch > 0 ? 'up' : ch < 0 ? 'down' : ''}>{pct(ch)}</small>
        </span>
      </button>
      <Star code={code} />
    </li>
  )
}

export function MarketPage({ day, onOpen, onClose }: { day: number; onOpen: (c: string) => void; onClose: () => void }) {
  const [group, setGroup] = useState('all')
  const [q, setQ] = useState('')
  const shown = GROUPS.filter((gr) => group === 'all' || gr.id === group)
  // 종목 묶음을 옆으로 넘기기: 화살표 버튼 · 칩 줄 끌기 · 목록 좌우 밀기
  const ORDER = ['all', ...GROUPS.map((gr) => gr.id)]
  const chipsRef = useRef<HTMLDivElement>(null)
  const move = (dir: number) => {
    const i = Math.min(ORDER.length - 1, Math.max(0, ORDER.indexOf(group) + dir))
    setGroup(ORDER[i])
    requestAnimationFrame(() => chipsRef.current?.querySelector<HTMLElement>(`[data-g="${ORDER[i]}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }))
  }
  const touch = useRef<{ x: number; y: number } | null>(null)
  const drag = useRef<{ x: number; left: number } | null>(null)
  const match = (code: string) => {
    const t = TICKERS.find((x) => x.code === code)
    return !q.trim() || (t && (t.name.includes(q.trim()) || t.code.includes(q.trim()) || t.holds.includes(q.trim())))
  }
  return (
    <Page title="투자하러 가기" sub={asOfLabel() ?? '연습용 시세'} onExit={onClose}>
      <input className="mk-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="종목 이름이나 코드로 찾기" />
      <div className="mk-chipbar">
        <button className="mk-arrow" disabled={group === ORDER[0]} onClick={() => move(-1)} aria-label="이전 묶음">
          ‹
        </button>
        <div
          className="mk-chips"
          ref={chipsRef}
          onWheel={(e) => {
            if (chipsRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) chipsRef.current.scrollLeft += e.deltaY
          }}
          onMouseDown={(e) => (drag.current = { x: e.clientX, left: chipsRef.current?.scrollLeft ?? 0 })}
          onMouseMove={(e) => {
            if (drag.current && chipsRef.current) chipsRef.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x)
          }}
          onMouseUp={() => (drag.current = null)}
          onMouseLeave={() => (drag.current = null)}
        >
          <button data-g="all" className={group === 'all' ? 'on' : ''} onClick={() => setGroup('all')}>
            전체
          </button>
          {GROUPS.map((gr) => (
            <button key={gr.id} data-g={gr.id} className={group === gr.id ? 'on' : ''} onClick={() => setGroup(gr.id)}>
              {gr.label}
            </button>
          ))}
        </div>
        <button className="mk-arrow" disabled={group === ORDER[ORDER.length - 1]} onClick={() => move(1)} aria-label="다음 묶음">
          ›
        </button>
      </div>
      <div
        className="mk-swipe"
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          const t = touch.current
          touch.current = null
          if (!t) return
          const dx = e.changedTouches[0].clientX - t.x
          const dy = e.changedTouches[0].clientY - t.y
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1)
        }}
      >
      {shown.map((gr) => {
        const codes = gr.codes.filter(match)
        if (!codes.length) return null
        return (
          <section key={gr.id} className="mk-group">
            <h3>{gr.label}</h3>
            <ul>
              {codes.map((c) => (
                <TickerRow key={c} code={c} day={day} onOpen={onOpen} />
              ))}
            </ul>
          </section>
        )
      })}
      </div>
      <p className="fineprint mk-foot">☆를 누르면 관심 탭에 모여요. 종목을 누르면 자세히 보고 살 수 있어요.</p>
    </Page>
  )
}
