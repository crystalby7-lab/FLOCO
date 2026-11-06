// 실제 종가 받아오기 (GitHub Actions가 평일 저녁 6시에 실행)
//
//   DATA_GO_KR_KEY=... node scripts/fetch-prices.mjs
//
// 공공데이터포털 금융위원회
//   · 증권상품시세정보(ETF)  /1160100/GetSecuritiesProductInfoService_V2/getETFPriceInfo_V2
//   · 지수시세정보(주가지수) /1160100/GetMarketIndexInfoService_V2/getStockMarketIndex_V2
// 에서 최근 60거래일 종가와 코스피 지수를 받아 public/prices.json에 저장한다.
//
// 키가 없거나 받아오지 못하면 prices.json을 건드리지 않는다 (지난 시세 유지).

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const OUT = resolve('public/prices.json')
const DAYS = 60 // 남길 거래일 수
const LOOKBACK = 120 // 휴일을 감안해 넉넉히 조회할 달력 일수

// 종목 목록은 앱과 같은 파일에서 읽는다 (src/data/tickers.json)
const TABLE = JSON.parse(await readFile(resolve('src/data/tickers.json'), 'utf8'))
const ETFS = TABLE.items.filter((t) => t.kind === 'etf')
const STOCKS = TABLE.items.filter((t) => t.kind === 'stock')

const ETF_URL = 'https://apis.data.go.kr/1160100/GetSecuritiesProductInfoService_V2/getETFPriceInfo_V2'
const STOCK_URL = 'https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2'
const INDEX_URL = 'https://apis.data.go.kr/1160100/GetMarketIndexInfoService_V2/getStockMarketIndex_V2'

// 포털 키는 '인코딩 키'와 '디코딩 키' 두 가지로 주어진다.
// URLSearchParams가 다시 인코딩하므로 %가 들어 있으면 먼저 풀어준다.
const rawKey = process.env.DATA_GO_KR_KEY ?? ''
const KEY = rawKey.includes('%') ? decodeURIComponent(rawKey) : rawKey

const ymd = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
const dash = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`

async function call(url, params) {
  const qs = new URLSearchParams({ serviceKey: KEY, resultType: 'json', numOfRows: '400', pageNo: '1', ...params })
  const res = await fetch(`${url}?${qs}`, { signal: AbortSignal.timeout(20000) })
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 160)}`)
  let data
  try {
    data = JSON.parse(text)
  } catch {
    // 키가 잘못되면 XML 에러가 온다
    throw new Error(`JSON이 아닌 응답: ${text.slice(0, 160)}`)
  }
  // 키가 틀리면 형태가 다른 오류가 온다
  const authErr = data?.OpenAPI_ServiceResponse?.cmmMsgHeader
  if (authErr) throw new Error(`${authErr.errMsg ?? ''} ${authErr.returnAuthMsg ?? ''}`.trim())
  const header = data?.response?.header
  if (header && header.resultCode !== '00') throw new Error(`${header.resultCode} ${header.resultMsg}`)
  const items = data?.response?.body?.items?.item
  return Array.isArray(items) ? items : items ? [items] : []
}

// 응답에서 (날짜, 종가)만 꺼내 오래된 것 → 최신 순으로
function toSeries(items, pick) {
  const rows = items
    .filter(pick)
    .map((it) => ({ d: dash(String(it.basDt)), c: Number(it.clpr) }))
    .filter((r) => r.d.length === 10 && Number.isFinite(r.c) && r.c > 0)
  const byDate = new Map(rows.map((r) => [r.d, r])) // 같은 날 중복 제거
  return [...byDate.values()].sort((a, b) => a.d.localeCompare(b.d)).slice(-DAYS)
}

async function main() {
  if (!KEY) throw new Error('DATA_GO_KR_KEY가 없어요')

  const end = new Date()
  const begin = new Date(end.getTime() - LOOKBACK * 86_400_000)
  const range = { beginBasDt: ymd(begin), endBasDt: ymd(end) }

  const series = {}
  const missing = []

  // likeSrtnCd로 부분 검색한 뒤 정확히 일치하는 것만 고른다 (srtnCd 파라미터는 무시된다)
  const grab = async (url, t) => {
    try {
      const items = await call(url, { ...range, likeSrtnCd: t.code })
      const rows = toSeries(items, (it) => String(it.srtnCd) === t.code)
      if (rows.length < 2) throw new Error(`${rows.length}일치뿐`)
      series[t.code] = rows
      console.log(`· ${t.name} ${rows.length}일 (마지막 ${rows[rows.length - 1].d} ${rows[rows.length - 1].c.toLocaleString()}원)`)
    } catch (e) {
      missing.push(`${t.name}(${t.code}): ${e.message}`)
    }
  }

  for (const t of ETFS) await grab(ETF_URL, t)
  for (const t of STOCKS) await grab(STOCK_URL, t)

  if (missing.length) console.warn(`· 못 받은 종목 ${missing.length}개\n  - ${missing.join('\n  - ')}`)
  // 절반도 못 받으면 뭔가 잘못된 것 — 파일을 건드리지 않는다
  if (Object.keys(series).length < Math.ceil(TABLE.items.length / 2)) throw new Error(`받은 종목이 너무 적어요 (${Object.keys(series).length}/${TABLE.items.length})`)

  // 코스피 지수 (없어도 신문·화면은 돌아간다)
  let kospi = []
  try {
    const items = await call(INDEX_URL, { ...range, idxNm: '코스피' })
    kospi = toSeries(items, (it) => String(it.idxNm).trim() === '코스피')
    console.log(`· 코스피 지수 ${kospi.length}일`)
  } catch (e) {
    console.warn(`· 코스피 지수는 건너뜀 (${e.message})`)
  }

  // 가장 최근 거래일 = 종목들이 공통으로 가진 마지막 날짜 중 가장 이른 것
  const asOf = Object.values(series)
    .map((s) => s[s.length - 1].d)
    .sort()
    .at(-1)

  const prices = {
    updatedAt: new Date().toISOString(),
    asOf,
    source: '공공데이터포털 금융위원회 증권상품시세정보(ETF) · 지수시세정보',
    series,
    ...(kospi.length ? { kospi } : {}),
  }

  const before = await readFile(OUT, 'utf8').catch(() => null)
  const body = (o) => JSON.stringify({ ...o, updatedAt: undefined })
  if (before && body(JSON.parse(before)) === body(prices)) {
    console.log('· 바뀐 종가가 없어 그대로 둡니다')
    return
  }
  await writeFile(OUT, `${JSON.stringify(prices, null, 2)}\n`, 'utf8')
  console.log(`· public/prices.json 저장 (기준일 ${asOf})`)
}

main().catch((e) => {
  // 못 받으면 지난 시세를 그대로 둔다. 앱은 파일이 아예 없으면 가짜 시세로 돈다.
  console.error(`· 종가를 받지 못했어요: ${e.message}`)
  console.error('· public/prices.json은 그대로 둡니다')
  process.exit(0)
})
