// 오늘의 플로코 신문: 고양이 기자들이 섹션마다 2~3줄로 전해주는 원페이퍼 뉴스
// 홈에는 시장 요약과 섹션 둘만 접어서 보여주고, 펼치면 전체 화면으로 연다.
import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { tickerOf } from '../data/market'
import { DESK, dateLabel, loadNews, WEATHER_LABEL, type News, type NewsSection, type Weather } from '../data/news'
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

// 길드가 지금 들고 있거나 의견을 모으는 중인 종목의 소식만 고른다
function ourTickers(news: News, codes: string[]) {
  return codes.filter((c) => news.tickers?.[c]?.articles?.length).map((c) => ({ code: c, sec: news.tickers[c] }))
}

export function NewsCard({ onOpen }: { onOpen: () => void }) {
  const s = useGame()
  const g = s.guild!
  const { news, done } = useNews()

  if (!news)
    return (
      <section className="card np-card">
        <div className="np-head">
          <span className="np-date">오늘의 플로코 신문</span>
          <img className="np-head-cat" src={ART.b_tuxedo} alt="" aria-hidden />
        </div>
        <p className="np-empty">{done ? '신문을 아직 못 받았어요. 잠시 뒤에 다시 와주세요.' : '신문을 가져오는 중…'}</p>
      </section>
    )

  const codes = [...new Set(g.proposals.filter((p) => p.status === 'holding' || p.status === 'voting').map((p) => p.ticker))]
  const ours = ourTickers(news, codes)

  return (
    <section className="card np-card">
      <div className="np-head">
        <div className="grow">
          <span className="np-date">
            {dateLabel(news.date)}
            {news.sample && <i className="np-sample">예시</i>}
          </span>
          <h3 className="np-title">오늘의 플로코 신문</h3>
        </div>
        <img className="np-head-cat" src={ART.b_tuxedo} alt="" aria-hidden />
      </div>

      <div className="np-weather">
        <WeatherIcon w={news.market.weather} />
        <div>
          <b>시장 날씨 · {WEATHER_LABEL[news.market.weather]}</b>
          <p>{news.market.summary}</p>
        </div>
      </div>

      <Desk k="market" sec={news.sections.market} compact />
      <OursDesk ours={ours} compact />

      <button className="btn btn-primary btn-block" onClick={onOpen}>
        신문 펼치기
      </button>
    </section>
  )
}

export function Newspaper({ onClose }: { onClose: () => void }) {
  const s = useGame()
  const g = s.guild!
  const { news, done } = useNews()

  if (!news)
    return (
      <Page title="오늘의 플로코 신문" sub="고양이 기자들의 한 장 소식" onExit={onClose}>
        <p className="np-empty">{done ? '신문을 아직 못 받았어요. 잠시 뒤에 다시 와주세요.' : '신문을 가져오는 중…'}</p>
      </Page>
    )

  const codes = [...new Set(g.proposals.filter((p) => p.status === 'holding' || p.status === 'voting').map((p) => p.ticker))]
  const ours = ourTickers(news, codes)

  return (
    <Page title="오늘의 플로코 신문" sub={`${dateLabel(news.date)}${news.sample ? ' · 예시 기사' : ''}`} onExit={onClose}>
      <section className="np-banner">
        <WeatherIcon w={news.market.weather} size={44} />
        <div>
          <b>시장 날씨 · {WEATHER_LABEL[news.market.weather]}</b>
          <p>{news.market.summary}</p>
        </div>
      </section>

      <Desk k="market" sec={news.sections.market} />
      <OursDesk ours={ours} />
      <Desk k="life" sec={news.sections.life} />
      <Desk k="world" sec={news.sections.world} />
      <Desk k="word" sec={news.sections.word} term={news.sections.word.term} />

      <p className="fineprint np-foot">
        기사 요약과 링크만 가져와요. 어떤 종목을 사라거나 팔라는 뜻이 아니고, 무슨 일이 있었는지 같이 읽어보는 자리예요.
      </p>
    </Page>
  )
}

// ───────── 섹션 ─────────

function Desk({ k, sec, term, compact }: { k: keyof typeof DESK; sec: NewsSection; term?: string; compact?: boolean }) {
  const d = DESK[k]
  return (
    <article className={`np-sec ${compact ? 'compact' : ''}`}>
      <div className="np-by">
        <img src={ART[d.cat]} alt="" />
        <small>{d.by}</small>
      </div>
      <div className="np-body">
        <h4>
          {d.title}
          {term && <span className="np-term">{term}</span>}
        </h4>
        <div className="np-bubble">
          {sec.lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
        {sec.tags.length > 0 && (
          <div className="np-tags">
            {sec.tags.map((t) => (
              <span key={t} className="np-tag">
                #{t}
              </span>
            ))}
          </div>
        )}
        <ul className="np-links">
          {(compact ? sec.articles.slice(0, 1) : sec.articles).map((a) => (
            <li key={a.url}>
              <a href={a.url} target="_blank" rel="noreferrer">
                <span className="grow">{a.title}</span>
                <small>{a.source} ›</small>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function OursDesk({ ours, compact }: { ours: { code: string; sec: NewsSection }[]; compact?: boolean }) {
  const d = DESK.ours
  return (
    <article className={`np-sec ${compact ? 'compact' : ''}`}>
      <div className="np-by">
        <img src={ART[d.cat]} alt="" />
        <small>{d.by}</small>
      </div>
      <div className="np-body">
        <h4>{d.title}</h4>
        {ours.length === 0 ? (
          <div className="np-bubble">
            <p>아직 우리 종목 소식은 없어요.</p>
          </div>
        ) : (
          (compact ? ours.slice(0, 1) : ours).map(({ code, sec }) => (
            <div key={code} className="np-ours">
              <span className="np-tag on">{tickerOf(code).name}</span>
              <div className="np-bubble">
                {sec.lines.map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
              </div>
              <ul className="np-links">
                {(compact ? sec.articles.slice(0, 1) : sec.articles).map((a) => (
                  <li key={a.url}>
                    <a href={a.url} target="_blank" rel="noreferrer">
                      <span className="grow">{a.title}</span>
                      <small>{a.source} ›</small>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
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
