// 플로월드: 마을 한 장이 화면 가득. 땅 10곳 = 건물 10개 = 단원 10개(챕터 5 × 레슨 5).
// 지금 지을 땅을 누르면 건물(단원) 화면 → 레슨. 25개를 다 끝내면 그 땅에 건물이 지어지고, 누르면 가게 안을 꾸민다.
// 오른쪽 아이콘: 개념 노트(지금 단원 교과서) · 내 노트(내가 배운 것 모음).
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame } from '../store'
import { SHOPS, VILLAGE } from '../data/world'
import { CURRICULUM, allLessons, buildingOf, isReady } from '../data/curriculum'
import { ShopInterior } from './ShopInterior'
import { BuildingPage } from './BuildingPage'
import { MyNotes } from './MyNotes'
import { Page } from '../components/Page'
import { WorldIntro } from '../components/WorldIntro'
import { Lock } from '../components/Icons'
import { ART } from '../components/CatView'
import type { Tab } from '../App'

type NodeState = 'done' | 'now' | 'locked'

export function MapScreen(_: { go: (t: Tab) => void }) {
  const s = useGame()
  const { done, built } = s.learn
  const [popup, setPopup] = useState<string | null>(null)
  const [guide, setGuide] = useState(false)
  const [notes, setNotes] = useState(false)
  const [intro, setIntro] = useState(true)
  const [shopOpen, setShopOpen] = useState<string | null>(null)
  const [unit, setUnit] = useState<string | null>(null)
  const current = CURRICULUM.find((b) => !built[b.id])
  const curIdx = current ? CURRICULUM.indexOf(current) : CURRICULUM.length
  const builtN = CURRICULUM.filter((b) => built[b.id]).length
  const nowRef = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const endIntro = useCallback(() => setIntro(false), [])
  const curShop = current ? SHOPS.find((x) => x.id === current.id) : null
  const curLessons = current ? allLessons(current) : []
  const curDone = curLessons.filter((l) => done[l.id]).length

  // 가로로 넓은 마을: 지금 지을 땅이 화면 가운데 오게
  useEffect(() => {
    const sc = scroller.current
    const el = nowRef.current
    if (!sc) return
    const target = el ? el.offsetLeft - sc.clientWidth / 2 : (sc.scrollWidth - sc.clientWidth) / 2
    sc.scrollLeft = Math.max(0, Math.min(target, sc.scrollWidth - sc.clientWidth))
  }, [])

  const stateOf = (i: number): NodeState => (built[CURRICULUM[i]?.id] ? 'done' : i === curIdx ? 'now' : 'locked')

  return (
    <div className="tab-panel live fw" onClick={() => setPopup(null)}>
      <div className="fw-scroll" ref={scroller}>
      <div className="fw-map" style={{ backgroundImage: `url(${VILLAGE})` }}>
        {SHOPS.map((shop, i) => {
          const st = stateOf(i)
          const open = popup === shop.id
          const b = CURRICULUM[i]
          const n = allLessons(b).filter((l) => done[l.id]).length
          return (
            <div key={shop.id} className={`vl-lot fw-lot ${st} ${open ? 'open' : ''} ${shop.lot.y > 68 ? 'pop-up' : ''} ${shop.lot.x > 70 ? 'pop-r' : shop.lot.x < 30 ? 'pop-l' : ''}`} style={{ left: `${shop.lot.x}%`, top: `${shop.lot.y}%` }} ref={st === 'now' ? nowRef : undefined}>
              <button
                className="vl-hit"
                aria-label={shop.name}
                onClick={(e) => {
                  e.stopPropagation()
                  if (st === 'now') return setUnit(b.id)
                  setPopup(open ? null : shop.id)
                }}
              >
                {st === 'done' ? (
                  <img className="vl-bld" src={ART[shop.building]} alt="" />
                ) : st === 'now' ? (
                  <span className="fw-flag">
                    <span className="fw-pole" />
                    <span className="fw-cloth">
                      <b>{i + 1}</b>
                    </span>
                    <span className="fw-ring" />
                  </span>
                ) : (
                  <span className="fw-cloud">
                    <Lock size={13} />
                    <small>{i + 1}</small>
                  </span>
                )}
              </button>
              <span className={`fw-name ${st}`}>
                {st === 'locked' ? shop.name : shop.name}
                {st === 'now' && <em>{n}/25</em>}
              </span>
              {st === 'now' && (
                <span className="vl-cat" aria-hidden>
                  <img src={ART.sit} alt="" />
                </span>
              )}
              {open && st === 'locked' && (
                <div className="vl-pop small" onClick={(e) => e.stopPropagation()}>
                  {shop.name} · {b.topic}
                  <br />앞 건물을 먼저 지어야 열려요
                </div>
              )}
              {open && st === 'done' && (
                <div className="vl-pop" onClick={(e) => e.stopPropagation()}>
                  <small>{shop.name} 완성</small>
                  <b>{b.topic}</b>
                  <button className="btn btn-primary btn-block" onClick={() => (setPopup(null), setShopOpen(shop.id))}>
                    가게 들어가서 꾸미기
                  </button>
                  <button className="btn btn-ghost btn-block" onClick={() => (setPopup(null), setUnit(b.id))}>
                    다시 배우기
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      </div>
      <header className="fw-hud">
        <div className="fw-sign">
          <span className="fw-ch">CHAPTER {Math.min(curIdx + 1, 10)}</span>
          <h1>FLOWORLD</h1>
        </div>
        <div className="fw-prog">
          <span className="fw-prog-ico">
            <img src={ART[curShop?.building ?? 't_shop']} alt="" />
          </span>
          <div className="grow">
            <b>{curShop ? `${curShop.name} 짓는 중` : '마을 완성!'}</b>
            <div className="fw-bar">
              <i style={{ width: `${curLessons.length ? (curDone / curLessons.length) * 100 : 100}%` }} />
            </div>
          </div>
          <span className="fw-count">
            🏠 {builtN}/10
          </span>
        </div>
      </header>

      <div className="fw-side">
        <button className="fw-icon" onClick={(e) => (e.stopPropagation(), setGuide(true))} aria-label="개념 노트">
          <NoteIcon kind="book" />
          <small>개념 노트</small>
        </button>
        <button className="fw-icon mine" onClick={(e) => (e.stopPropagation(), setNotes(true))} aria-label="내 노트">
          <NoteIcon kind="pen" />
          <small>내 노트</small>
        </button>
      </div>

      {intro && <WorldIntro chapter={Math.min(curIdx + 1, 10)} region={curShop?.name ?? 'FLOWORLD'} onDone={endIntro} />}
      {unit && <BuildingPage b={buildingOf(unit)} onExit={() => setUnit(null)} />}
      {guide && <ConceptNote id={current?.id ?? CURRICULUM[CURRICULUM.length - 1].id} onClose={() => setGuide(false)} />}
      {notes && <MyNotes onExit={() => setNotes(false)} />}
      {shopOpen && <ShopInterior shop={SHOPS.find((x) => x.id === shopOpen)!} onExit={() => setShopOpen(null)} />}
    </div>
  )
}

function NoteIcon({ kind }: { kind: 'book' | 'pen' }) {
  return kind === 'book' ? (
    <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden>
      <rect x="6" y="4" width="20" height="24" rx="4" fill="#7ea7ef" />
      <rect x="9" y="4" width="17" height="24" rx="3" fill="#a9c6f7" />
      <rect x="12" y="9" width="11" height="2.4" rx="1.2" fill="#fff" />
      <rect x="12" y="14" width="8" height="2.4" rx="1.2" fill="#fff" />
      <rect x="6" y="4" width="4" height="24" rx="2" fill="#5b82d1" />
    </svg>
  ) : (
    <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden>
      <rect x="6" y="4" width="18" height="24" rx="4" fill="#ffc9da" />
      <rect x="9" y="9" width="11" height="2.2" rx="1.1" fill="#fff" />
      <rect x="9" y="13.5" width="11" height="2.2" rx="1.1" fill="#fff" />
      <rect x="9" y="18" width="7" height="2.2" rx="1.1" fill="#fff" />
      <path d="M22 26 L27 13 L29.5 14 L24.5 27 Z" fill="#f2a24b" />
      <path d="M22 26 L22.6 29 L24.5 27 Z" fill="#7a5532" />
    </svg>
  )
}

// 개념 노트: 지금 단원의 교과서 (레슨마다 핵심 개념을 모아 보기)
function ConceptNote({ id, onClose }: { id: string; onClose: () => void }) {
  const b = buildingOf(id)
  const shop = SHOPS.find((x) => x.id === id)!
  return (
    <Page title={`${shop.name} 개념 노트`} sub={b.topic} onExit={onClose}>
      {b.chapters.map((c, ci) => (
        <section key={c.id} className="note-card card cn-ch">
          <h3>
            {ci + 1}. {c.title}
          </h3>
          {c.lessons.map((l) =>
            isReady(l) ? (
              <div key={l.id} className="cn-l">
                <b>{l.title}</b>
                <ul>
                  {l.core!.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div key={l.id} className="cn-l soon">
                <b>{l.title}</b>
                <small>준비 중</small>
              </div>
            ),
          )}
        </section>
      ))}
    </Page>
  )
}
