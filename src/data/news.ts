// 오늘의 플로코 신문
// 기사 제목을 옮겨 적는 게 아니라, 고양이 기자가 읽고 우리 말로 새로 써준 신문이다.
// scripts/fetch-news.mjs(GitHub Actions, 3시간마다)가 public/news.json을 만든다.
// 원문은 링크로만 두고, 본문은 저장하지 않는다.

export type Weather = 'sunny' | 'cloudy' | 'rain'

export type Link = { title: string; url: string; source: string }

// 기사 하나 = 고양이가 새로 지은 제목 + 3단 요약 + 한마디
export type Story = {
  headline: string // 새로 지은, 궁금해지는 제목
  what: string // 무슨 일?
  why: string // 왜 중요해?
  me: string // 나랑 무슨 상관? (용돈·물가·투자 연습과 잇기)
  cat: string // 고양이 한마디 (감상이나 생각해볼 질문)
  tags?: string[]
  link?: Link // 원문 (작게)
  term?: string // '오늘의 단어'일 때 용어
}

export type DeskId = 'market' | 'life' | 'biz' | 'world' | 'word'
export type StoryDesk = Exclude<DeskId, 'word'>

export type News = {
  date: string // 2026-11-05 (한국 날짜)
  updatedAt: string
  sample?: boolean // 아직 진짜 기사를 받기 전의 예시
  market: { weather: Weather; note: string } // 날씨 + 고양이 한 줄 총평
  front: Story & { desk: StoryDesk } // 1면
  sections: Record<StoryDesk, Story[]>
  word: Story & { term: string }
}

// 섹션마다 담당 고양이 (보영 캐릭터 시트 그림)
export const DESK: Record<DeskId, { title: string; cat: string; by: string }> = {
  market: { title: '오늘의 시장', cat: 'b_tuxedo', by: '턱시도 기자' },
  life: { title: '생활 속 경제', cat: 'b_orange', by: '치즈 기자' },
  biz: { title: '기업·산업', cat: 'b_grey', by: '회색 고양이 기자' },
  world: { title: '해외 소식', cat: 'b_black', by: '검은 고양이 기자' },
  word: { title: '오늘의 단어', cat: 'sit', by: '주니' },
}

export const STORY_DESKS: StoryDesk[] = ['market', 'life', 'biz', 'world']

export const WEATHER_LABEL: Record<Weather, string> = { sunny: '맑음', cloudy: '흐림', rain: '비' }

// 배포 전에는 저장소의 news.json을 먼저 본다 (Actions가 3시간마다 갱신)
const REMOTE = 'https://raw.githubusercontent.com/crystalby7-lab/FLOCO/main/public/news.json'
const LOCAL = `${import.meta.env.BASE_URL}news.json`

const withTimeout = (url: string, ms = 5000) => {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  return fetch(url, { signal: ctl.signal, cache: 'no-cache' }).finally(() => clearTimeout(t))
}

let cache: News | null = null
let pending: Promise<News | null> | null = null

export function loadNews(): Promise<News | null> {
  if (cache) return Promise.resolve(cache)
  if (pending) return pending
  pending = (async () => {
    for (const url of [REMOTE, LOCAL]) {
      try {
        const res = await withTimeout(url)
        if (!res.ok) continue
        const data = (await res.json()) as News
        if (data?.front?.headline) {
          cache = data
          return data
        }
      } catch {
        /* 다음 주소로 */
      }
    }
    return null
  })()
  return pending
}

// 12시간 넘게 새 신문이 안 왔으면(= 요약이 실패해 지난 신문이 남아 있으면) 작게 알린다
const HALF_DAY = 12 * 60 * 60 * 1000
export function isStale(news: News) {
  const at = Date.parse(news.updatedAt)
  return Number.isFinite(at) ? Date.now() - at > HALF_DAY : false
}

export const dateLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`
}
