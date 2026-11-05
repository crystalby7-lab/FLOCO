// 오늘의 플로코 신문 만들기 (GitHub Actions가 3시간마다 실행)
//
//   node scripts/fetch-news.mjs
//
// 1) 경제 뉴스 RSS 몇 곳에서 최신 기사를 받는다
// 2) 코인·단타·추천성 기사는 버리고, 키워드로 섹션을 나눈다
// 3) GEMINI_API_KEY가 있으면 무료 Gemini API로 고양이 말투 요약과 오늘의 단어를 만들고,
//    없거나 실패하면 제목 + 첫 문장으로 대신한다
// 4) public/news.json에 저장한다 (내용이 같으면 쓰지 않는다 → 커밋도 안 생김)
//
// 원칙: 기사 전문은 저장하지 않는다. 요약과 링크만. 매수·매도 추천 표현은 쓰지 않는다.

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const OUT = resolve('public/news.json')
const PER_SECTION = 3 // 섹션마다 링크 최대 개수
const UA = 'floco-news-bot (+https://github.com/crystalby7-lab/FLOCO)'

const FEEDS = [
  { url: 'https://www.yna.co.kr/rss/economy.xml', source: '연합뉴스 경제', scope: 'home' },
  { url: 'https://www.yna.co.kr/rss/market.xml', source: '연합뉴스 증권', scope: 'home' },
  { url: 'https://www.hani.co.kr/rss/economy/', source: '한겨레 경제', scope: 'home' },
  { url: 'https://www.yna.co.kr/rss/international.xml', source: '연합뉴스 국제', scope: 'world' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC Business', scope: 'world' },
]

// ───────── 걸러낼 것 ─────────
// 코인·단타·추천성 기사는 청소년용 신문에 올리지 않는다
const BLOCK = [
  '코인', '비트코인', '이더리움', '알트코인', '가상자산', '암호화폐', '김치프리미엄',
  '단타', '급등주', '급등', '상한가', '하한가', '테마주', '작전주', '잡주',
  '레버리지', '인버스', '선물옵션', '공매도 전략', '파생상품 투자',
  '추천주', '유망주', '필수 매수', '지금 사야', '지금 팔아야', '매수 추천', '매도 추천',
  '수익률 보장', '원금 보장', '대박', '떡상', '폭등', '베팅',
  '도박', '카지노', '복권', '로또', '토토',
]

// ───────── 섹션 나누기 ─────────
const MARKET = ['코스피', '코스닥', '증시', '주가', '지수', '환율', '금리', '채권', '기준금리', '한국은행', '외국인', '기관', '상장', '배당', 'etf']
const LIFE = ['물가', '소비자물가', '생활', '장바구니', '교통비', '전기요금', '월세', '전세', '용돈', '알바', '최저임금', '학자금', '통신비', '보험', '저축', '적금', '예금']
const WORLD = ['미국', '연준', 'fed', '뉴욕증시', '나스닥', '다우', '유럽', '중국', '일본', '엔화', '달러', '국제', '수출', '관세', '글로벌', 'market', 'economy', 'stocks', 'inflation', 'rates']

// 종목별 소식: 우리 앱에 있는 ETF와 이어지는 말들
// 제목에서만 찾는다 — 본문까지 보면 '금리' 한 단어에 예금 특판 기사까지 딸려온다
const TICKER_KEYS = {
  K200: ['코스피200', '코스피', 'kospi', '국내 증시', '한국 증시'],
  SP500: ['s&p', 'sp500', '에스앤피', '뉴욕증시', '미국 증시', '미 증시'],
  NDQ: ['나스닥', 'nasdaq'],
  BATT: ['2차전지', '이차전지', '배터리', '양극재', '음극재'],
  BOND: ['국고채', '국채', '기준금리', '채권시장', '채권 금리'],
}

// 뉴스가 아니라 알림·목록인 것들 (게시판·인사·부고·표) 과 단타성 꼭지는 통째로 뺀다
const SKIP_TITLE = ['[게시판]', '[부고]', '[인사]', '[동정]', '[표]', '[특징주]', '[주요 공시]', '[증시 풍향계]', '[fn마켓워치]']

const has = (text, words) => words.some((w) => text.includes(w))

// ───────── RSS 읽기 (의존성 없이 최소한만) ─────────
const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')

const strip = (s = '') => {
  let out = s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, ' ')
  out = decode(decode(out)) // &amp;amp; 처럼 두 번 감싼 것도 풀어준다
  return out.replace(/\s+/g, ' ').trim()
}

// 기사 첫머리의 발신지·기자 이름을 떼어낸다: "(서울=연합뉴스) 홍길동 기자 = 본문"
const unbyline = (s = '') =>
  s
    .replace(/^\s*▲\s*/, '')
    .replace(/^\([^)]*=[^)]*\)\s*/, '')
    .replace(/^(?:[가-힣]{2,4}\s+){0,2}[가-힣]{2,4}\s*(?:특파원|기자|논설위원)\s*=\s*/, '')
    .replace(/^\s*=\s*/, '')
    .trim()

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? strip(m[1]) : ''
}

function parseRss(xml, source) {
  const blocks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) ?? []
  return blocks
    .map((b) => {
      let url = tag(b, 'link')
      if (!url) {
        const m = b.match(/<link[^>]*href="([^"]+)"/i)
        url = m ? m[1] : ''
      }
      return {
        title: tag(b, 'title'),
        url,
        desc: tag(b, 'description') || tag(b, 'summary'),
        at: Date.parse(tag(b, 'pubDate') || tag(b, 'updated') || '') || 0,
        source,
      }
    })
    .filter((a) => a.title && a.url)
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`${res.status}`)
    const items = parseRss(await res.text(), feed.source)
    return items.map((a) => ({ ...a, scope: feed.scope }))
  } catch (e) {
    console.warn(`· ${feed.source} 건너뜀 (${e.message})`)
    return []
  }
}

// ───────── 고르기 ─────────
const firstSentence = (text, max = 95) => {
  const body = unbyline(text || '')
  const s = body.split(/(?<=[.?!。]|다\.|요\.)\s/)[0] || body
  return s.length > max ? `${s.slice(0, max).trim()}…` : s.trim()
}

function pickArticles(all) {
  const seen = new Set()
  const clean = []
  for (const a of all) {
    if (SKIP_TITLE.some((p) => a.title.startsWith(p))) continue
    const low = `${a.title} ${a.desc}`.toLowerCase()
    if (has(low, BLOCK.map((w) => w.toLowerCase()))) continue
    const key = a.title.replace(/\s/g, '').slice(0, 24)
    if (seen.has(key)) continue
    seen.add(key)
    clean.push(a)
  }
  clean.sort((a, b) => b.at - a.at)

  const take = (test, n = PER_SECTION) => clean.filter(test).slice(0, n)
  const title = (a) => a.title.toLowerCase()
  const both = (a) => `${a.title} ${a.desc}`.toLowerCase()
  // 제목에 걸리면 확실한 기사, 본문에만 걸리면 곁다리 — 제목을 먼저 본다
  const about = (a, words) => has(title(a), words) || (has(both(a), words) && has(title(a), words.slice(0, 3)))

  const world = take((a) => a.scope === 'world' || about(a, WORLD))
  const usedWorld = new Set(world.map((a) => a.url))
  const market = take((a) => a.scope === 'home' && !usedWorld.has(a.url) && has(title(a), MARKET))
  const usedMarket = new Set(market.map((a) => a.url))
  const life = take((a) => a.scope === 'home' && !usedWorld.has(a.url) && !usedMarket.has(a.url) && has(title(a), LIFE))

  const tickers = {}
  for (const [code, keys] of Object.entries(TICKER_KEYS)) {
    const hit = take((a) => has(title(a), keys), 2)
    if (hit.length) tickers[code] = hit
  }
  return { market, life, world, tickers, pool: clean }
}

// 오르내림을 세어 시장 날씨를 고른다 (지수 자체가 아니라 기사 분위기)
function weatherOf(articles) {
  const text = articles.map((a) => `${a.title} ${a.desc}`).join(' ').toLowerCase()
  const up = (text.match(/상승|올라|오름|강세|회복|호조|rise|gain|higher/g) ?? []).length
  const down = (text.match(/하락|내려|내림|약세|부진|우려|fall|drop|lower|slump/g) ?? []).length
  if (up >= down * 1.6) return 'sunny'
  if (down >= up * 1.6) return 'rain'
  return 'cloudy'
}

const tagsOf = (articles, pool) => {
  const text = articles.map((a) => `${a.title} ${a.desc}`).join(' ').toLowerCase()
  return pool.filter((w) => text.includes(w.toLowerCase())).slice(0, 3)
}

// 링크만 남긴다 (제목·주소·언론사). 본문은 저장하지 않는다.
const toArticles = (list) => list.map((a) => ({ title: a.title, url: a.url, source: a.source }))

// 요약이 없을 때(= Gemini 미사용/실패): 첫 기사의 제목 + 첫 문장, 그리고 둘째 기사 제목
const plainLines = (list) => {
  if (!list.length) return []
  const [a, b] = list
  const lines = [a.title]
  const s = firstSentence(a.desc)
  if (s && s.length > 12 && !a.title.startsWith(s.slice(0, 12))) lines.push(s)
  if (b) lines.push(b.title)
  return lines.slice(0, 3)
}

// ───────── Gemini (있으면 쓰고, 없으면 그냥 넘어간다) ─────────
const GEMINI_MODEL = 'gemini-2.5-flash'

async function askGemini(picked) {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.log('· GEMINI_API_KEY 없음 → 제목+첫 문장으로 요약')
    return null
  }
  const brief = (list) => list.map((a) => `- ${a.title} :: ${firstSentence(a.desc, 120)}`).join('\n') || '- (기사 없음)'
  const prompt = `너는 청소년 금융 앱 FLOCO의 고양이 기자야. 아래 오늘 기사 제목들을 보고 중학생이 이해할 수 있는 쉬운 한국어로 정리해줘.

규칙:
- 각 섹션마다 2~3줄, 한 줄은 45자 이내. 문장은 "~예요", "~해요" 말투.
- 어떤 종목을 사라/팔라는 말은 절대 쓰지 마. 전망을 단정하지도 마.
- 코인, 단타, 급등 같은 이야기는 빼.
- 어려운 말이 나오면 괄호 없이 풀어서 설명해.
- 기사 본문을 그대로 옮기지 말고 네 말로 짧게 줄여.

[시장]
${brief(picked.market)}

[생활]
${brief(picked.life)}

[해외]
${brief(picked.world)}

JSON만 출력해. 형식:
{"marketSummary":"오늘 시장 분위기 한 줄(35자 이내)","market":["..."],"life":["..."],"world":["..."],"word":{"term":"오늘의 경제 단어 하나","lines":["단어 뜻 쉽게 2~3줄"]}}`

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(45000),
    })
    if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`.slice(0, 160))
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
    const parsed = JSON.parse(text.replace(/^```json\s*|```$/g, '').trim())
    const ok = (v) => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string')
    if (!ok(parsed.market) || !parsed.word || !ok(parsed.word.lines)) throw new Error('형식이 안 맞음')
    console.log('· Gemini 요약 완료')
    return parsed
  } catch (e) {
    console.warn(`· Gemini 건너뜀 (${e.message}) → 제목+첫 문장으로 요약`)
    return null
  }
}

// 혹시라도 추천처럼 읽히는 문장은 버린다
const SAFE_OUT = ['사라', '팔아라', '매수하', '매도하', '추천합니다', '추천해', '오를 것입니다', '확실']
const safeLines = (lines, fallback) => {
  const kept = (lines ?? []).map((l) => String(l).trim()).filter((l) => l && !SAFE_OUT.some((w) => l.includes(w)))
  return kept.length ? kept.slice(0, 3) : fallback
}

// ───────── 만들기 ─────────
async function main() {
  const lists = await Promise.all(FEEDS.map(fetchFeed))
  const all = lists.flat()
  console.log(`· 기사 ${all.length}개 받음`)
  if (!all.length) {
    console.log('· 받은 기사가 없어 news.json을 그대로 둡니다')
    return
  }

  const picked = pickArticles(all)
  const ai = await askGemini(picked)

  const today = new Date()
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(today) // YYYY-MM-DD

  const fallbackWord = {
    term: '분산투자',
    lines: ['달걀을 한 바구니에 담지 않는 것을 분산투자라고 해요.', '서로 다르게 움직이는 것에 나눠 담으면 흔들림이 줄어요.'],
  }

  const news = {
    date,
    updatedAt: today.toISOString(),
    market: {
      weather: weatherOf([...picked.market, ...picked.world]),
      summary: (ai?.marketSummary ?? '오늘은 오르는 곳과 내리는 곳이 섞여 있어요.').slice(0, 60),
    },
    sections: {
      market: {
        lines: safeLines(ai?.market, plainLines(picked.market)),
        tags: tagsOf(picked.market, ['코스피', '코스닥', '금리', '환율', '채권', '실적']),
        articles: toArticles(picked.market),
      },
      life: {
        lines: safeLines(ai?.life, plainLines(picked.life)),
        tags: tagsOf(picked.life, ['물가', '용돈', '교통비', '전기요금', '최저임금', '저축']),
        articles: toArticles(picked.life),
      },
      world: {
        lines: safeLines(ai?.world, plainLines(picked.world)),
        tags: tagsOf(picked.world, ['미국', '중국', '일본', '유럽', '환율', '관세']),
        articles: toArticles(picked.world),
      },
      word: {
        term: String(ai?.word?.term ?? fallbackWord.term).slice(0, 14),
        lines: safeLines(ai?.word?.lines, fallbackWord.lines),
        tags: ['기초용어'],
        articles: [],
      },
    },
    tickers: Object.fromEntries(
      Object.entries(picked.tickers).map(([code, list]) => [
        code,
        { lines: plainLines(list), tags: tagsOf(list, ['실적', '금리', '환율', '배터리', '반도체', '채권']), articles: toArticles(list) },
      ]),
    ),
  }

  // 섹션이 통째로 비면 예전 내용을 남겨둔다 (빈 신문을 내보내지 않도록)
  const before = await readFile(OUT, 'utf8').catch(() => null)
  if (before) {
    const old = JSON.parse(before)
    for (const k of ['market', 'life', 'world']) {
      if (!news.sections[k].lines.length) news.sections[k] = old.sections?.[k] ?? news.sections[k]
    }
    if (!Object.keys(news.tickers).length && old.tickers && !old.sample) news.tickers = old.tickers
  }

  // 시각만 다르고 내용이 같으면 쓰지 않는다 (= 빈 커밋이 3시간마다 쌓이지 않게)
  const body = (o) => JSON.stringify({ ...o, updatedAt: undefined, sample: undefined })
  if (before && body(JSON.parse(before)) === body(news)) {
    console.log('· 바뀐 내용이 없어 그대로 둡니다')
    return
  }
  const next = `${JSON.stringify(news, null, 2)}\n`
  await writeFile(OUT, next, 'utf8')
  console.log(`· public/news.json 저장 (${date}, 날씨 ${news.market.weather})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
