// 오늘의 플로코 신문 만들기 (GitHub Actions가 3시간마다 실행)
//
//   GEMINI_API_KEY=... node scripts/fetch-news.mjs
//
// 1) 경제 뉴스 RSS 몇 곳에서 최신 기사 제목을 모은다 (본문은 가져오지도, 저장하지도 않는다)
// 2) 코인·단타·추천성 기사와 게시판·부고 같은 알림성 글을 먼저 걸러낸다
// 3) Gemini(무료 API)에게 넘겨서 — 청소년에게 의미 있는 것 고르기, 섹션 나누기, 1면 뽑기,
//    고양이 말투로 새로 쓰기, 오늘의 단어 고르기, 시장 날씨 판단까지 맡긴다
// 4) 성공하면 public/news.json을 새로 쓴다
//
// 실패하면(키 없음·응답 이상·형식 안 맞음) news.json을 건드리지 않는다.
// 지난 신문이 그대로 남고, 앱이 '새 신문 준비 중'을 작게 보여준다.
//
// 원칙: 원문 문장을 그대로 옮기지 않는다. 우리 말로 새로 쓴 요약과 원문 링크만 남긴다.

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const OUT = resolve('public/news.json')
const CANDIDATES = 45 // Gemini에게 보여줄 기사 후보 수
const UA = 'floco-news-bot (+https://github.com/crystalby7-lab/FLOCO)'
const MODEL = 'gemini-2.5-flash'

const FEEDS = [
  { url: 'https://www.yna.co.kr/rss/economy.xml', source: '연합뉴스 경제', scope: 'home' },
  { url: 'https://www.yna.co.kr/rss/market.xml', source: '연합뉴스 증권', scope: 'home' },
  { url: 'https://www.hani.co.kr/rss/economy/', source: '한겨레 경제', scope: 'home' },
  { url: 'https://www.yna.co.kr/rss/international.xml', source: '연합뉴스 국제', scope: 'world' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC Business', scope: 'world' },
]

const DESKS = ['market', 'life', 'biz', 'world']

// 청소년용 신문에 올리지 않을 것
const BLOCK = [
  '코인', '비트코인', '이더리움', '알트코인', '가상자산', '암호화폐', '김치프리미엄',
  '단타', '급등주', '상한가', '하한가', '테마주', '작전주', '잡주',
  '레버리지', '인버스', '선물옵션', '추천주', '유망주', '지금 사야', '지금 팔아야',
  '매수 추천', '매도 추천', '수익률 보장', '원금 보장', '떡상', '대박',
  '도박', '카지노', '복권', '로또', '토토', '베팅',
]
const SKIP_TITLE = ['[게시판]', '[부고]', '[인사]', '[동정]', '[표]', '[특징주]', '[주요 공시]', '[증시 풍향계]', '[속보]']

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

// 기사 첫머리의 발신지·기자 이름 떼기: "(서울=연합뉴스) 홍길동 기자 = 본문"
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

function parseRss(xml, source, scope) {
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
        gist: unbyline(tag(b, 'description') || tag(b, 'summary')).slice(0, 180),
        at: Date.parse(tag(b, 'pubDate') || tag(b, 'updated') || '') || 0,
        source,
        scope,
      }
    })
    .filter((a) => a.title && a.url)
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`${res.status}`)
    return parseRss(await res.text(), feed.source, feed.scope)
  } catch (e) {
    console.warn(`· ${feed.source} 건너뜀 (${e.message})`)
    return []
  }
}

function shortlist(all) {
  const seen = new Set()
  const out = []
  for (const a of all) {
    if (SKIP_TITLE.some((p) => a.title.startsWith(p))) continue
    const low = `${a.title} ${a.gist}`.toLowerCase()
    if (BLOCK.some((w) => low.includes(w.toLowerCase()))) continue
    const key = a.title.replace(/\s/g, '').slice(0, 24)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(a)
  }
  out.sort((a, b) => b.at - a.at)
  return out.slice(0, CANDIDATES)
}

// ───────── Gemini에게 신문 맡기기 ─────────

const PROMPT = (list) => `너는 청소년 금융 앱 FLOCO의 고양이 기자단 편집장이야.
아래는 오늘 들어온 경제 뉴스 후보야. 이걸 읽고 중학생이 읽고 싶어지는 '오늘의 플로코 신문'을 만들어줘.

후보 기사 (번호 :: 제목 :: 한 줄 설명 :: 출처):
${list.map((a, i) => `${i} :: ${a.title} :: ${a.gist} :: ${a.source}`).join('\n')}

할 일
1. 청소년에게 의미 있는 기사만 골라. 회사 홍보, 인사 소식, 지역 행사, 너무 전문적인 것은 버려.
2. 섹션마다 기사 1~2개만 골라:
   market(오늘의 시장: 주가·금리·환율) / life(생활 속 경제: 물가·용돈·일자리·저축)
   biz(기업·산업: 회사 실적, 산업 이야기) / world(해외 소식)
3. 그중 오늘 가장 중요한 기사 하나를 1면(front)으로 뽑아. 1면은 섹션에 또 넣지 마.
4. 오늘 기사에 실제로 나온 경제 용어 하나를 골라 '오늘의 단어'를 써.
5. 시장 날씨를 정해: sunny(대체로 오름) / cloudy(섞임) / rain(대체로 내림).

쓰는 방법 (제일 중요)
- 원문 제목이나 문장을 그대로 옮기지 마. 반드시 네 말로 새로 써.
- headline은 원문 제목과 다르게, 궁금해지는 말로 새로 지어. 낚시성 과장은 금지.
- what / why / me는 각각 한 문장, 45자 안팎. 중학생이 바로 이해하는 쉬운 말로.
- me(나랑 무슨 상관?)는 반드시 용돈·물가·저축·모의투자 연습 같은 '나의 일'과 이어줘.
- 어려운 말이 나오면 괄호로 풀어줘. 예: 기준금리(나라가 정하는 기본 이자율)
- cat은 고양이 기자의 한마디. 짧은 감상이나 "너는 어떻게 생각해?" 같은 질문.
- 말투는 "~예요", "~해요". 고양이답게 다정하게.
- 어떤 종목을 사라/팔라는 말은 절대 쓰지 마. 오를 거라고 단정하지도 마.
- 숫자를 지어내지 마. 후보에 없는 내용을 상상해서 쓰지 마.

JSON만 출력해. 다른 말은 붙이지 마.
{
  "weather": "sunny|cloudy|rain",
  "note": "오늘 시장 한 줄 총평 (35자 이내, 고양이 말투)",
  "front": { "ref": 후보번호, "desk": "market|life|biz|world", "headline": "...", "what": "...", "why": "...", "me": "...", "cat": "...", "tags": ["태그1","태그2"] },
  "stories": [
    { "ref": 후보번호, "desk": "market|life|biz|world", "headline": "...", "what": "...", "why": "...", "me": "...", "cat": "...", "tags": ["..."] }
  ],
  "word": { "term": "용어", "headline": "용어를 소개하는 제목", "what": "무슨 뜻인지", "why": "왜 알아두면 좋은지", "me": "우리 앱·생활과 어떻게 이어지는지", "cat": "고양이 한마디", "tags": ["기초용어"] }
}`

async function askGemini(list) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY가 없어요')
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT(list) }] }],
      generationConfig: { temperature: 0.8, responseMimeType: 'application/json', maxOutputTokens: 8192 },
    }),
    signal: AbortSignal.timeout(90000),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
  if (!text) throw new Error('Gemini 응답이 비어 있어요')
  return JSON.parse(text.replace(/^```json\s*|```$/g, '').trim())
}

// ───────── 검사 ─────────

const BAN = ['사라', '팔아라', '매수하', '매도하', '추천합니다', '추천해요', '확실히 오를', '무조건']
const text = (s) => String(s ?? '').trim()

// 원문 제목을 그대로 옮겼는지 확인 (앞 16자가 같으면 베낀 것으로 본다)
const copied = (written, src) => {
  const a = written.replace(/\s/g, '')
  const b = src.replace(/\s/g, '')
  return a.length > 10 && b.length > 10 && (a.slice(0, 16) === b.slice(0, 16) || a === b)
}

function toStory(raw, list) {
  const src = typeof raw.ref === 'number' ? list[raw.ref] : null
  const story = {
    headline: text(raw.headline),
    what: text(raw.what),
    why: text(raw.why),
    me: text(raw.me),
    cat: text(raw.cat),
    tags: Array.isArray(raw.tags) ? raw.tags.map(text).filter(Boolean).slice(0, 3) : [],
  }
  for (const k of ['headline', 'what', 'why', 'me', 'cat']) {
    if (!story[k]) throw new Error(`${k}가 비었어요`)
    if (BAN.some((w) => story[k].includes(w))) throw new Error(`추천처럼 읽히는 문장: ${story[k]}`)
  }
  if (src && copied(story.headline, src.title)) throw new Error(`원문 제목을 그대로 옮겼어요: ${story.headline}`)
  // 링크는 우리가 붙인다 (Gemini가 주소를 지어내지 못하게)
  if (src) story.link = { title: src.title, url: src.url, source: src.source }
  return story
}

// ───────── 만들기 ─────────

async function main() {
  const all = (await Promise.all(FEEDS.map(fetchFeed))).flat()
  console.log(`· 기사 ${all.length}개 받음`)
  const list = shortlist(all)
  console.log(`· 후보 ${list.length}개 추림`)
  if (list.length < 5) throw new Error('후보 기사가 너무 적어요')

  const out = await askGemini(list)
  console.log('· Gemini 응답 받음')

  const front = { ...toStory(out.front ?? {}, list), desk: DESKS.includes(out.front?.desk) ? out.front.desk : 'market' }
  const sections = { market: [], life: [], biz: [], world: [] }
  const frontRef = out.front?.ref

  for (const raw of Array.isArray(out.stories) ? out.stories : []) {
    if (raw.ref === frontRef) continue // 1면은 섹션에 또 넣지 않는다
    let story
    try {
      story = toStory(raw, list)
    } catch (e) {
      console.warn(`· 기사 하나 건너뜀 (${e.message})`)
      continue
    }
    const desk = DESKS.includes(raw.desk) ? raw.desk : 'market'
    if (sections[desk].length < 2) sections[desk].push(story) // 섹션당 최대 2개
  }
  if (!Object.values(sections).some((v) => v.length)) throw new Error('쓸 수 있는 기사가 없어요')

  const word = { ...toStory({ ...(out.word ?? {}), tags: out.word?.tags ?? ['기초용어'] }, list), term: text(out.word?.term).slice(0, 14) }
  if (!word.term) throw new Error('오늘의 단어가 없어요')

  const now = new Date()
  const news = {
    date: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now), // YYYY-MM-DD
    updatedAt: now.toISOString(),
    market: { weather: ['sunny', 'cloudy', 'rain'].includes(out.weather) ? out.weather : 'cloudy', note: text(out.note).slice(0, 60) || '오늘은 조용한 하루였어요.' },
    front,
    sections,
    word,
  }

  // 시각만 다르고 내용이 같으면 쓰지 않는다 (빈 커밋이 3시간마다 쌓이지 않게)
  const before = await readFile(OUT, 'utf8').catch(() => null)
  const body = (o) => JSON.stringify({ ...o, updatedAt: undefined, date: undefined, sample: undefined })
  if (before && body(JSON.parse(before)) === body(news)) {
    console.log('· 바뀐 내용이 없어 그대로 둡니다')
    return
  }
  await writeFile(OUT, `${JSON.stringify(news, null, 2)}\n`, 'utf8')
  console.log(`· public/news.json 저장 (${news.date}, 날씨 ${news.market.weather}, 1면 + 기사 ${Object.values(sections).flat().length}개)`)
}

main().catch((e) => {
  // 신문을 못 만들면 지난 신문을 그대로 둔다. 앱이 '새 신문 준비 중'을 보여준다.
  console.error(`· 신문을 만들지 못했어요: ${e.message}`)
  console.error('· public/news.json은 그대로 둡니다 (지난 신문 유지)')
  process.exit(0)
})
