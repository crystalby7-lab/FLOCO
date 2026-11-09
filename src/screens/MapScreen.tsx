// 플로월드: 마을 한 장 위에 빈 땅 10곳. 퀘스트(단원)를 끝내면 그 땅에 상점이 지어지고,
// 지어진 상점을 누르면 안으로 들어가 꾸민다. 고양이는 지금 지을 땅 옆에서 기다린다.
import { useCallback, useEffect, useRef, useState } from 'react'
import { questsDone, useGame } from '../store'
import { QUESTS, REGIONS, type Quest } from '../data/quests'
import { SHOPS, VILLAGE } from '../data/world'
import { ShopInterior } from './ShopInterior'
import { Page } from '../components/Page'
import { WorldIntro } from '../components/WorldIntro'
import { Book, Lock } from '../components/Icons'
import { ART } from '../components/CatView'
import { Lesson } from './Lesson'
import type { Tab } from '../App'

const CHAPTER = { village: 1, market: 2, forest: 3, risk: 4, reason: 5, review: 6, deep: 7 } as const
type NodeState = 'done' | 'now' | 'open' | 'locked'

export function MapScreen({ go }: { go: (t: Tab) => void }) {
  const s = useGame()
  const [lesson, setLesson] = useState<Quest | null>(null)
  const [popup, setPopup] = useState<string | null>(null)
  const [guide, setGuide] = useState<string | null>(null)
  const [intro, setIntro] = useState(true)
  const [shopOpen, setShopOpen] = useState<string | null>(null)
  // 순서대로 열린다: 기초 마을 → 시장 거리 → ETF 숲, 나머지는 준비 중
  const locked = (r: string) => (r === 'village' ? false : r === 'market' ? !questsDone(s, 'village') : r === 'forest' ? !questsDone(s, 'market') : true)
  const current = QUESTS.find((q) => !locked(q.region) && !s.quests[q.id]?.done)
  const doneN = QUESTS.filter((q) => s.quests[q.id]?.done).length
  const nowRef = useRef<HTMLDivElement>(null)
  const curRegion = REGIONS.find((r) => r.id === (current?.region ?? 'village'))
  const endIntro = useCallback(() => setIntro(false), [])

  useEffect(() => {
    nowRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  const stateOf = (q: Quest): NodeState => (s.quests[q.id]?.done ? 'done' : locked(q.region) ? 'locked' : q === current ? 'now' : 'open')

  return (
    <div className="tab-panel live path-panel" onClick={() => setPopup(null)}>
      <header className="wh">
        <div className="wh-sign">
          <span className="wh-ch">CHAPTER {curRegion ? CHAPTER[curRegion.id as keyof typeof CHAPTER] : 1}</span>
          <h1>FLOWORLD</h1>
          <span className="wh-region">{curRegion?.name ?? '기초 마을'}</span>
        </div>
        <div className="wh-hud">
          <img src={ART.t_shop} alt="" />
          <div className="wh-bar">
            <i style={{ width: `${(doneN / QUESTS.length) * 100}%` }} />
          </div>
          <b>
            {doneN}/{QUESTS.length}
          </b>
        </div>
        <button className="tag-btn" onClick={() => setGuide(current?.region ?? 'village')}>
          <Book size={16} />
          개념 노트
        </button>
      </header>
      {intro && <WorldIntro chapter={curRegion ? CHAPTER[curRegion.id as keyof typeof CHAPTER] : 1} region={curRegion?.name ?? '기초 마을'} onDone={endIntro} />}

      <div className="vl" style={{ backgroundImage: `url(${VILLAGE})` }}>
        {SHOPS.map((shop, qi) => {
          const q = QUESTS[qi]
          if (!q) return null
          const st = stateOf(q)
          const open = popup === q.id
          return (
            <div key={shop.id} className={`vl-lot ${st} ${open ? 'open' : ''} ${shop.lot.y > 68 ? 'pop-up' : ''} ${shop.lot.x > 70 ? 'pop-r' : shop.lot.x < 30 ? 'pop-l' : ''}`} style={{ left: `${shop.lot.x}%`, top: `${shop.lot.y}%` }} ref={st === 'now' ? nowRef : undefined}>
              <button
                className="vl-hit"
                aria-label={`${shop.name} · ${q.title}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (st === 'locked') {
                    setPopup('locked:' + q.id)
                    return
                  }
                  setPopup(open ? null : q.id)
                }}
              >
                {st === 'done' ? (
                  <img className="vl-bld" src={ART[shop.building]} alt="" />
                ) : (
                  <span className={`vl-mark ${st}`}>{st === 'locked' ? <Lock size={14} /> : qi + 1}</span>
                )}
                {st === 'now' && <span className="pulse" aria-hidden />}
              </button>
              <span className="vl-name">{st === 'done' || st === 'now' ? shop.name : ''}</span>
              {st === 'now' && (
                <span className="vl-cat" aria-hidden>
                  <img src={ART.sit} alt="" />
                </span>
              )}
              {popup === 'locked:' + q.id && <div className="vl-pop small" onClick={(e) => e.stopPropagation()}>앞 가게를 먼저 지어야 열려요</div>}
              {open && (
                <div className="vl-pop" onClick={(e) => e.stopPropagation()}>
                  <small>
                    {qi + 1}. {shop.name}
                  </small>
                  <b>{q.title}</b>
                  <small className="sub">{q.type === 'judge' ? '판단 퀘스트 · 상황 4개' : q.type === 'mission' ? '앱에서 직접 해보기' : '개념 노트 + 퀴즈'}</small>
                  {q.mission && st !== 'done' && (
                    <ol className="mission-steps">
                      {q.mission.steps.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ol>
                  )}
                  {st === 'done' ? (
                    <>
                      <button
                        className="btn btn-primary btn-block"
                        onClick={() => {
                          setPopup(null)
                          setShopOpen(shop.id)
                        }}
                      >
                        가게 들어가서 꾸미기
                      </button>
                      {q.type !== 'mission' && (
                        <button
                          className="btn btn-ghost btn-block"
                          onClick={() => {
                            setPopup(null)
                            setLesson(q)
                          }}
                        >
                          다시 배우기
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => {
                        setPopup(null)
                        if (q.type === 'mission') go('invest')
                        else setLesson(q)
                      }}
                    >
                      {q.type === 'mission' ? '투자 탭으로 가기' : `배우고 ${shop.name} 짓기`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {guide && <Guide region={guide} onClose={() => setGuide(null)} />}
      {shopOpen && <ShopInterior shop={SHOPS.find((x) => x.id === shopOpen)!} onExit={() => setShopOpen(null)} />}
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
      {qs.filter((q) => q.type !== 'mission').map((q) => (
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
