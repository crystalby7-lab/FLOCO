// 오늘의 플로코 신문 (원페이퍼 뉴스)
// scripts/fetch-news.mjs가 3시간마다 RSS를 모아 public/news.json을 만든다.
// 기사 전문은 저장하지 않는다 — 요약 2~3줄과 원문 링크만 둔다.

export type Weather = 'sunny' | 'cloudy' | 'rain'

export type Article = { title: string; url: string; source: string }

export type NewsSection = {
  lines: string[] // 고양이 기자의 말풍선 (2~3줄)
  tags: string[] // 주제 태그
  articles: Article[] // 원문 링크
}

export type WordSection = NewsSection & { term: string }

export type News = {
  date: string // 2026-11-05
  updatedAt: string
  sample?: boolean // 아직 진짜 기사를 받기 전의 예시 데이터
  market: { weather: Weather; summary: string }
  sections: {
    market: NewsSection
    life: NewsSection
    world: NewsSection
    word: WordSection
  }
  tickers: Record<string, NewsSection> // 종목 코드별 소식 (K200, SP500 …)
}

// 섹션마다 담당 고양이 (보영 캐릭터 시트 그림)
export const DESK: Record<'market' | 'ours' | 'life' | 'world' | 'word', { title: string; cat: string; by: string }> = {
  market: { title: '오늘의 시장', cat: 'b_tuxedo', by: '턱시도 기자' },
  ours: { title: '우리 길드 종목', cat: 'sit', by: '주니' },
  life: { title: '생활 속 경제', cat: 'b_orange', by: '치즈 기자' },
  world: { title: '해외 소식', cat: 'b_black', by: '검은 고양이 기자' },
  word: { title: '오늘의 단어', cat: 'b_grey', by: '회색 고양이' },
}

export const WEATHER_LABEL: Record<Weather, string> = { sunny: '맑음', cloudy: '흐림', rain: '비' }

// 배포 전에는 저장소의 news.json을 먼저 본다 (GitHub Actions가 3시간마다 갱신)
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
        if (data?.sections?.market) {
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

export const dateLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`
}
