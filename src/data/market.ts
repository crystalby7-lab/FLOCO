// 모의매매용 종목과 시세
//
// 실제 종가로 움직인다. scripts/fetch-prices.mjs가 공공데이터포털(금융위원회)에서
// 최근 60거래일 종가를 받아 public/prices.json에 넣고, 앱이 그걸 읽는다.
// 종가를 못 받으면(파일 없음·네트워크 실패) 예전처럼 가짜 시세로 돌아간다.
//
// 종목 정보(단축코드·정식 이름·총보수)는 2026-11-06에 운용사·ETF 공시로 확인한 값.

export type Ticker = {
  code: string // 앱에서 쓰는 코드
  stock: string // 실제 단축코드 (6자리)
  name: string // 정식 이름
  holds: string // 무엇을 담았나
  index: string // 기초지수
  fee: string // 총보수 (연)
  base: number // ↓ 아래 셋은 종가를 못 받았을 때 쓰는 가짜 시세용
  vol: number
  drift: number
}

export const TICKERS: Ticker[] = [
  { code: 'K200', stock: '069500', name: 'KODEX 200', holds: '한국 대표 회사 200곳', index: '코스피 200', fee: '0.150%', base: 36000, vol: 0.012, drift: 0.0004 },
  { code: 'SP500', stock: '360750', name: 'TIGER 미국S&P500', holds: '미국 대표 회사 500곳', index: 'S&P 500', fee: '0.0068%', base: 21000, vol: 0.01, drift: 0.0006 },
  { code: 'NDQ', stock: '133690', name: 'TIGER 미국나스닥100', holds: '미국 기술 기업 100곳', index: '나스닥 100', fee: '0.0068%', base: 128000, vol: 0.016, drift: 0.0007 },
  { code: 'BATT', stock: '305720', name: 'KODEX 2차전지산업', holds: '배터리 관련 회사 10~20곳', index: 'FnGuide 2차전지 산업', fee: '0.450%', base: 9800, vol: 0.03, drift: -0.0005 },
  { code: 'BOND', stock: '114260', name: 'KODEX 국고채3년', holds: '한국 정부가 빌린 돈(채권)', index: 'MKF 국고채지수(총수익)', fee: '0.150%', base: 51000, vol: 0.002, drift: 0.0001 },
]

export const tickerOf = (code: string) => TICKERS.find((t) => t.code === code)!

// ───────── 실제 종가 ─────────

export type Close = { d: string; c: number } // 날짜(YYYY-MM-DD), 종가
export type Prices = {
  updatedAt: string
  asOf: string // 가장 최근 거래일
  series: Record<string, Close[]> // 단축코드별 최근 종가 (오래된 것 → 최신)
  kospi?: Close[]
}

let real: Prices | null = null

export const isRealPrices = () => real !== null
export const asOfDate = () => real?.asOf ?? null
export const kospiSeries = () => real?.kospi ?? null

// 'N월 N일 종가 기준' 표시용
export function asOfLabel(): string | null {
  if (!real) return null
  const [, m, d] = real.asOf.split('-')
  return `${Number(m)}월 ${Number(d)}일 종가 기준`
}

const REMOTE = 'https://raw.githubusercontent.com/crystalby7-lab/FLOCO/main/public/prices.json'
const LOCAL = `${import.meta.env.BASE_URL}prices.json`

function usable(p: Prices) {
  // 다섯 종목 모두 이틀치 이상 있어야 차트와 등락률을 그릴 수 있다
  return !!p?.asOf && TICKERS.every((t) => (p.series?.[t.stock]?.length ?? 0) >= 2)
}

export async function loadPrices(): Promise<boolean> {
  for (const url of [REMOTE, LOCAL]) {
    try {
      const ctl = new AbortController()
      const timer = setTimeout(() => ctl.abort(), 5000)
      const res = await fetch(url, { signal: ctl.signal, cache: 'no-cache' }).finally(() => clearTimeout(timer))
      if (!res.ok) continue
      const data = (await res.json()) as Prices
      if (usable(data)) {
        real = data
        cache = {}
        return true
      }
    } catch {
      /* 다음 주소로 */
    }
  }
  return false // 가짜 시세로 간다
}

// ───────── 가짜 시세 (종가를 못 받았을 때만) ─────────

// 같은 날·같은 종목이면 항상 같은 값이 나오는 가짜 난수
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

let cache: Record<string, number> = {}
const HISTORY = 30 // 게임 시작 전 30거래일 시세도 있게 (차트용)

function fakePrice(code: string, gameDay: number): number {
  const day = gameDay + HISTORY
  const key = `${code}:${day}`
  if (cache[key]) return cache[key]
  const t = tickerOf(code)
  let p = t.base
  const seedBase = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  for (let d = 1; d <= day; d++) {
    const r = rand(seedBase * 1000 + d) * 2 - 1
    p = p * (1 + t.drift + r * t.vol)
  }
  cache[key] = Math.round(p)
  return cache[key]
}

// ───────── 값 꺼내기 ─────────
// day는 '오늘(가장 최근 거래일)에서 며칠 전인지'. 0이면 최신 종가, -5면 5거래일 전.
// 실제 종가를 쓸 때는 미래(day > 0)를 만들 수 없으니 최신 종가로 붙잡아 둔다.

export function priceOf(code: string, day: number): number {
  if (real) {
    const s = real.series[tickerOf(code).stock]
    if (s?.length) {
      const i = Math.min(s.length - 1, Math.max(0, s.length - 1 + day))
      return s[i].c
    }
  }
  return fakePrice(code, day)
}

// 그 값이 어느 날짜의 종가인지
export function dateOf(code: string, day: number): string | null {
  if (!real) return null
  const s = real.series[tickerOf(code).stock]
  if (!s?.length) return null
  const i = Math.min(s.length - 1, Math.max(0, s.length - 1 + day))
  return s[i].d
}

export function changePct(code: string, day: number, span = 1): number {
  const now = priceOf(code, day)
  const before = priceOf(code, day - span)
  return before ? ((now - before) / before) * 100 : 0
}

export function history(code: string, day: number, span = 20): number[] {
  return Array.from({ length: span + 1 }, (_, i) => priceOf(code, day - span + i))
}

// 코스피 지수 등락률 (지수를 못 받았으면 코스피200 ETF로 대신)
export function kospiChange(day: number, span = 1): number {
  const k = real?.kospi
  if (k?.length) {
    const i = Math.min(k.length - 1, Math.max(0, k.length - 1 + day))
    const j = Math.max(0, i - span)
    return k[j].c ? ((k[i].c - k[j].c) / k[j].c) * 100 : 0
  }
  return changePct('K200', day, span)
}

// 흔들림 정도: 실제 종가가 있으면 최근 20거래일 하루 변동 폭으로 계산한다
export function swingOf(code: string): { label: '낮음' | '보통' | '높음'; tone: 'moss' | 'sky' | 'berry' } {
  let v = tickerOf(code).vol
  const s = real?.series[tickerOf(code).stock]
  if (s && s.length > 5) {
    const tail = s.slice(-21)
    const moves = tail.slice(1).map((x, i) => Math.abs((x.c - tail[i].c) / tail[i].c))
    v = moves.reduce((a, b) => a + b, 0) / moves.length
  }
  if (v <= 0.005) return { label: '낮음', tone: 'moss' }
  if (v <= 0.015) return { label: '보통', tone: 'sky' }
  return { label: '높음', tone: 'berry' }
}
