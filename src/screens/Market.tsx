// 투자하러 가기: 학습용 종목 전체를 묶음별로 보고, 별로 관심 등록하고, 눌러서 자세히 → 매수
import { useState } from 'react'
import { actions, useGame } from '../store'
import { asOfLabel, changePct, history, priceOf, swingOf, TICKERS } from '../data/market'
import { Page } from '../components/Page'
import { PriceChart } from '../components/Chart'

export const GROUPS: { id: string; label: string; codes: string[] }[] = [
  { id: 'kr', label: '국내 지수', codes: ['069500', '102110', '278530', '229200'] },
  { id: 'us', label: '미국', codes: ['360750', '379800', '133690', '381170'] },
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
        <span className="hold-ico">{flag(t.market)}</span>
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
  const match = (code: string) => {
    const t = TICKERS.find((x) => x.code === code)
    return !q.trim() || (t && (t.name.includes(q.trim()) || t.code.includes(q.trim()) || t.holds.includes(q.trim())))
  }
  return (
    <Page title="투자하러 가기" sub={asOfLabel() ?? '연습용 시세'} onExit={onClose}>
      <input className="mk-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="종목 이름이나 코드로 찾기" />
      <div className="mk-chips">
        <button className={group === 'all' ? 'on' : ''} onClick={() => setGroup('all')}>
          전체
        </button>
        {GROUPS.map((gr) => (
          <button key={gr.id} className={group === gr.id ? 'on' : ''} onClick={() => setGroup(gr.id)}>
            {gr.label}
          </button>
        ))}
      </div>
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
      <p className="fineprint mk-foot">☆를 누르면 관심 탭에 모여요. 종목을 누르면 자세히 보고 살 수 있어요.</p>
    </Page>
  )
}
