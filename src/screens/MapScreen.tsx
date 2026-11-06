// 플로월드 지도 (F1·F2·F3): 장 = 마을 구역, 퀘스트 = 건물.
// 퀘스트를 끝낼 때마다 그 건물이 잠금 해제되어 마을이 하나씩 지어진다.
// 고양이는 지금 지을 건물 옆에서 기다린다.
import { useEffect, useRef, useState } from 'react'
import { questsDone, unlocked, useGame } from '../store'
import { QUESTS, REGIONS, TOOLS, type Quest } from '../data/quests'
import { Page } from '../components/Page'
import { TabHeader } from '../components/TabHeader'
import { Book, Lock } from '../components/Icons'
import { ART } from '../components/CatView'
import { Lesson } from './Lesson'
import type { Tab } from '../App'

const CHAPTER = { village: 1, forest: 2, city: 3, port: 4 } as const
const OFFSETS = [-40, 50, -10, 64, -56, 18, -30, 46]
const ROW = 150
// 퀘스트마다 지어지는 건물 (마을 시트 그림)
const BUILD: Record<string, string> = { v1: 't_navy', v2: 't_bluehouse', v3: 't_cafe', f1: 't_greenhouse', f2: 't_dome', f3: 't_church' }
// 아직 준비 중인 구역에 미리 보이는 잠긴 건물
const PREVIEW: Record<string, string[]> = { city: ['t_pink', 't_bluecat', 't_school'], port: ['t_clock', 't_shop', 't_stadium'] }
const TREES = ['t_tree', 't_sakura', 't_pine']

type NodeState = 'done' | 'now' | 'open' | 'locked'

export function MapScreen({ go }: { go: (t: Tab) => void }) {
  const s = useGame()
  const [lesson, setLesson] = useState<Quest | null>(null)
  const [popup, setPopup] = useState<string | null>(null)
  const [guide, setGuide] = useState<string | null>(null)
  const tools = unlocked(s)
  const villageDone = questsDone(s, 'village')
  const locked = (r: string) => (r === 'forest' ? !villageDone : r === 'city' || r === 'port')
  const current = QUESTS.find((q) => !locked(q.region) && !s.quests[q.id]?.done)
  const doneN = QUESTS.filter((q) => s.quests[q.id]?.done).length
  const nowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    nowRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  const stateOf = (q: Quest): NodeState => (s.quests[q.id]?.done ? 'done' : locked(q.region) ? 'locked' : q === current ? 'now' : 'open')
  let n = 0

  return (
    <div className="tab-panel live path-panel" onClick={() => setPopup(null)}>
      <TabHeader
        title="플로월드"
        sub="퀘스트를 깨면 마을 건물이 하나씩 지어져요"
        right={
          <span className="head-pill">
            <img src={ART.t_navy} alt="" />
            {doneN}/{QUESTS.length}
          </span>
        }
      >
        <div className="map-progress">
          <div style={{ width: `${(doneN / QUESTS.length) * 100}%` }} />
        </div>
        <div className="tool-tags">
          {Object.entries(TOOLS).map(([id, t]) => (
            <span key={id} className={`tag-label ${tools.has(id) ? 'on' : ''}`} title={t.desc}>
              {!tools.has(id) && <Lock size={11} />}
              {t.name}
            </span>
          ))}
        </div>
      </TabHeader>

      {REGIONS.map((r) => {
        const qs = QUESTS.filter((q) => q.region === r.id)
        const isLocked = locked(r.id)
        const done = qs.filter((q) => s.quests[q.id]?.done).length
        const pts = qs.map(() => ({ x: OFFSETS[n++ % OFFSETS.length] }))
        const H = qs.length * ROW + 40
        const path = pts
          .map((p, i) => {
            const y = 40 + i * ROW + 34
            if (i === 0) return `M ${p.x} ${y}`
            const py = 40 + (i - 1) * ROW + 34
            return `C ${pts[i - 1].x} ${py + ROW / 2}, ${p.x} ${y - ROW / 2}, ${p.x} ${y}`
          })
          .join(' ')
        return (
          <section key={r.id} className={`chapter ch-${r.id} ${isLocked ? 'locked' : ''}`}>
            <div className="chapter-head">
              <span className="ch-no">{CHAPTER[r.id]}장</span>
              <div className="grow">
                <h2>{r.name}</h2>
                <p>{isLocked && r.id === 'forest' ? '기초 마을을 다 채우면 열려요' : r.desc}</p>
              </div>
              {qs.length > 0 ? (
                <button
                  className="tag-btn"
                  disabled={isLocked}
                  onClick={(e) => {
                    e.stopPropagation()
                    setGuide(r.id)
                  }}
                >
                  <Book size={16} />
                  개념 노트
                </button>
              ) : (
                <span className="tag-label">
                  <Lock size={11} /> 준비 중
                </span>
              )}
            </div>
            {qs.length > 0 && (
              <div className={`ch-progress ${done === qs.length ? 'complete' : ''}`}>{done === qs.length ? `${r.name} 완성!` : `건물 ${done}/${qs.length}`}</div>
            )}
            {qs.length === 0 && PREVIEW[r.id] && (
              <div className="ch-preview" aria-hidden>
                {PREVIEW[r.id].map((b) => (
                  <span key={b}>
                    <img src={ART[b]} alt="" />
                    <Lock size={14} />
                  </span>
                ))}
              </div>
            )}

            {qs.length > 0 && (
              <div className="ch-trail" style={{ height: H }}>
                <svg className="trail-line" height={H} aria-hidden>
                  <path d={path} />
                </svg>
                {qs.map((q, i) => {
                  const st = stateOf(q)
                  const off = pts[i].x
                  const open = popup === q.id
                  const qi = QUESTS.indexOf(q)
                  return (
                    <div
                      key={q.id}
                      className={`spot-row ${open ? 'open' : ''}`}
                      style={{ top: 40 + i * ROW, left: `calc(50% + ${off}px)` }}
                      ref={st === 'now' ? nowRef : undefined}
                    >
                      {st === 'now' && (
                        <span className={`spot-cat ${off > 0 ? 'right' : 'left'}`} aria-hidden>
                          <span className="spot-cat-say">여기부터!</span>
                          <img src={ART.sit} alt="" />
                        </span>
                      )}
                      <button
                        className={`spot ${st}`}
                        disabled={st === 'locked'}
                        aria-label={q.title}
                        onClick={(e) => {
                          e.stopPropagation()
                          setPopup(open ? null : q.id)
                        }}
                        style={{ ['--tilt' as string]: `${(qi % 2 ? 1 : -1) * (3 + (qi % 3) * 2)}deg` }}
                      >
                        <img className="spot-bld" src={ART[BUILD[q.id] ?? 't_navy']} alt="" />
                        <span className="spot-badge">
                          {st === 'done' ? (
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M5 12.5 L10 17.5 L19 7" />
                            </svg>
                          ) : st === 'locked' ? (
                            <Lock size={12} />
                          ) : (
                            qi + 1
                          )}
                        </span>
                        {st === 'now' && <span className="pulse" aria-hidden />}
                      </button>
                      <span className={`spot-label ${off > 0 ? 'left' : 'right'} ${st}`}>
                        <small>{st === 'done' ? '지었어요' : st === 'locked' ? '잠김' : st === 'now' ? '퀘스트를 깨면 지어져요' : q.type === 'judge' ? '판단 퀘스트' : '개념 + 퀴즈'}</small>
                        <b>{q.title}</b>
                      </span>
                      {open && (
                        <div className="spot-pop" onClick={(e) => e.stopPropagation()}>
                          <b>{q.title}</b>
                          <small>
                            {q.type === 'judge' ? '판단 퀘스트 · 상황 4개' : '개념 노트 + 퀴즈 3문제'}
                            {q.unlocks ? ' · 도구 해금' : ''}
                          </small>
                          <button
                            className="btn btn-primary btn-block"
                            onClick={() => {
                              setPopup(null)
                              setLesson(q)
                            }}
                          >
                            {st === 'done' ? '다시 펼쳐 보기' : `퀘스트 시작 · 건물 짓기`}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
                {qs.map((_, i) => (
                  <img
                    key={'tree' + i}
                    className="trail-tree"
                    src={ART[TREES[(i + CHAPTER[r.id]) % TREES.length]]}
                    alt=""
                    aria-hidden
                    style={{ top: 40 + i * ROW + 70, left: `calc(50% + ${-pts[i].x * 1.9}px)` }}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}

      {guide && <Guide region={guide} onClose={() => setGuide(null)} />}
      {lesson && (
        <Lesson
          quest={lesson}
          onExit={() => setLesson(null)}
          onInvest={() => {
            setLesson(null)
            go('invest')
          }}
        />
      )}
    </div>
  )
}

// 장별 개념 노트
function Guide({ region, onClose }: { region: string; onClose: () => void }) {
  const r = REGIONS.find((x) => x.id === region)!
  const qs = QUESTS.filter((q) => q.region === region)
  return (
    <Page title={`${r.name} 개념 노트`} sub="이 장에서 배우는 것" onExit={onClose}>
      {qs.map((q) => (
        <section key={q.id} className="note-card card">
          <small>{q.title}</small>
          <h3>{q.card ? q.card.title : '투자와 도박을 가르는 질문'}</h3>
          <ul>
            {(q.card
              ? q.card.points
              : ['근거를 직접 확인했나, 남의 말만 들었나?', '잃어도 괜찮은 만큼인가, 전부를 걸었나?', '손해를 본 뒤 만회하려고 더 키우지 않았나?', '이유를 적고 나중에 돌아봤나?']
            ).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      ))}
    </Page>
  )
}
