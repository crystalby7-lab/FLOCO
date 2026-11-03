// 학습 길 (F1·F2·F3): 단원 = 지역, 정류장 = 퀘스트. 끝내면 다음 정류장·단원과 투자 도구가 열린다.
import { useEffect, useRef, useState } from 'react'
import { questsDone, RULES, unlocked, useGame } from '../store'
import { QUESTS, REGIONS, TOOLS, type Quest } from '../data/quests'
import { Page } from '../components/Page'
import { Book, CheckBold, Lock, Star } from '../components/Icons'
import { ART } from '../components/CatView'
import { Lesson } from './Lesson'
import type { Tab } from '../App'

// 단원마다 색 (배너·정류장)
const UNIT = {
  village: { no: 1, color: 'blue' },
  forest: { no: 2, color: 'green' },
  city: { no: 3, color: 'purple' },
  port: { no: 4, color: 'teal' },
} as const

// 지그재그 위치 (가운데 기준 px)
const OFFSETS = [0, 52, 78, 52, 0, -52, -78, -52]
const CAT_SPOT = ['walk', 'side', 'stretch', 'lielook']

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

  let n = 0 // 전체 순번 (지그재그용)

  return (
    <div className="tab-panel path-panel" onClick={() => setPopup(null)}>
      <header className="path-top">
        <div>
          <div className="eyebrow">플로월드 학습 길</div>
          <h1>
            {doneN}/{QUESTS.length} 퀘스트
          </h1>
        </div>
        <div className="path-tools">
          {Object.entries(TOOLS).map(([id, t]) => (
            <span key={id} className={`tool-chip ${tools.has(id) ? 'on' : ''}`} title={t.desc}>
              {!tools.has(id) && <Lock size={11} />}
              {t.name}
            </span>
          ))}
        </div>
      </header>

      {REGIONS.map((r) => {
        const qs = QUESTS.filter((q) => q.region === r.id)
        const u = UNIT[r.id]
        const isLocked = locked(r.id)
        const done = qs.filter((q) => s.quests[q.id]?.done).length
        return (
          <section key={r.id} className={`unit unit-${u.color} ${isLocked ? 'locked' : ''}`}>
            <div className="unit-banner">
              <div>
                <small>
                  {u.no}단원{qs.length ? ` · ${done}/${qs.length}` : ''}
                </small>
                <h2>{r.name}</h2>
                <p>{isLocked && r.id === 'forest' ? '기초 마을을 끝내면 열려요' : r.desc}</p>
              </div>
              {qs.length > 0 ? (
                <button
                  className="unit-guide"
                  disabled={isLocked}
                  onClick={(e) => {
                    e.stopPropagation()
                    setGuide(r.id)
                  }}
                >
                  <Book />
                  <span>개념 노트</span>
                </button>
              ) : (
                <span className="unit-soon">
                  <Lock size={14} /> 준비 중
                </span>
              )}
            </div>

            {qs.length > 0 && (
              <div className="trail-nodes">
                {qs.map((q, i) => {
                  const st = stateOf(q)
                  const off = OFFSETS[n++ % OFFSETS.length]
                  const open = popup === q.id
                  return (
                    <div key={q.id} className={`node-row ${open ? 'open' : ''}`} style={{ transform: `translateX(${off}px)` }} ref={st === 'now' ? nowRef : undefined}>
                      {st === 'now' && <span className="node-start">시작</span>}
                      <button
                        className={`node ${st}`}
                        disabled={st === 'locked'}
                        aria-label={q.title}
                        onClick={(e) => {
                          e.stopPropagation()
                          setPopup(open ? null : q.id)
                        }}
                      >
                        <span className="node-face">
                          {st === 'done' ? <CheckBold size={30} /> : st === 'locked' ? <Lock size={24} /> : <Star size={30} />}
                        </span>
                      </button>
                      {i === 1 && <img className="trail-cat" src={ART[CAT_SPOT[r.id === 'village' ? 0 : 2]]} alt="" style={{ [off > 0 ? 'right' : 'left']: off > 0 ? '96px' : '96px' }} />}
                      {open && (
                        <div className={`node-pop ${st}`} onClick={(e) => e.stopPropagation()}>
                          <b>{q.title}</b>
                          <small>
                            {q.type === 'judge' ? '판단 퀘스트 · 상황 4개' : '개념 + 퀴즈 3문제'}
                            {q.unlocks ? ' · 도구 해금' : ''}
                          </small>
                          <button
                            className="btn btn-block pop-btn"
                            onClick={() => {
                              setPopup(null)
                              setLesson(q)
                            }}
                          >
                            {st === 'done' ? '다시 하기' : `시작하기 · +${RULES.questReward}G`}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
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

// 단원 개념 노트: 그 단원에서 배우는 개념 카드 모음
function Guide({ region, onClose }: { region: string; onClose: () => void }) {
  const r = REGIONS.find((x) => x.id === region)!
  const qs = QUESTS.filter((q) => q.region === region)
  return (
    <Page title={`${r.name} 개념 노트`} sub="이 단원에서 배우는 것" onExit={onClose}>
      {qs.map((q) =>
        q.card ? (
          <section key={q.id} className="note-card">
            <small>{q.title}</small>
            <h3>{q.card.title}</h3>
            <ul>
              {q.card.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        ) : (
          <section key={q.id} className="note-card">
            <small>{q.title}</small>
            <h3>투자와 도박을 가르는 질문</h3>
            <ul>
              <li>근거를 직접 확인했나, 남의 말만 들었나?</li>
              <li>잃어도 괜찮은 만큼인가, 전부를 걸었나?</li>
              <li>손해를 본 뒤 만회하려고 더 키우지 않았나?</li>
              <li>이유를 적고 나중에 돌아봤나?</li>
            </ul>
          </section>
        ),
      )}
    </Page>
  )
}
