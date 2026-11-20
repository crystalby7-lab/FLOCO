// 미국 종목 종가 + 원/달러 환율 받기 (GitHub Actions가 매일 아침 실행)
//
//   node scripts/fetch-us-prices.mjs
//
// 야후 파이낸스 v8 chart(비공식, 키 없음)에서 최근 종가를 받아 그날 환율로 원화로 바꾼 뒤
// public/prices_us.json에 저장한다. 앱은 원화 값(c)으로 계좌를 계산하고, 달러 값(u)은 보여주기만 한다.
// 서영 언니 인수인계 문서 기준: v8 chart, User-Agent 헤더, query1 → query2 예비 호스트.
// 받아오지 못하면 파일을 건드리지 않는다 (지난 값 유지).

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const OUT = resolve('public/prices_us.json')
const DAYS = 60
const TABLE = JSON.parse(await readFile(resolve('src/data/tickers.json'), 'utf8'))
const US = TABLE.items.filter((t) => t.exchange === 'US')
const HOSTS = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com']
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const day = (sec, offset) => new Date((sec + offset) * 1000).toISOString().slice(0, 10)

async function chart(symbol) {
  let last
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=6mo`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(20000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      const r = j?.chart?.result?.[0]
      const ts = r?.timestamp ?? []
      const close = r?.indicators?.quote?.[0]?.close ?? []
      const off = r?.meta?.gmtoffset ?? 0
      const rows = ts.map((t, i) => ({ d: day(t, off), v: close[i] })).filter((x) => typeof x.v === 'number' && x.v > 0)
      if (rows.length < 2) throw new Error('데이터 없음')
      // 같은 날짜가 두 번 오면 나중 것
      const byDay = new Map(rows.map((x) => [x.d, x.v]))
      return [...byDay].map(([d, v]) => ({ d, v })).sort((a, b) => a.d.localeCompare(b.d))
    } catch (e) {
      last = e
    }
  }
  throw last
}

const fxRows = await chart('KRW=X').catch((e) => {
  console.error('환율 실패:', e.message)
  return null
})
if (!fxRows) process.exit(0)
const fxAt = (d) => {
  let v = fxRows[0].v
  for (const r of fxRows) {
    if (r.d > d) break
    v = r.v
  }
  return v
}

const series = {}
for (const t of US) {
  try {
    const rows = (await chart(t.code.replace('.', '-'))).slice(-DAYS)
    series[t.code] = rows.map((r) => ({ d: r.d, c: Math.round(r.v * fxAt(r.d)), u: Math.round(r.v * 100) / 100 }))
    console.log(t.code, rows.length, rows.at(-1))
  } catch (e) {
    console.error(t.code, '실패:', e.message)
  }
  await sleep(400)
}

const got = Object.keys(series).length
if (got < Math.ceil(US.length / 2)) {
  console.error(`미국 종목을 ${got}/${US.length}개만 받아서 파일을 쓰지 않아요.`)
  process.exit(0)
}
const asOf = Object.values(series).map((s) => s.at(-1).d).sort().at(-1)
const out = {
  updatedAt: new Date().toISOString(),
  asOf,
  source: 'Yahoo Finance v8 chart (비공식, 약 15분 지연·종가 기준) · 환율 KRW=X',
  fx: fxRows.slice(-DAYS).map((r) => ({ d: r.d, c: Math.round(r.v * 100) / 100 })),
  series,
}
await writeFile(OUT, JSON.stringify(out))
console.log(`저장: ${got}개 종목, ${asOf}`)
