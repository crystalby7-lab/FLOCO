// 건물 화면 = 챕터 화면. 건물 N은 내 과정(Basic/Advanced)의 챕터 N과 짝.
// 레슨 5개(1~4 개념 · 5 적용)를 순서대로 끝내면 이 건물이 열린다. 목록엔 제목만, 학습 목표는 레슨 첫 카드에서.
import { useState } from 'react'
import { actions, useGame } from '../store'
import { Page } from '../components/Page'
import { ART } from '../components/CatView'
import { COURSE, TRACKS, type LessonDef, type Track } from '../data/curriculum'
import { SHOPS } from '../data/world'
import { LessonPlay } from './LessonPlay'

export function BuildingPage({ index, onExit }: { index: number; onExit: () => void }) {
  const s = useGame()
  const done = s.learn.done
  const track = s.learn.track
  const shop = SHOPS[index]
  const ch = COURSE[track][index]
  const [play, setPlay] = useState<LessonDef | null>(null)
  const n = ch.lessons.filter((l) => done[l.id]).length
  const firstOpen = ch.lessons.find((l) => !done[l.id])
  const built = !!s.learn.built[shop.id]

  return (
    <Page title={shop.name} sub={`${TRACKS[track].name} · ${String(ch.no).padStart(2, '0')}장 ${ch.title}`} onExit={onExit}>
      <section className="bp-head">
        <img src={ART[shop.building]} alt="" className={built ? '' : 'ghost'} />
        <div className="grow">
          <b>{built ? `${shop.name} 열림!` : `${shop.name} 여는 중`}</b>
          <small>
            {String(ch.no).padStart(2, '0')}장 · {ch.title}
          </small>
          <div className="bp-bar">
            <i style={{ width: `${(n / ch.lessons.length) * 100}%` }} />
          </div>
          <small className="num">
            레슨 {n} / {ch.lessons.length}
          </small>
        </div>
      </section>

      <section className="bp-ch">
        <div className="bp-ch-head">
          <span className="bp-ch-no">{ch.no}</span>
          <b className="grow">{ch.title}</b>
          <small>
            {n}/{ch.lessons.length}
          </small>
        </div>
        <div className="bp-tabs" role="tablist">
          {(['basic', 'adv'] as Track[]).map((t) => (
            <button key={t} role="tab" aria-selected={track === t} className={track === t ? 'on' : ''} onClick={() => actions.setTrack(t)}>
              {TRACKS[t].name}
            </button>
          ))}
        </div>
        <ol className="bp-path">
          {ch.lessons.map((l, li) => {
            const isDone = !!done[l.id]
            const open = li === 0 || !!done[ch.lessons[li - 1].id]
            const now = firstOpen?.id === l.id
            const apply = li === 4
            return (
              <li key={l.id} className={`${isDone ? 'done' : ''} ${now ? 'now' : ''} ${open ? '' : 'locked'}`}>
                <button disabled={!open} onClick={() => setPlay(l)}>
                  <span className="dot">{isDone ? '★' : open ? li + 1 : '🔒'}</span>
                  <span className="t">{l.title}</span>
                  {apply && <em className="apply">적용</em>}
                  {now && <em className="go">지금</em>}
                </button>
              </li>
            )
          })}
        </ol>
      </section>
      {play && <LessonPlay lesson={play} chapterTitle={`${TRACKS[track].name} ${ch.no}장 · ${ch.title}`} onExit={() => setPlay(null)} />}
    </Page>
  )
}
