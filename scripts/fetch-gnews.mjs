// 경제 뉴스 헤드라인 받기 (GitHub Actions가 3시간마다 실행)
//
//   GNEWS_API_KEY=... node scripts/fetch-gnews.mjs
//
// GNews(gnews.io, 무료 하루 100회)에서 한국어 경제 뉴스를 받아 public/gnews.json에 저장한다.
// 제목·한 줄 설명·출처·링크만 저장(기사 전문은 저장하지 않음). 코인·단타·추천성 기사는 거른다.
// 키가 없거나 받아오지 못하면 파일을 건드리지 않는다.
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const KEY = (process.env.GNEWS_API_KEY ?? '').trim()
if (!KEY) {
  console.log('GNEWS_API_KEY가 없어서 건너뛰어요.')
  process.exit(0)
}
const OUT = resolve('public/gnews.json')
const BAN = /코인|비트코인|가상자산|암호화폐|단타|급등주|테마주|리딩방|무조건|대박|폭등|따상|추천주|매수 추천|목표주가/

async function get(path, params) {
  const qs = new URLSearchParams({ lang: 'ko', country: 'kr', max: '10', apikey: KEY, ...params })
  const res = await fetch(`https://gnews.io/api/v4/${path}?${qs}`, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}`)
  return (await res.json()).articles ?? []
}

const lists = await Promise.allSettled([get('top-headlines', { category: 'business' }), get('search', { q: '경제 OR 증시 OR 금리 OR 환율', sortby: 'publishedAt' })])
const seen = new Set()
const items = []
for (const r of lists) {
  if (r.status !== 'fulfilled') {
    console.error(r.reason?.message)
    continue
  }
  for (const a of r.value) {
    const title = (a.title ?? '').trim()
    if (!title || !a.url || seen.has(a.url) || BAN.test(title + (a.description ?? ''))) continue
    seen.add(a.url)
    items.push({ title, desc: (a.description ?? '').trim().slice(0, 140), url: a.url, source: a.source?.name ?? '', at: a.publishedAt ?? '' })
  }
}
if (items.length < 3) {
  console.error(`기사가 ${items.length}개뿐이라 파일을 쓰지 않아요.`)
  process.exit(0)
}
items.sort((a, b) => b.at.localeCompare(a.at))
await writeFile(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), source: 'GNews', items: items.slice(0, 12) }))
console.log(`저장: ${Math.min(12, items.length)}개`)
