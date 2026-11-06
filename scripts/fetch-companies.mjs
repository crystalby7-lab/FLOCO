// 대형주 실적 받아오기 (분기마다 실행)
//
//   DART_API_KEY=... node scripts/fetch-companies.mjs
//
// 금융감독원 OpenDART '단일회사 주요계정'에서 최근 매출액·영업이익을 받아
// public/companies.json에 저장한다. 종목 상세에서 "이 회사는 얼마나 벌까"를 보여주는 데 쓴다.
//
// 키가 없거나 받아오지 못하면 companies.json을 건드리지 않는다.

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const OUT = resolve('public/companies.json')
const KEY = process.env.DART_API_KEY ?? ''

const TABLE = JSON.parse(await readFile(resolve('src/data/tickers.json'), 'utf8'))
const STOCKS = TABLE.items.filter((t) => t.kind === 'stock' && t.dart)

// 보고서 종류: 1분기 / 반기 / 3분기 / 사업보고서
const REPORTS = [
  { code: '11013', name: '1분기' },
  { code: '11012', name: '상반기' },
  { code: '11014', name: '3분기' },
  { code: '11011', name: '한 해 전체' },
]

const num = (s) => {
  const n = Number(String(s ?? '').replace(/[^0-9-]/g, ''))
  return Number.isFinite(n) && n !== 0 ? n : null
}

async function dart(path, params) {
  const qs = new URLSearchParams({ crtfc_key: KEY, ...params })
  const res = await fetch(`https://opendart.fss.or.kr/api/${path}?${qs}`, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  // 000 정상 / 013 데이터 없음 / 020 키 문제 …
  if (data.status && data.status !== '000') throw new Error(`${data.status} ${data.message ?? ''}`.trim())
  return data
}

// 하드코딩한 고유번호가 맞는지 종목코드로 확인한다 (틀리면 그 회사는 건너뛴다)
async function verify(t) {
  const info = await dart('company.json', { corp_code: t.dart })
  const stock = String(info.stock_code ?? '').trim()
  if (stock !== t.code) throw new Error(`고유번호가 다른 회사예요 (${info.corp_name ?? '?'} ${stock})`)
  return info.corp_name ?? t.name
}

// 가장 최근에 공시된 보고서에서 매출액·영업이익을 꺼낸다
async function latestFigures(t) {
  const thisYear = new Date().getFullYear()
  for (const year of [thisYear, thisYear - 1]) {
    for (const r of [...REPORTS].reverse()) {
      let data
      try {
        data = await dart('fnlttSinglAcnt.json', { corp_code: t.dart, bsns_year: String(year), reprt_code: r.code })
      } catch {
        continue // 아직 안 나온 보고서
      }
      const rows = (data.list ?? []).filter((x) => x.fs_div === 'CFS' || !x.fs_div) // 연결재무제표 우선
      const find = (names) => rows.find((x) => names.some((n) => String(x.account_nm).replace(/\s/g, '').includes(n)))
      const revenue = num(find(['매출액', '수익(매출액)', '영업수익'])?.thstrm_amount)
      const profit = num(find(['영업이익'])?.thstrm_amount)
      if (revenue || profit) return { year, period: `${year}년 ${r.name}`, revenue, profit }
    }
  }
  throw new Error('매출·영업이익을 못 찾았어요')
}

async function main() {
  if (!KEY) throw new Error('DART_API_KEY가 없어요')
  if (!STOCKS.length) throw new Error('tickers.json에 dart 고유번호가 있는 종목이 없어요')

  const items = {}
  const failed = []
  for (const t of STOCKS) {
    try {
      const corpName = await verify(t)
      const f = await latestFigures(t)
      items[t.code] = { name: t.name, corpName, corpCode: t.dart, ...f, unit: '원' }
      const eok = (n) => (n ? `${Math.round(n / 100_000_000).toLocaleString()}억원` : '-')
      console.log(`· ${t.name} ${f.period} 매출 ${eok(f.revenue)} 영업이익 ${eok(f.profit)}`)
    } catch (e) {
      failed.push(`${t.name}(${t.code}): ${e.message}`)
    }
  }
  if (failed.length) console.warn(`· 못 받은 회사\n  - ${failed.join('\n  - ')}`)
  if (!Object.keys(items).length) throw new Error('받은 회사가 하나도 없어요')

  const out = { updatedAt: new Date().toISOString(), source: '금융감독원 OpenDART 단일회사 주요계정', items }

  const before = await readFile(OUT, 'utf8').catch(() => null)
  const body = (o) => JSON.stringify({ ...o, updatedAt: undefined })
  if (before && body(JSON.parse(before)) === body(out)) {
    console.log('· 바뀐 실적이 없어 그대로 둡니다')
    return
  }
  await writeFile(OUT, `${JSON.stringify(out, null, 2)}\n`, 'utf8')
  console.log(`· public/companies.json 저장 (${Object.keys(items).length}개 회사)`)
}

main().catch((e) => {
  console.error(`· 실적을 받지 못했어요: ${e.message}`)
  console.error('· public/companies.json은 그대로 둡니다')
  process.exit(0)
})
