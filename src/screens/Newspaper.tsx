// 오늘의 플로코 신문
// 고양이 기자가 기사를 읽고 새로 써준 신문. 홈에는 1면과 섹션 둘만, 펼치면 전체 화면.
import { useEffect, useState } from 'react'
import { actions } from '../store'
import { DESK, dateLabel, isStale, loadNews, STORY_DESKS, WEATHER_LABEL, type DeskId, type News, type Story, type Weather } from '../data/news'
import { ART } from '../components/CatView'
import { Page } from '../components/Page'

function useNews() {
  const [news, setNews] = useState<News | null>(null)
  const [done, setDone] = useState(false)
  useEffect(() => {
    let alive = true
    loadNews().then((n) => {
      if (!alive) return
      setNews(n)
      setDone(true)
    })
    return () => {
      alive = false
    }
  }, [])
  return { news, done }
}

export function NewsCard({ onOpen }: { onOpen: () => void }) {
  const { news, done } = useNews()
  const [toast, setToast] = useState('')

  if (!news)
    return (
      <section className="card np-card">
        <h3 className="np-title">오늘의 플로코 신문</h3>
        <p className="np-empty">{done ? '신문을 아직 못 받았어요. 잠시 뒤에 다시 와주세요.' : '신문을 가져오는 중…'}</p>
      </section>
    )

  return (
    <section className="card np-card">
      <Masthead news={news} />
      <Front story={news.front} onToast={setToast} />
      <Desk id="market" stories={news.sections.market.slice(0, 1)} onToast={setToast} />
      <Desk id="life" stories={news.sections.life.slice(0, 1)} onToast={setToast} />
      <button className="btn btn-primary btn-block" onClick={onOpen}>
        신문 펼치기
      </button>
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </section>
  )
}

export function Newspaper({ onClose }: { onClose: () => void }) {
  const { news, done } = useNews()
  const [toast, setToast] = useState('')

  if (!news)
    return (
      <Page title="오늘의 플로코 신문" sub="고양이 기자들이 읽고 다시 썼어요" onExit={onClose}>
        <p className="np-empty">{done ? '신문을 아직 못 받았어요. 잠시 뒤에 다시 와주세요.' : '신문을 가져오는 중…'}</p>
      </Page>
    )

  return (
    <Page title="오늘의 플로코 신문" sub={dateLabel(news.date)} onExit={onClose}>
      <div className="np-full">
        <Weatherline news={news} big />
        <Front story={news.front} onToast={setToast} />
        {STORY_DESKS.map((id) => (
          <Desk key={id} id={id} stories={news.sections[id] ?? []} onToast={setToast} />
        ))}
        <Desk id="word" stories={[news.word]} onToast={setToast} />
        <p className="fineprint np-foot">
          고양이 기자가 기사를 읽고 우리 말로 새로 쓴 신문이에요. 원문은 링크로 달아뒀어요. 어떤 종목을 사라거나 팔라는 뜻은 아니에요.
        </p>
      </div>
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </Page>
  )
}

// ───────── 머리글 ─────────

function Masthead({ news }: { news: News }) {
  return (
    <header className="np-head">
      <div className="np-head-text">
        <span className="np-date">{dateLabel(news.date)}</span>
        <h3 className="np-title">오늘의 플로코 신문</h3>
        {(news.sample || isStale(news)) && (
          <div className="np-chips">
            {news.sample && <span className="np-chip">예시 신문</span>}
            {isStale(news) && <span className="np-chip wait">새 신문 준비 중</span>}
          </div>
        )}
      </div>
      <img className="np-head-cat" src={ART.b_tuxedo} alt="" aria-hidden />
    </header>
  )
}

function Weatherline({ news, big }: { news: News; big?: boolean }) {
  return (
    <div className={`np-weather ${big ? 'big' : ''}`}>
      <WeatherIcon w={news.market.weather} size={big ? 42 : 32} />
      <div className="np-weather-text">
        <b>
          시장 날씨 · {WEATHER_LABEL[news.market.weather]}
          {big && isStale(news) && <span className="np-chip wait">새 신문 준비 중</span>}
        </b>
        <p>{news.market.note}</p>
      </div>
    </div>
  )
}

// ───────── 1면 ─────────

function Front({ story, onToast }: { story: News['front']; onToast: (m: string) => void }) {
  const desk = DESK[story.desk] ?? DESK.market
  return (
    <section className="np-front">
      <div className="np-front-top">
        <span className="np-front-label">1면</span>
        <small>{desk.by}가 골랐어요</small>
      </div>
      <StoryBody story={story} cat={desk.cat} front onToast={onToast} />
    </section>
  )
}

// ───────── 섹션 ─────────

function Desk({ id, stories, onToast }: { id: DeskId; stories: Story[]; onToast: (m: string) => void }) {
  const d = DESK[id]
  if (!stories.length) return null
  return (
    <section className="np-desk">
      <h4 className="np-desk-title">{d.title}</h4>
      {stories.slice(0, 2).map((s, i) => (
        <StoryBody key={s.headline + i} story={s} cat={d.cat} by={d.by} onToast={onToast} />
      ))}
    </section>
  )
}

// ───────── 기사 한 꼭지 ─────────

function StoryBody({ story, cat, by, front, onToast }: { story: Story; cat: string; by?: string; front?: boolean; onToast: (m: string) => void }) {
  const toGuild = () => {
    actions.postBoard(`[신문] ${story.headline}`)
    onToast('길드 한마디에 올렸어요')
    setTimeout(() => onToast(''), 1700)
  }
  return (
    <article className={`np-story ${front ? 'front' : ''}`}>
      <div className="np-by">
        <img src={ART[cat]} alt="" />
        {by && <small>{by}</small>}
      </div>
      <div className="np-bubble">
        {story.term && <span className="np-term">{story.term}</span>}
        <h5 className="np-headline">{story.headline}</h5>
        <dl className="np-qa">
          <div>
            <dt>무슨 일?</dt>
            <dd>{story.what}</dd>
          </div>
          <div>
            <dt>왜 중요해?</dt>
            <dd>{story.why}</dd>
          </div>
          <div>
            <dt>나랑 무슨 상관?</dt>
            <dd>{story.me}</dd>
          </div>
        </dl>
        <p className="np-say">{story.cat}</p>
        {story.tags && story.tags.length > 0 && (
          <div className="np-tags">
            {story.tags.map((t) => (
              <span key={t} className="np-tag">
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="np-actions">
          <button className="np-share" onClick={toGuild}>
            이 얘기 길드에 꺼내기
          </button>
          {story.link && (
            <a className="np-link" href={story.link.url} target="_blank" rel="noreferrer">
              원문 · {story.link.source} ›
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

// 시장 날씨 (직접 그린 아이콘)
function WeatherIcon({ w, size = 34 }: { w: Weather; size?: number }) {
  if (w === 'sunny')
    return (
      <svg className="np-wx" viewBox="0 0 48 48" width={size} height={size} aria-hidden>
        <circle cx="24" cy="24" r="9" fill="#ffd978" stroke="#e0a93c" strokeWidth="2" />
        <g stroke="#e0a93c" strokeWidth="2.6" strokeLinecap="round">
          <path d="M24 6v4M24 38v4M6 24h4M38 24h4M11 11l3 3M34 34l3 3M37 11l-3 3M14 34l-3 3" />
        </g>
      </svg>
    )
  if (w === 'rain')
    return (
      <svg className="np-wx" viewBox="0 0 48 48" width={size} height={size} aria-hidden>
        <path d="M14 29h20a7 7 0 0 0 .6-13.9A10 10 0 0 0 15 13a7.2 7.2 0 0 0-1 16Z" fill="#dbe6f3" stroke="#8fa9c8" strokeWidth="2" />
        <g stroke="#6f9bd1" strokeWidth="2.8" strokeLinecap="round">
          <path d="M17 34l-2 6M25 34l-2 6M33 34l-2 6" />
        </g>
      </svg>
    )
  return (
    <svg className="np-wx" viewBox="0 0 48 48" width={size} height={size} aria-hidden>
      <circle cx="31" cy="17" r="7" fill="#ffd978" stroke="#e0a93c" strokeWidth="2" />
      <path d="M13 36h20a7.5 7.5 0 0 0 .6-15A10.5 10.5 0 0 0 14 19a8.5 8.5 0 0 0-1 17Z" fill="#eef3f9" stroke="#8fa9c8" strokeWidth="2" />
    </svg>
  )
}
