// 종목 로고 (서영 언니 인수인계 문서 기준)
// 한국 6자리 = 토스 CDN, 미국 영문 티커 = davidepalazzo/ticker-logos(GitHub). 둘 다 공식 제공이 아니라
// 못 불러오면 이름 첫 글자 + 색 배지로 바꾼다. 상용화 전에는 라이선스 있는 로고로 바꿀 것.
import { useState } from 'react'
import { tickerOf } from '../data/market'

const COLORS = ['#5b8def', '#f07b8f', '#46b39d', '#f2a33a', '#8d7bea', '#3fa7d6', '#e46f4f']
export function logoUrl(code: string): string | null {
  if (/^\d{6}$/.test(code)) return `https://static.toss.im/png-icons/securities/icn-sec-fill-${code}.png`
  if (/^[A-Z]+$/.test(code)) return `https://raw.githubusercontent.com/davidepalazzo/ticker-logos/main/ticker_icons/${code}.png`
  return null
}

export function StockLogo({ code, size = 36 }: { code: string; size?: number }) {
  const t = tickerOf(code)
  const [bad, setBad] = useState(false)
  const url = logoUrl(t.code)
  const n = t.code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  if (!url || bad)
    return (
      <span className="stock-logo badge" style={{ width: size, height: size, background: COLORS[n % COLORS.length], fontSize: size * 0.42 }} aria-hidden>
        {t.name.slice(0, 1)}
      </span>
    )
  return <img className="stock-logo" src={url} alt="" width={size} height={size} loading="lazy" onError={() => setBad(true)} />
}
