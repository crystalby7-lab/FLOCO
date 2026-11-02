// 퀘스트 지도 (F1·F2·F3): 지역 = 커리큘럼, 완료하면 다음 지역과 투자 도구 해금
import { useState } from 'react'
import { actions, questsDone, unlocked, useGame } from '../store'
import { QUESTS, REGIONS, TOOLS, type Quest } from '../data/quests'
import { Sheet } from '../components/ui'

export function MapScreen() {
  const s = useGame()
  const [open, setOpen] = useState<Quest | null>(null)
  const tools = unlocked(s)
  const villageDone = questsDone(s, 'village')

  const regionLocked = (id: string) => (id === 'forest' ? !villageDone : id === 'city' || id === 'port')

  return (
    <div className="screen">
      <header className="top">
        <div>
          <div className="eyebrow">플로월드</div>
          <h1>퀘스트 지도</h1>
        </div>
      </header>

      <div className="map">
        {REGIONS.map((r, i) => {
          const locked = regionLocked(r.id)
          const qs = QUESTS.filter((q) => q.region === r.id)
          const done = qs.filter((q) => s.quests[q.id]?.done).length
          return (
            <section key={r.id} className={`region region-${r.id} ${locked ? 'locked' : ''}`}>
              {i > 0 && <div className="path" aria-hidden />}
              <div className="region-head">
                <div>
                  <h2>
                    {locked ? '🔒 ' : ''}
                    {r.name}
                  </h2>
                  <p>{r.desc}</p>
                </div>
                {qs.length > 0 && (
                  <span className="region-count">
                    {done}/{qs.length}
                  </span>
                )}
              </div>
              {!locked && (
                <div className="quest-list">
                  {qs.map((q) => {
                    const rec = s.quests[q.id]
                    return (
                      <button key={q.id} className={`quest ${rec?.done ? 'done' : ''}`} onClick={() => setOpen(q)}>
                        <span className="quest-dot">{rec?.done ? '✓' : q.type === 'judge' ? '⚖' : '★'}</span>
                        <span className="quest-text">
                          <b>{q.title}</b>
                          <small>{q.summary}</small>
                        </span>
                        {q.unlocks && !rec?.done && <span className="tag">해금</span>}
                      </button>
                    )
                  })}
                </div>
              )}
              {r.id === 'forest' && locked && <p className="lock-note">기초 마을 퀘스트 3개를 완료하면 열려요.</p>}
            </section>
          )
        })}
      </div>

      <section className="card">
        <div className="card-title">🧰 해금한 투자 도구</div>
        {Object.entries(TOOLS).map(([id, t]) => (
          <div key={id} className={`tool ${tools.has(id) ? '' : 'off'}`}>
            <b>{tools.has(id) ? '✅' : '🔒'} {t.name}</b>
            <small>{t.desc}</small>
          </div>
        ))}
      </section>

      {open && <QuestPlay quest={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function QuestPlay({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  return (
    <Sheet title={quest.title} onClose={onClose}>
      {quest.type === 'learn' ? <LearnQuest quest={quest} onClose={onClose} /> : <JudgeQuest quest={quest} onClose={onClose} />}
    </Sheet>
  )
}

// F1: 개념 카드 1장 + 퀴즈 3문제
function LearnQuest({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  const [step, setStep] = useState(-1) // -1 = 개념 카드
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const quiz = quest.quiz!
  const finished = step >= quiz.length

  if (step === -1) {
    return (
      <div className="quest-body">
        <div className="concept">
          <div className="eyebrow">개념 카드</div>
          <h3>{quest.card!.title}</h3>
          <ul>
            {quest.card!.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <button className="btn primary" onClick={() => setStep(0)}>
          퀴즈 풀기 (3문제)
        </button>
      </div>
    )
  }

  if (finished) {
    const pass = score >= 2
    return (
      <div className="quest-body center">
        <div className="big-emoji">{pass ? '🎉' : '🤔'}</div>
        <h3>
          {score}/{quiz.length} 정답
        </h3>
        <p className="muted">{pass ? '퀘스트 완료!' : '2문제 이상 맞히면 완료돼요. 개념 카드를 다시 볼까요?'}</p>
        {pass ? (
          <button
            className="btn primary"
            onClick={() => {
              actions.completeQuest(quest.id, score)
              onClose()
            }}
          >
            완료하기
          </button>
        ) : (
          <button className="btn primary" onClick={() => { setStep(-1); setScore(0); setPicked(null) }}>
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
            <b>{picked === q.answer ? '정답! ' : '아쉬워요. '}</b>
            {q.why}
          </p>
          <button className="btn primary" onClick={() => { setPicked(null); setStep(step + 1) }}>
            다음
          </button>
        </>
      )}
    </div>
  )
}

// F2: 상황 카드 → 투자/도박 판단 + 이유 1줄 → 해설
function JudgeQuest({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  const list = quest.situations!
  const [i, setI] = useState(0)
  const [choice, setChoice] = useState<'invest' | 'gamble' | null>(null)
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  if (i >= list.length) {
    return (
      <div className="quest-body center">
        <div className="big-emoji">⚖️</div>
        <h3>
          {score}/{list.length} 판단 일치
        </h3>
        <p className="muted">판단과 이유를 써본 것 자체가 퀘스트 완료 조건이에요.</p>
        <button
          className="btn primary"
          onClick={() => {
            actions.completeQuest(quest.id, score)
            onClose()
          }}
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
          📊 투자
        </button>
        <button className={`option ${choice === 'gamble' ? 'picked' : ''}`} disabled={submitted} onClick={() => setChoice('gamble')}>
          🎲 도박
        </button>
      </div>
      <label className="small-label">
        왜 그렇게 판단했나요? (한 줄)
        <input value={reason} disabled={submitted} onChange={(e) => setReason(e.target.value)} maxLength={60} />
      </label>
      {!submitted ? (
        <button
          className="btn primary"
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
            className="btn primary"
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
