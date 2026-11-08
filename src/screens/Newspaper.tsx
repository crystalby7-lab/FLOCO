// 오늘의 플로코 신문
// 고양이 기자가 기사를 읽고 새로 써준 신문. 홈에는 1면과 섹션 둘만, 펼치면 전체 화면.
import { useEffect, useState } from 'react'
import { actions } from '../store'
import { DESK, dateLabel, isStale, loadNews, STORY_DESKS, WEATHER_LABEL, type News, type Story, type Weather } from '../data/news'
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
  if (!news)
    return (
      <section className="card paper-card">
        <h3 className="pp-title">오늘의 플로코 신문</h3>
        <p className="pp-empty">{done ? '신문을 아직 못 받았어요. 잠시 뒤에 다시 와주세요.' : '신문을 가져오는 중…'}</p>
      </section>
    )
  const f = news.front
  const fd = DESK[f.desk] ?? DESK.market
  // 섹션마다 첫 기사 하나씩 '오늘의 다른 소식'으로
  const more = STORY_DESKS.map((id) => ({ id, s: news.sections[id]?.[0] })).filter((x) => x.s && x.s.headline !== f.headline)
  return (
    <section className="card paper-card" onClick={onOpen} role="button">
      <Masthead news={news} />
      <div className="pp-front">
        <span className="pp-kicker">1면 · {fd.title}</span>
        <h3 className="pp-front-head">
          {f.link ? (
            <a href={f.link.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              {f.headline}
            </a>
          ) : (
            f.headline
          )}
        </h3>
        <p className="pp-front-lead">{f.what}</p>
        <Quote cat={fd.cat} by={fd.by} text={f.cat} />
      </div>
      <ul className="pp-more">
        {more.slice(0, 3).map(({ id, s }) => (
          <li key={id}>
            <a href={s!.link?.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              <img src={ART[DESK[id].cat]} alt="" />
              <div>
                <small>
                  {DESK[id].title}
                  {s!.link ? ` · ${s!.link.source}` : ''}
                </small>
                <b>{s!.headline}</b>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <span className="pp-open">신문 펼치기 ›</span>
    </section>
  )
}

export function Newspaper({ onClose }: { onClose: () => void }) {
  const { news, done } = useNews()
  const [toast, setToast] = useState('')
  if (!news)
    return (
      <Page title="오늘의 플로코 신문" sub="고양이 기자들이 읽고 다시 썼어요" onExit={onClose}>
        <p className="pp-empty">{done ? '신문을 아직 못 받았어요. 잠시 뒤에 다시 와주세요.' : '신문을 가져오는 중…'}</p>
      </Page>
    )
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 1700)
  }
  const fd = DESK[news.front.desk] ?? DESK.market
  return (
    <Page title="오늘의 플로코 신문" sub={dateLabel(news.date)} onExit={onClose}>
      <div className="pp-full">
        <Weatherline news={news} />
        <article className="pp-lead-story">
          <span className="pp-kicker">1면 · {fd.by}가 골랐어요</span>
          <h2 className="pp-lead-head">
            {news.front.link ? (
              <a href={news.front.link.url} target="_blank" rel="noreferrer">
                {news.front.headline}
              </a>
            ) : (
              news.front.headline
            )}
          </h2>
          <Explain story={news.front} />
          <Quote cat={fd.cat} by={fd.by} text={news.front.cat} />
          <Actions story={news.front} onToast={flash} />
        </article>

        {STORY_DESKS.map((id) => {
          const list = (news.sections[id] ?? []).slice(0, 2)
          if (!list.length) return null
          return (
            <section key={id} className="pp-desk">
              <header className="pp-desk-head">
                <img src={ART[DESK[id].cat]} alt="" />
                <div>
                  <h4>{DESK[id].title}</h4>
                  <small>{DESK[id].by}</small>
                </div>
              </header>
              {list.map((s, i) => (
                <Fold key={s.headline + i} story={s} cat={DESK[id].cat} by={DESK[id].by} onToast={flash} />
              ))}
            </section>
          )
        })}

        <section className="pp-word">
          <span className="pp-kicker">오늘의 단어</span>
          <h3>{news.word.term ?? news.word.headline}</h3>
          <p>{news.word.what}</p>
          <p className="pp-sub">{news.word.me}</p>
          <Quote cat={DESK.word.cat} by={DESK.word.by} text={news.word.cat} />
        </section>

        <p className="pp-foot">고양이 기자가 기사를 읽고 우리 말로 새로 쓴 신문이에요. 어떤 종목을 사라거나 팔라는 뜻은 아니에요.</p>
      </div>
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </Page>
  )
}

// ───────── 조각들 ─────────

function Masthead({ news }: { news: News }) {
  return (
    <header className="pp-head">
      <div className="pp-head-top">
        <span>{dateLabel(news.date)}</span>
        <span className="pp-wx-mini">
          <WeatherIcon w={news.market.weather} size={18} />
          시장 {WEATHER_LABEL[news.market.weather]}
        </span>
      </div>
      <h3 className="pp-title">오늘의 플로코 신문</h3>
      {(news.sample || isStale(news)) && <span className="pp-badge">{news.sample ? '예시 신문' : '새 신문 준비 중'}</span>}
    </header>
  )
}

function Weatherline({ news }: { news: News }) {
  return (
    <div className="pp-weather">
      <WeatherIcon w={news.market.weather} size={40} />
      <div>
        <b>오늘 시장 날씨는 {WEATHER_LABEL[news.market.weather]}</b>
        <p>{news.market.note}</p>
      </div>
      {isStale(news) && <span className="pp-badge">새 신문 준비 중</span>}
    </div>
  )
}

function Explain({ story, skipWhat }: { story: Story; skipWhat?: boolean }) {
  return (
    <div className="pp-explain">
      {!skipWhat && (
        <p>
          <b>무슨 일?</b>
          {story.what}
        </p>
      )}
      <p>
        <b>왜 중요해?</b>
        {story.why}
      </p>
      <p>
        <b>나랑 무슨 상관?</b>
        {story.me}
      </p>
    </div>
  )
}

function Quote({ cat, by, text }: { cat: string; by: string; text: string }) {
  return (
    <div className="pp-quote">
      <img src={ART[cat]} alt="" />
      <p>
        {text}
        <small>{by}</small>
      </p>
    </div>
  )
}

function Actions({ story, onToast }: { story: Story; onToast: (m: string) => void }) {
  return (
    <div className="pp-actions">
      <button
        className="pp-share"
        onClick={(e) => {
          e.stopPropagation()
          actions.postBoard(`[신문] ${story.headline}`)
          onToast('길드 한마디에 올렸어요')
        }}
      >
        이 얘기 길드에 꺼내기
      </button>
      {story.link && (
        <a className="pp-link" href={story.link.url} target="_blank" rel="noreferrer">
          원문 보기 · {story.link.source} ›
        </a>
      )}
    </div>
  )
}

// 섹션 기사: 우리가 쓴 제목 + 한 줄 요약. 누르면 원문 기사로 바로 간다.
function Fold({ story, cat, by, onToast }: { story: Story; cat: string; by: string; onToast: (m: string) => void }) {
  void cat
  void by
  const body = (
    <>
      <span className="pp-fold-text">
        <b>{story.headline}</b>
        <small>{story.what}</small>
        {story.link && <em>{story.link.source} · 원문 보기 ›</em>}
      </span>
    </>
  )
  return (
    <article className="pp-fold">
      {story.link ? (
        <a className="pp-fold-head" href={story.link.url} target="_blank" rel="noreferrer">
          {body}
        </a>
      ) : (
        <div className="pp-fold-head">{body}</div>
      )}
      <button
        className="pp-mini-share"
        onClick={() => {
          actions.postBoard(`[신문] ${story.headline}`)
          onToast('길드 한마디에 올렸어요')
        }}
      >
        길드에 꺼내기
      </button>
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
