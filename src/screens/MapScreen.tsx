// 퀘스트 지도 (F1·F2·F3): 지역 = 커리큘럼, 완료하면 다음 지역과 투자 도구 해금
import { useState } from 'react'
import { actions, questsDone, RULES, unlocked, useGame } from '../store'
import { QUESTS, TOOLS, type Quest } from '../data/quests'
import { Sheet } from '../components/ui'
import { Lock } from '../components/Icons'
import { ART } from '../components/CatView'
import type { Tab } from '../App'

type Stop = { q: Quest; x: number; y: number; state: 'done' | 'now' | 'open' | 'locked' }

// 지도 위 정류장 위치 (지그재그 길)
const XS = [24, 72, 34, 76, 30, 68]

export function MapScreen({ go }: { go: (t: Tab) => void }) {
  const s = useGame()
  const g = s.guild!
  const [open, setOpen] = useState<Quest | null>(null)
  const tools = unlocked(s)
  const villageDone = questsDone(s, 'village')
  const regionLocked = (id: string) => (id === 'forest' ? !villageDone : id === 'city' || id === 'port')

  const playable = QUESTS.filter((q) => !regionLocked(q.region))
  const current = playable.find((q) => !s.quests[q.id]?.done)
  const total = QUESTS.length
  const doneN = QUESTS.filter((q) => s.quests[q.id]?.done).length

  const ROW = 104
  const stops: Stop[] = QUESTS.map((q, i) => ({
    q,
    x: XS[i % XS.length],
    y: 130 + i * ROW + (q.region === 'forest' ? 90 : 0),
    state: s.quests[q.id]?.done ? 'done' : regionLocked(q.region) ? 'locked' : q === current ? 'now' : 'open',
  }))
  const H = stops[stops.length - 1].y + 230
  const path = stops
    .map((st, i) => {
      if (i === 0) return `M ${st.x} ${st.y}`
      const p = stops[i - 1]
      const my = (p.y + st.y) / 2
      return `C ${p.x} ${my}, ${st.x} ${my}, ${st.x} ${st.y}`
    })
    .join(' ')
  const villageEnd = stops.filter((st) => st.q.region === 'village').pop()!.y + 70

  return (
    <div className="tab-panel">
      <header className="top">
        <div>
          <div className="eyebrow">플로월드 · {doneN}/{total} 완료</div>
          <h1>모험 지도</h1>
        </div>
      </header>

      <div className="map-progress">
        <div className="bar grow">
          <div style={{ width: `${(doneN / total) * 100}%` }} />
        </div>
        <span className="small sub">퀘스트마다 금고 +{RULES.questReward}G</span>
      </div>

      <div className="bleed">
        <div className="world" style={{ height: H }}>
          <div className="zone zone-village" style={{ top: 0, height: villageEnd }}>
            <span className="zone-name">기초 마을</span>
            <span className="zone-desc">저축·투자·도박은 뭐가 다를까</span>
            <i className="deco house" style={{ right: '8%', top: 40 }} />
            <i className="deco tree" style={{ left: '6%', top: villageEnd - 110 }} />
          </div>
          <div className={`zone zone-forest ${regionLocked('forest') ? 'locked' : ''}`} style={{ top: villageEnd, height: H - villageEnd - 150 }}>
            <span className="zone-name">{regionLocked('forest') && <Lock size={13} />} ETF 숲</span>
            <span className="zone-desc">{regionLocked('forest') ? '기초 마을을 다 돌면 길이 열려요' : '한 번에 여러 회사에 나눠 담기'}</span>
            <i className="deco tree" style={{ right: '7%', top: 60 }} />
            <i className="deco tree small" style={{ right: '16%', top: 120 }} />
            <i className="deco tree" style={{ left: '5%', top: 230 }} />
          </div>
          <div className="zone zone-later" style={{ top: H - 150, height: 150 }}>
            <div className="later">
              <span>
                <Lock size={12} /> 기업 도시
              </span>
              <small>재무제표 기초</small>
            </div>
            <div className="later">
              <span>
                <Lock size={12} /> 세계 항구
              </span>
              <small>환율·금리</small>
            </div>
          </div>

          <svg className="trail" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>
            <path d={path} />
          </svg>

          {stops.map((st, i) => (
            <button
              key={st.q.id}
              className={`stop ${st.state}`}
              style={{ left: `${st.x}%`, top: st.y }}
              disabled={st.state === 'locked'}
              onClick={() => setOpen(st.q)}
            >
              <span className="stop-dot">{st.state === 'done' ? <Check /> : st.state === 'locked' ? <Lock size={14} /> : i + 1}</span>
              <span className={`stop-label ${st.x > 50 ? 'left' : 'right'}`}>
                <b>{st.q.title}</b>
                <small>
                  {st.q.type === 'judge' ? '판단 퀘스트' : '개념 + 퀴즈 3문제'}
                  {st.q.unlocks && ' · 도구 해금'}
                </small>
              </span>
              {st.state === 'now' && <img className="stop-cat" src={ART.walk} alt="" />}
            </button>
          ))}
        </div>
      </div>

      <section className="card">
        <div className="card-title">모은 도구</div>
        {Object.entries(TOOLS).map(([id, t]) => (
          <div key={id} className={`tool ${tools.has(id) ? '' : 'off'}`}>
            <b>
              {!tools.has(id) && <Lock size={13} />} {t.name}
            </b>
            <small>{t.desc}</small>
          </div>
        ))}
      </section>

      {open && <QuestPlay quest={open} catName={g.cat.name} onClose={() => setOpen(null)} onInvest={() => go('invest')} />}
    </div>
  )
}

function QuestPlay({ quest, catName, onClose, onInvest }: { quest: Quest; catName: string; onClose: () => void; onInvest: () => void }) {
  const s = useGame()
  const [reward, setReward] = useState<{ score: number; total: number; first: boolean } | null>(null)
  const finish = (score: number, total: number) => {
    const first = !s.quests[quest.id]?.done
    actions.completeQuest(quest.id, score)
    setReward({ score, total, first })
  }
  const opensInvest = quest.id === 'v3'
  return (
    <Sheet title={quest.title} onClose={onClose}>
      {reward ? (
        <div className="quest-body center reward">
          <img className="reward-cat" src={ART.crown} alt="" />
          <div className="result-badge">퀘스트 완료!</div>
          <p className="sub">
            {reward.total}개 중 {reward.score}개 · {catName}가 뿌듯해해요
          </p>
          {reward.first && (
            <div className="reward-chips">
              <span className="pill pill-sky">금고 +{RULES.questReward}G</span>
              {quest.unlocks && <span className="pill pill-moss">ETF 비교 도구 해금</span>}
              {opensInvest && <span className="pill pill-moss">같이 투자 · ETF 숲 열림</span>}
            </div>
          )}
          {opensInvest ? (
            <button className="btn btn-primary btn-block" onClick={onInvest}>
              첫 제안 하러 가기
            </button>
          ) : (
            <button className="btn btn-primary btn-block" onClick={onClose}>
              지도로 돌아가기
            </button>
          )}
        </div>
      ) : quest.type === 'learn' ? (
        <LearnQuest quest={quest} onFinish={finish} />
      ) : (
        <JudgeQuest quest={quest} onFinish={finish} />
      )}
    </Sheet>
  )
}

// F1: 개념 카드 1장 + 퀴즈 3문제
function LearnQuest({ quest, onFinish }: { quest: Quest; onFinish: (score: number, total: number) => void }) {
  const [step, setStep] = useState(-1) // -1 = 개념 카드
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const quiz = quest.quiz!
  const finished = step >= quiz.length

  if (step === -1) {
    return (
      <div className="quest-body">
        <div className="concept">
          <div className="eyebrow">알아두기</div>
          <h3>{quest.card!.title}</h3>
          <ul>
            {quest.card!.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <button className="btn btn-primary btn-block" onClick={() => setStep(0)}>
          퀴즈 풀러 가기
        </button>
      </div>
    )
  }

  if (finished) {
    const pass = score >= 2
    return (
      <div className="quest-body center">
        <img className="reward-face" src={pass ? ART.face_happy : ART.face_sad} alt="" />
        <div className="result-badge">{pass ? '잘했어요!' : '조금만 더'}</div>
        <h3>
          {score}/{quiz.length} 정답
        </h3>
        <p className="muted">{pass ? '퀘스트 완료!' : '2개 이상 맞히면 통과예요. 카드 한 번 더 볼까요?'}</p>
        {pass ? (
          <button
            className="btn btn-primary btn-block"
            onClick={() => onFinish(score, quiz.length)}
          >
            완료하기
          </button>
        ) : (
          <button className="btn btn-primary btn-block" onClick={() => { setStep(-1); setScore(0); setPicked(null) }}>
            다시 하기
          </button>
        )}
      </div>
    )
  }

  const q = quiz[step]
  return (
    <div className="quest-body">
      <div className="progress-dots">
        {quiz.map((_, i) => (
          <span key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>
      <h3 className="q">{q.q}</h3>
      <div className="options">
        {q.options.map((o, i) => {
          const state = picked === null ? '' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'dim'
          return (
            <button
              key={o}
              className={`option ${state}`}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i)
                if (i === q.answer) setScore((x) => x + 1)
              }}
            >
              {o}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <>
          <p className={`explain ${picked === q.answer ? 'ok' : 'no'}`}>
            <b>{picked === q.answer ? '정답! ' : '아쉽다! '}</b>
            {q.why}
          </p>
          <button className="btn btn-primary btn-block" onClick={() => { setPicked(null); setStep(step + 1) }}>
            다음
          </button>
        </>
      )}
    </div>
  )
}

// F2: 상황 카드 → 투자/도박 판단 + 이유 1줄 → 해설
function JudgeQuest({ quest, onFinish }: { quest: Quest; onFinish: (score: number, total: number) => void }) {
  const list = quest.situations!
  const [i, setI] = useState(0)
  const [choice, setChoice] = useState<'invest' | 'gamble' | null>(null)
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  if (i >= list.length) {
    return (
      <div className="quest-body center">
        <img className="reward-face" src={ART.face_happy} alt="" />
        <div className="result-badge">끝!</div>
        <h3>
          {score}/{list.length} 판단 일치
        </h3>
        <p className="muted">맞고 틀린 것보다, 이유를 써본 게 중요해요</p>
        <button
          className="btn btn-primary btn-block"
          onClick={() => onFinish(score, list.length)}
        >
          완료하기
        </button>
      </div>
    )
  }

  const sit = list[i]
  return (
    <div className="quest-body">
      <div className="progress-dots">
        {list.map((_, k) => (
          <span key={k} className={k <= i ? 'on' : ''} />
        ))}
      </div>
      <div className="situation">{sit.text}</div>
      <div className="row gap">
        <button className={`option ${choice === 'invest' ? 'picked' : ''}`} disabled={submitted} onClick={() => setChoice('invest')}>
          투자 같아
        </button>
        <button className={`option ${choice === 'gamble' ? 'picked' : ''}`} disabled={submitted} onClick={() => setChoice('gamble')}>
          도박 같아
        </button>
      </div>
      <label className="small-label">
        왜 그렇게 생각했어? (한 줄)
        <input value={reason} disabled={submitted} onChange={(e) => setReason(e.target.value)} maxLength={60} />
      </label>
      {!submitted ? (
        <button
          className="btn btn-primary btn-block"
          disabled={!choice || reason.trim().length < 5}
          onClick={() => {
            setSubmitted(true)
            if (choice === sit.answer) setScore((x) => x + 1)
          }}
        >
          제출
        </button>
      ) : (
        <>
          <p className={`explain ${choice === sit.answer ? 'ok' : 'no'}`}>
            <b>{sit.answer === 'invest' ? '투자에 가까워요. ' : '도박에 가까워요. '}</b>
            {sit.why}
          </p>
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              setI(i + 1)
              setChoice(null)
              setReason('')
              setSubmitted(false)
            }}
          >
            다음
          </button>
        </>
      )}
    </div>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5 L6.5 12 L13 4.5" />
    </svg>
  )
}
