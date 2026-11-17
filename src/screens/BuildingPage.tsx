// 건물(단원) 화면: Basic / Advanced 고르기 + 챕터 5개 × 레슨 5개 길.
// 레슨은 앞 레슨을 끝내야 열리고, 챕터는 앞 챕터를 끝내야 열린다. 25개를 다 끝내면 건물이 지어진다.
import { useState } from 'react'
import { actions, useGame } from '../store'
import { Page } from '../components/Page'
import { ART } from '../components/CatView'
import { allLessons, isReady, type BuildingDef, type LessonDef } from '../data/curriculum'
import { SHOPS } from '../data/world'
import { LessonPlay } from './LessonPlay'

export function BuildingPage({ b, onExit }: { b: BuildingDef; onExit: () => void }) {
  const s = useGame()
  const done = s.learn.done
  const shop = SHOPS.find((x) => x.id === b.id)!
  const [play, setPlay] = useState<{ l: LessonDef; ch: string } | null>(null)
  const all = allLessons(b)
  const n = all.filter((l) => done[l.id]).length
  const firstOpen = all.find((l) => !done[l.id])
  const built = !!s.learn.built[b.id]

  return (
    <Page title={shop.name} sub={b.topic} onExit={onExit}>
      <section className="bp-head">
        <img src={ART[shop.building]} alt="" className={built ? '' : 'ghost'} />
        <div className="grow">
          <b>{built ? `${shop.name} 완성!` : `${shop.name} 짓는 중`}</b>
          <small>{b.goal}</small>
          <div className="bp-bar">
            <i style={{ width: `${(n / all.length) * 100}%` }} />
          </div>
          <small className="num">
            레슨 {n} / {all.length}
          </small>
        </div>
      </section>

      <div className="bp-track">
        {(['basic', 'adv'] as const).map((t) => (
          <button key={t} className={s.learn.track === t ? 'on' : ''} onClick={() => actions.setTrack(t)}>
            <b>{t === 'basic' ? 'Basic' : 'Advanced'}</b>
            <small>{t === 'basic' ? '쉬운 예시 · 개념 확인' : '계산 · 실제 용어 · 서술형'}</small>
          </button>
        ))}
      </div>

      {b.chapters.map((c, ci) => {
        const cDone = c.lessons.filter((l) => done[l.id]).length
        const prevDone = ci === 0 || b.chapters[ci - 1].lessons.every((l) => done[l.id])
        return (
          <section key={c.id} className={`bp-ch ${prevDone ? '' : 'locked'}`}>
            <div className="bp-ch-head">
              <span className="bp-ch-no">{ci + 1}</span>
              <b className="grow">{c.title}</b>
              <small>
                {cDone}/{c.lessons.length}
              </small>
            </div>
            <ol className="bp-path">
              {c.lessons.map((l, li) => {
                const isDone = !!done[l.id]
                const open = prevDone && (li === 0 || !!done[c.lessons[li - 1].id])
                const ready = isReady(l)
                const now = firstOpen?.id === l.id
                return (
                  <li key={l.id} className={`${isDone ? 'done' : ''} ${now ? 'now' : ''} ${open ? '' : 'locked'} ${ready ? '' : 'soon'}`}>
                    <button disabled={!open || !ready} onClick={() => setPlay({ l, ch: `${ci + 1}. ${c.title}` })}>
                      <span className="dot">{isDone ? '★' : !ready ? '…' : open ? li + 1 : '🔒'}</span>
                      <span className="t">{l.title}</span>
                      {!ready && <em>준비 중</em>}
                      {now && ready && <em className="go">지금</em>}
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
      {play && <LessonPlay lesson={play.l} chapterTitle={play.ch} onExit={() => setPlay(null)} />}
    </Page>
  )
}
