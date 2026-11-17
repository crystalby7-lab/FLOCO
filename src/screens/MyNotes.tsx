// 내 노트: 개념 노트(교과서)와 별개로, 내가 끝낸 레슨의 핵심 한 줄과 지은 건물을 글로 모아 둔 공책.
import { useState } from 'react'
import { useGame } from '../store'
import { Page } from '../components/Page'
import { ART } from '../components/CatView'
import { CURRICULUM, allLessons } from '../data/curriculum'
import { SHOPS } from '../data/world'

const day = (t: number) => {
  const d = new Date(t)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export function MyNotes({ onExit }: { onExit: () => void }) {
  const s = useGame()
  const { done, built } = s.learn
  const started = CURRICULUM.filter((b) => allLessons(b).some((l) => done[l.id]))
  const [open, setOpen] = useState<string | null>(started[0]?.id ?? null)
  const builtList = CURRICULUM.filter((b) => built[b.id])

  return (
    <Page title="내 노트" sub="내가 배운 것을 내 말로 모아 둔 곳" onExit={onExit}>
      <section className="mn-built">
        <h3>지은 건물</h3>
        {builtList.length === 0 ? (
          <p className="mn-empty">아직 지은 건물이 없어요. 레슨 25개를 끝내면 첫 건물이 지어져요.</p>
        ) : (
          <div className="mn-builds">
            {builtList.map((b) => {
              const shop = SHOPS.find((x) => x.id === b.id)!
              return (
                <div key={b.id} className="mn-build">
                  <img src={ART[shop.building]} alt="" />
                  <b>{shop.name}</b>
                  <small>{day(built[b.id])}</small>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {started.length === 0 && <p className="mn-empty">레슨을 하나 끝내면 여기에 첫 줄이 적혀요.</p>}

      {started.map((b) => {
        const shop = SHOPS.find((x) => x.id === b.id)!
        const n = allLessons(b).filter((l) => done[l.id]).length
        const isOpen = open === b.id
        return (
          <section key={b.id} className={`mn-book ${isOpen ? 'open' : ''}`}>
            <button className="mn-book-head" onClick={() => setOpen(isOpen ? null : b.id)}>
              <img src={ART[shop.building]} alt="" />
              <span className="grow">
                <b>
                  {shop.name} · {b.topic}
                </b>
                <small>
                  {n}/25 레슨{built[b.id] ? ` · ${day(built[b.id])} 완성` : ''}
                </small>
              </span>
              <i>{isOpen ? '−' : '+'}</i>
            </button>
            {isOpen &&
              b.chapters.map((c, ci) => {
                const lines = c.lessons.filter((l) => done[l.id])
                if (!lines.length) return null
                return (
                  <div key={c.id} className="mn-ch">
                    <h4>
                      {ci + 1}. {c.title}
                    </h4>
                    <ul>
                      {lines.map((l) => (
                        <li key={l.id}>
                          <b>{l.title}</b>
                          <p>{l.note ?? l.core?.[0]}</p>
                          <small>
                            {day(done[l.id].at)} · {done[l.id].score}/{done[l.id].total}
                          </small>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
          </section>
        )
      })}
    </Page>
  )
}
