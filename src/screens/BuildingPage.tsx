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

  // 지그재그 길: 레슨 5개가 좌우로 엇갈리며 내려간다 (x는 폭 %, 한 칸 높이 ROW)
  const XS = [50, 24, 50, 76, 50]
  const ROW = 128
  const H = ROW * ch.lessons.length
  const pathD = XS.map((x, k) => `${k === 0 ? 'M' : 'L'} ${x} ${k * ROW + 44}`).join(' ')
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

      <ol className="rm-path" style={{ height: H }}>
        <svg className="rm-line" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>
          <path d={pathD} />
        </svg>
        {ch.lessons.map((l, li) => {
          const isDone = !!done[l.id]
          const open = li === 0 || !!done[ch.lessons[li - 1].id]
          const now = firstOpen?.id === l.id
          const apply = li === 4
          return (
            <li key={l.id} className={`${isDone ? 'done' : ''} ${now ? 'now' : ''} ${open ? '' : 'locked'}`} style={{ left: `${XS[li]}%`, top: li * ROW }}>
              <button disabled={!open} onClick={() => setPlay(l)} aria-label={l.title}>
                <span className="rm-node">{isDone ? '★' : open ? li + 1 : '🔒'}</span>
                <span className="rm-title">
                  {apply && <em className="apply">적용</em>}
                  {l.title}
                </span>
              </button>
              {now && <img className={`rm-cat ${XS[li] > 60 ? 'l' : 'r'}`} src={ART.sit} alt="" aria-hidden />}
            </li>
          )
        })}
      </ol>
      {play && <LessonPlay lesson={play} chapterTitle={`${TRACKS[track].name} ${ch.no}장 · ${ch.title}`} onExit={() => setPlay(null)} />}
    </Page>
  )
}
