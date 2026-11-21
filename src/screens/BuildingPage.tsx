// 건물 화면 = 챕터 화면. 건물 N은 내 과정(Basic/Advanced)의 챕터 N과 짝.
// 레슨 5개(1~4 개념 · 5 적용)를 순서대로 끝내면 이 건물이 열린다. 화면은 마을 위 고양이 발자국 산책길 + 나무 표지판.
import { useState } from 'react'
import { actions, useGame } from '../store'
import { Page } from '../components/Page'
import { ART } from '../components/CatView'
import { COURSE, TRACKS, type LessonDef, type Track } from '../data/curriculum'
import { SHOPS, VILLAGE } from '../data/world'
import { CheckBold, Lock } from '../components/Icons'
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

  // 고양이 발자국 산책길: 마을 그림 위로 발자국 길이 구불구불, 레슨은 길가 나무 표지판.
  // 표지판은 왼쪽·오른쪽 번갈아, 길은 그 사이를 S자로 지난다. (x: 폭 %, y: px)
  const ROW = 150
  const TOP = 40
  const H = TOP + ROW * ch.lessons.length + 20
  const pts = ch.lessons.map((_, k) => ({ x: k % 2 === 0 ? 30 : 70, y: TOP + k * ROW + 40 }))
  const paws: { x: number; y: number; r: number; side: number }[] = []
  for (let k = 0; k < pts.length - 1; k++) {
    const p0 = pts[k]
    const p1 = pts[k + 1]
    // 세로 S자 곡선 (3차 베지어), 점 7개마다 발자국 하나
    const c0 = { x: p0.x, y: p0.y + ROW * 0.55 }
    const c1 = { x: p1.x, y: p1.y - ROW * 0.55 }
    const at = (u: number) => {
      const v = 1 - u
      return {
        x: v * v * v * p0.x + 3 * v * v * u * c0.x + 3 * v * u * u * c1.x + u * u * u * p1.x,
        y: v * v * v * p0.y + 3 * v * v * u * c0.y + 3 * v * u * u * c1.y + u * u * u * p1.y,
      }
    }
    for (let i = 1; i <= 6; i++) {
      const u = i / 7
      const q = at(u)
      const q2 = at(u + 0.02)
      const ang = (Math.atan2(q2.y - q.y, ((q2.x - q.x) * 380) / 100) * 180) / Math.PI + 90
      paws.push({ x: q.x, y: q.y, r: ang, side: i % 2 ? -1 : 1 })
    }
  }
  const nowIdx = firstOpen ? ch.lessons.indexOf(firstOpen) : -1
  return (
    <Page title={shop.name} sub={`${TRACKS[track].name} · ${String(ch.no).padStart(2, '0')}장 ${ch.title}`} onExit={onExit}>
      <section className="rm-head">
        <img src={ART[shop.building]} alt="" className={built ? '' : 'ghost'} />
        <div className="grow">
          <small>{String(ch.no).padStart(2, '0')}장</small>
          <b>{ch.title}</b>
          <div className="bp-bar">
            <i style={{ width: `${(n / ch.lessons.length) * 100}%` }} />
          </div>
        </div>
        <span className="rm-count">
          <b>{n}</b>/{ch.lessons.length}
        </span>
      </section>

      <div className="bp-tabs rm-tabs" role="tablist">
        {(['basic', 'adv'] as Track[]).map((tk) => (
          <button key={tk} role="tab" aria-selected={track === tk} className={track === tk ? 'on' : ''} onClick={() => actions.setTrack(tk)}>
            {TRACKS[tk].name}
          </button>
        ))}
      </div>

      <div className="walk" style={{ height: H, backgroundImage: `url(${VILLAGE})` }}>
        {paws.map((p, i) => {
          const passed = nowIdx === -1 || i < nowIdx * 6
          return (
            <span
              key={i}
              className={`walk-paw ${passed ? 'on' : ''}`}
              style={{ left: `calc(${p.x}% + ${p.side * 7}px)`, top: p.y, transform: `translate(-50%, -50%) rotate(${p.r}deg)` }}
              aria-hidden
            >
              <Paw />
            </span>
          )
        })}
        {ch.lessons.map((l, li) => {
          const isDone = !!done[l.id]
          const open = li === 0 || !!done[ch.lessons[li - 1].id]
          const now = firstOpen?.id === l.id
          const left = li % 2 === 0
          return (
            <div key={l.id} className={`walk-stop ${left ? 'l' : 'r'} ${isDone ? 'done' : ''} ${now ? 'now' : ''} ${open ? '' : 'locked'}`} style={{ top: pts[li].y - 40 }}>
              <button className="sign" disabled={!open} onClick={() => setPlay(l)}>
                <span className="sign-board">
                  <span className="sign-no">{isDone ? <CheckBold size={16} color="#fff" /> : open ? li + 1 : <Lock size={15} />}</span>
                  <span className="sign-text">
                    {li === 4 && <em>적용</em>}
                    {l.title}
                  </span>
                </span>
                <span className="sign-post" />
              </button>
              {now && <img className="walk-cat" src={ART.walk} alt="" aria-hidden />}
            </div>
          )
        })}
        <div className="walk-goal" style={{ top: H - 70 }}>
          <img src={ART[shop.building]} alt="" className={built ? '' : 'ghost'} />
        </div>
      </div>
      {play && <LessonPlay lesson={play} chapterTitle={`${TRACKS[track].name} ${ch.no}장 · ${ch.title}`} onExit={() => setPlay(null)} />}
    </Page>
  )
}

function Paw() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <ellipse cx="12" cy="15.5" rx="5" ry="4.2" />
      <circle cx="6" cy="9.5" r="2.1" />
      <circle cx="10" cy="6.2" r="2.1" />
      <circle cx="14" cy="6.2" r="2.1" />
      <circle cx="18" cy="9.5" r="2.1" />
    </svg>
  )
}
