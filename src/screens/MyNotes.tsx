// 내 노트: 개념 노트(교과서)와 별개로, 내가 연 건물과 끝낸 레슨의 핵심 한 줄을 과정·챕터별로 모은 공책.
import { useState } from 'react'
import { useGame } from '../store'
import { Page } from '../components/Page'
import { ART } from '../components/CatView'
import { COURSE, TRACKS, type Track } from '../data/curriculum'
import { SHOPS } from '../data/world'

const day = (t: number) => {
  const d = new Date(t)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export function MyNotes({ onExit }: { onExit: () => void }) {
  const s = useGame()
  const { done, built } = s.learn
  const [track, setTrack] = useState<Track>(s.learn.track)
  const started = COURSE[track].filter((c) => c.lessons.some((l) => done[l.id]))
  const [open, setOpen] = useState<string | null>(started[0]?.id ?? null)
  const builtList = SHOPS.filter((x) => built[x.id])

  return (
    <Page title="내 노트" sub="내가 배운 것을 모아 둔 곳" onExit={onExit}>
      <section className="mn-built">
        <h3>연 건물</h3>
        {builtList.length === 0 ? (
          <p className="mn-empty">아직 연 건물이 없어요. 챕터 하나(레슨 5개)를 끝내면 첫 건물이 열려요.</p>
        ) : (
          <div className="mn-builds">
            {builtList.map((shop) => (
              <div key={shop.id} className="mn-build">
                <img src={ART[shop.building]} alt="" />
                <b>{shop.name}</b>
                <small>{day(built[shop.id])}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mn-tabs">
        {(['basic', 'adv'] as Track[]).map((t) => (
          <button key={t} className={track === t ? 'on' : ''} onClick={() => setTrack(t)}>
            {TRACKS[t].name}
          </button>
        ))}
      </div>

      {started.length === 0 && <p className="mn-empty">이 과정에서 레슨을 하나 끝내면 여기에 첫 줄이 적혀요.</p>}

      {started.map((c) => {
        const shop = SHOPS[c.no - 1]
        const lines = c.lessons.filter((l) => done[l.id])
        const isOpen = open === c.id
        return (
          <section key={c.id} className={`mn-book ${isOpen ? 'open' : ''}`}>
            <button className="mn-book-head" onClick={() => setOpen(isOpen ? null : c.id)}>
              <img src={ART[shop.building]} alt="" />
              <span className="grow">
                <b>
                  {String(c.no).padStart(2, '0')}장 · {c.title}
                </b>
                <small>
                  {shop.name} · {lines.length}/5 레슨{built[shop.id] ? ` · ${day(built[shop.id])} 열림` : ''}
                </small>
              </span>
              <i>{isOpen ? '−' : '+'}</i>
            </button>
            {isOpen && (
              <div className="mn-ch">
                <ul>
                  {lines.map((l) => (
                    <li key={l.id}>
                      <b>{l.title}</b>
                      <p>{l.note}</p>
                      <small>
                        {day(done[l.id].at)} · {done[l.id].score}/{done[l.id].total}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )
      })}
    </Page>
  )
}
