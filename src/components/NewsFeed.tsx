// 홈 경제 뉴스: GNews 헤드라인(public/gnews.json, 3시간마다 GitHub이 갱신). 없으면 예전 카테고리 링크(NewsLinks).
import { useEffect, useState } from 'react'
import { ART } from './CatView'
import { NewsLinks } from './NewsLinks'

type Item = { title: string; desc: string; url: string; source: string; at: string }
const URLS = ['https://raw.githubusercontent.com/crystalby7-lab/FLOCO/main/public/gnews.json', `${import.meta.env.BASE_URL}gnews.json`]

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (!(m >= 0)) return ''
  if (m < 60) return `${m}분 전`
  if (m < 60 * 24) return `${Math.round(m / 60)}시간 전`
  return `${Math.round(m / 1440)}일 전`
}

export function NewsFeed() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [more, setMore] = useState(false)
  useEffect(() => {
    let off = false
    ;(async () => {
      for (const u of URLS) {
        try {
          const r = await fetch(u, { cache: 'no-cache' })
          if (!r.ok) continue
          const j = (await r.json()) as { items?: Item[] }
          if (j.items?.length) {
            if (!off) setItems(j.items)
            return
          }
        } catch {
          /* 다음 주소 */
        }
      }
      if (!off) setItems([])
    })()
    return () => {
      off = true
    }
  }, [])
  if (items === null) return null
  if (items.length === 0) return <NewsLinks />
  const list = more ? items : items.slice(0, 4)
  return (
    <section className="card news-feed">
      <div className="card-row">
        <h3 className="card-title">오늘의 경제 뉴스</h3>
        <img className="nf-cat" src={ART.b_tuxedo} alt="" />
      </div>
      <ul>
        {list.map((n) => (
          <li key={n.url}>
            <a href={n.url} target="_blank" rel="noreferrer">
              <b>{n.title}</b>
              {n.desc && <p>{n.desc}</p>}
              <small>
                {n.source}
                {n.at && ` · ${ago(n.at)}`}
              </small>
            </a>
          </li>
        ))}
      </ul>
      {items.length > 4 && (
        <button className="text-btn nf-more" onClick={() => setMore(!more)}>
          {more ? '접기' : `뉴스 ${items.length - 4}개 더 보기`}
        </button>
      )}
      <p className="nf-note">사고팔라는 뜻이 아니에요 · 기사 원문은 각 언론사에서 봐요</p>
    </section>
  )
}
