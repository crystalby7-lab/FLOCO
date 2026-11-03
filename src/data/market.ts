// 모의매매용 종목과 시세 (prices 컬렉션 자리)
// 지금은 데모용 가상 시세입니다. Firebase 연결 후 공공데이터포털 금융위원회 주식시세정보 종가로 교체.

export type Ticker = {
  code: string
  name: string
  holds: string // 무엇을 담았나
  fee: string // 총보수 (데모 값)
  base: number
  vol: number // 하루 흔들림 정도
  drift: number
}

export const TICKERS: Ticker[] = [
  { code: 'K200', name: '코스피200 ETF', holds: '한국 대표 회사 200곳', fee: '0.15%', base: 36000, vol: 0.012, drift: 0.0004 },
  { code: 'SP500', name: '미국 S&P500 ETF', holds: '미국 대표 회사 500곳', fee: '0.07%', base: 21000, vol: 0.01, drift: 0.0006 },
  { code: 'NDQ', name: '미국 나스닥100 ETF', holds: '미국 기술 기업 100곳', fee: '0.07%', base: 128000, vol: 0.016, drift: 0.0007 },
  { code: 'BATT', name: '2차전지 테마 ETF', holds: '배터리 관련 회사 10~20곳', fee: '0.45%', base: 9800, vol: 0.03, drift: -0.0005 },
  { code: 'BOND', name: '국고채 3년 ETF', holds: '한국 정부가 빌린 돈(채권)', fee: '0.05%', base: 51000, vol: 0.002, drift: 0.0001 },
]

export const tickerOf = (code: string) => TICKERS.find((t) => t.code === code)!

// 같은 날·같은 종목이면 항상 같은 값이 나오는 가짜 난수
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

const cache: Record<string, number> = {}
const HISTORY = 30 // 게임 시작 전 30거래일 시세도 있게 (차트용)

export function priceOf(code: string, gameDay: number): number {
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

export function changePct(code: string, day: number, span = 1): number {
  const now = priceOf(code, day)
  const before = priceOf(code, day - span)
  return ((now - before) / before) * 100
}

export function history(code: string, day: number, span = 20): number[] {
  return Array.from({ length: span + 1 }, (_, i) => priceOf(code, day - span + i))
}

// 흔들림 정도 (하루 변동 폭 기준)
export function swingOf(code: string): { label: '낮음' | '보통' | '높음'; tone: 'moss' | 'sky' | 'berry' } {
  const v = tickerOf(code).vol
  if (v <= 0.005) return { label: '낮음', tone: 'moss' }
  if (v <= 0.015) return { label: '보통', tone: 'sky' }
  return { label: '높음', tone: 'berry' }
}
