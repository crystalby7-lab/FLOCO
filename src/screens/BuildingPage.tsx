// 건물 화면 = 챕터 화면. 건물 N은 내 과정(Basic/Advanced)의 챕터 N과 짝.
// 레슨 5개(1~4 개념 · 5 적용)를 순서대로 끝내면 이 건물이 열린다. 화면은 공책 한 쪽처럼(줄마다 레슨 하나).
import { useState } from 'react'
import { actions, useGame } from '../store'
import { Page } from '../components/Page'
import { ART } from '../components/CatView'
import { COURSE, TRACKS, type LessonDef, type Track } from '../data/curriculum'
import { SHOPS } from '../data/world'
import { CheckBold, Lock } from '../components/Icons'
import { LessonPlay } from './LessonPlay'

// 받침 있으면 '이', 없으면 '가'
const iGa = (w: string) => ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? '이' : '가')

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

  // 노트처럼: 챕터 한 장 = 공책 한 쪽. 레슨 5개가 줄마다 한 줄씩, 끝낸 줄엔 체크와 내 노트 한 줄.
  return (
    <Page title={shop.name} sub={`${TRACKS[track].name} · ${String(ch.no).padStart(2, '0')}장 ${ch.title}`} onExit={onExit}>
      <div className="bp-tabs rm-tabs" role="tablist">
        {(['basic', 'adv'] as Track[]).map((tk) => (
          <button key={tk} role="tab" aria-selected={track === tk} className={track === tk ? 'on' : ''} onClick={() => actions.setTrack(tk)}>
            {TRACKS[tk].name}
          </button>
        ))}
      </div>

      <article className="nb">
        <span className="nb-rings" aria-hidden>
          {Array.from({ length: 7 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
        <header className="nb-head">
          <div className="grow">
            <small>
              {TRACKS[track].name} · CHAPTER {String(ch.no).padStart(2, '0')}
            </small>
            <h2>{ch.title}</h2>
            <div className="nb-prog">
              <div className="bp-bar">
                <i style={{ width: `${(n / ch.lessons.length) * 100}%` }} />
              </div>
              <span>
                {n}/{ch.lessons.length}
              </span>
            </div>
          </div>
          <img src={ART[shop.building]} alt="" className={`nb-bld ${built ? '' : 'ghost'}`} />
        </header>

        <ol className="nb-lines">
          {ch.lessons.map((l, li) => {
            const isDone = !!done[l.id]
            const open = li === 0 || !!done[ch.lessons[li - 1].id]
            const now = firstOpen?.id === l.id
            return (
              <li key={l.id} className={`${isDone ? 'done' : ''} ${now ? 'now' : ''} ${open ? '' : 'locked'}`}>
                <button disabled={!open} onClick={() => setPlay(l)}>
                  <span className="nb-box">{isDone ? <CheckBold size={14} color="#fff" /> : open ? li + 1 : <Lock size={13} />}</span>
                  <span className="nb-text">
                    <b>
                      {l.title}
                      {li === 4 && <em>적용</em>}
                    </b>
                    {isDone && l.note ? <small className="nb-note">{l.note}</small> : now ? <small className="nb-go">지금 할 차례예요</small> : null}
                  </span>
                  {now && <img className="nb-cat" src={ART.t_wave} alt="" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ol>
        <p className="nb-foot">{built ? `${shop.name}${iGa(shop.name)} 열렸어요` : `5줄을 다 채우면 ${shop.name}${iGa(shop.name)} 열려요`}</p>
      </article>
      {play && <LessonPlay lesson={play} chapterTitle={`${TRACKS[track].name} ${ch.no}장 · ${ch.title}`} onExit={() => setPlay(null)} />}
    </Page>
  )
}
