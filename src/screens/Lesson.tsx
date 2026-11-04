// 레슨 화면: 개념 → 문제 하나씩 → [확인] → 정답/오답 패널 → [계속] → 결과
// 개념+퀴즈(learn)와 투자/도박 판단(judge) 두 종류를 같은 틀로 진행한다.
import { useEffect, useMemo, useState } from 'react'
import { actions, RULES, useGame } from '../store'
import type { Quest } from '../data/quests'
import { ART } from '../components/CatView'
import { ConfirmDialog } from '../components/Page'
import { ChartUp, Close, Dice } from '../components/Icons'

type Step =
  | { kind: 'concept' }
  | { kind: 'quiz'; i: number }
  | { kind: 'judge'; i: number }

type Phase = 'play' | 'fail' | 'done'

export function Lesson({ quest, onExit, onInvest }: { quest: Quest; onExit: () => void; onInvest: () => void }) {
  const s = useGame()
  const g = s.guild!
  const steps: Step[] = useMemo(
    () =>
      quest.type === 'learn'
        ? [{ kind: 'concept' }, ...quest.quiz!.map((_, i) => ({ kind: 'quiz' as const, i }))]
        : quest.situations!.map((_, i) => ({ kind: 'judge' as const, i })),
    [quest],
  )
  const total = steps.filter((x) => x.kind !== 'concept').length

  const [idx, setIdx] = useState(0)
  const [pick, setPick] = useState<number | null>(null) // quiz 선택
  const [judge, setJudge] = useState<'invest' | 'gamble' | null>(null)
  const [reason, setReason] = useState('')
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<Phase>('play')
  const [asking, setAsking] = useState(false)
  const [started] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [first, setFirst] = useState(false)

  const step = steps[idx]
  const progress = phase === 'play' ? (idx + (checked ? 1 : 0)) / steps.length : 1

  // 정답 여부
  const correct =
    step?.kind === 'quiz' ? pick === quest.quiz![step.i].answer : step?.kind === 'judge' ? judge === quest.situations![step.i].answer : true

  const canCheck = step?.kind === 'quiz' ? pick !== null : step?.kind === 'judge' ? judge !== null && reason.trim().length >= 5 : true

  const check = () => {
    setChecked(true)
    if (correct) setScore((x) => x + 1)
  }

  const next = () => {
    if (idx + 1 < steps.length) {
      setIdx(idx + 1)
      setPick(null)
      setJudge(null)
      setReason('')
      setChecked(false)
      return
    }
    const finalScore = score
    // 개념+퀴즈는 2개 이상 맞혀야 통과, 판단 퀘스트는 끝까지 하면 통과
    if (quest.type === 'learn' && finalScore < 2) return setPhase('fail')
    setFirst(!s.quests[quest.id]?.done)
    actions.completeQuest(quest.id, finalScore)
    setElapsed(Math.round((Date.now() - started) / 1000))
    setPhase('done')
  }

  const retry = () => {
    setIdx(0)
    setPick(null)
    setJudge(null)
    setReason('')
    setChecked(false)
    setScore(0)
    setPhase('play')
  }

  // 키보드: 1~4로 고르기, Enter로 확인/계속
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'play' || asking) return
      if (step?.kind === 'quiz' && !checked) {
        const n = Number(e.key)
        if (n >= 1 && n <= quest.quiz![step.i].options.length) setPick(n - 1)
      }
      if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        if (step?.kind === 'concept' || checked) next()
        else if (canCheck) check()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ── 결과 화면 ──
  if (phase === 'done' || phase === 'fail') {
    const acc = Math.round((score / total) * 100)
    const mm = Math.floor(elapsed / 60)
    const ss = String(elapsed % 60).padStart(2, '0')
    const done = phase === 'done'
    return (
      <div className="lesson">
        <div className="ls-result">
          <div className={`reward-sticker ${done ? '' : 'gray'}`}>
            <img src={done ? ART.crown : ART.blanket} alt="" />
          </div>
          <h1 className="hand">{done ? '스티커를 받았어요!' : '이번 장은 다시 써볼까요?'}</h1>
          <p className="ls-result-sub">{done ? `탐험 일지에 붙여둘게요 · ${g.cat.name}가 뿌듯해해요` : `${total}문제 중 2문제 이상 맞히면 스티커를 받아요`}</p>
          <ul className="receipt">
            <li>
              <span>금고</span>
              <i />
              <b className="gold-ink">{done && first ? `+${RULES.questReward}G` : '+0G'}</b>
            </li>
            <li>
              <span>맞힌 문제</span>
              <i />
              <b>
                {score}/{total} ({acc}%)
              </b>
            </li>
            <li>
              <span>걸린 시간</span>
              <i />
              <b>{done ? `${mm}분 ${ss}초` : '-'}</b>
            </li>
          </ul>
          {done && first && quest.unlocks && <p className="ls-unlock hand">ETF 비교 도구가 열렸어요</p>}
          {done && first && quest.id === 'v3' && <p className="ls-unlock hand">같이 투자 · ETF 숲이 열렸어요</p>}
        </div>
        <div className="ls-foot plain">
          {done ? (
            quest.id === 'v3' && first ? (
              <button className="btn btn-primary btn-block" onClick={onInvest}>
                첫 제안 하러 가기
              </button>
            ) : (
              <button className="btn btn-primary btn-block" onClick={onExit}>
                계속
              </button>
            )
          ) : (
            <>
              <button className="btn btn-primary btn-block" onClick={retry}>
                다시 도전
              </button>
              <button className="btn btn-ghost btn-block" onClick={onExit}>
                지도로 돌아가기
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── 진행 화면 ──
  return (
    <div className="lesson">
      <header className="ls-top">
        <button className="ls-x" aria-label="나가기" onClick={() => setAsking(true)}>
          <Close />
        </button>
        <div className="ls-bar">
          <div style={{ width: `${Math.max(4, progress * 100)}%` }} />
        </div>
        <span className="ls-page hand">
          {idx + 1}/{steps.length}쪽
        </span>
      </header>

      <main className="ls-body paper-page" key={idx}>
        {checked && correct && <div className="stamp-good hand" aria-hidden>참<br />잘했어요</div>}
        {step.kind === 'concept' && (
          <>
            <p className="ls-kicker hand">오늘의 개념 노트</p>
            <div className="ls-teacher">
              <img src={ART.sit} alt="" />
              <div className="ls-bubble">{quest.card!.title}</div>
            </div>
            <ul className="ls-points">
              {quest.card!.points.map((pt, i) => {
                const [head, ...rest] = pt.split(':')
                return (
                  <li key={i}>
                    <span className="ls-num">{i + 1}</span>
                    <p>{rest.length ? <><b>{head}</b>{rest.join(':')}</> : pt}</p>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        {step.kind === 'quiz' && (
          <>
            <p className="ls-kicker hand">알맞은 답에 형광펜을 칠해요</p>
            <div className="ls-teacher small">
              <img src={ART.face_calm} alt="" />
              <div className="ls-bubble">{quest.quiz![step.i].q}</div>
            </div>
            <div className="ls-options">
              {quest.quiz![step.i].options.map((o, i) => {
                const st = !checked ? (pick === i ? 'sel' : '') : i === quest.quiz![step.i].answer ? 'right' : pick === i ? 'wrong' : 'dim'
                return (
                  <button key={o} className={`ls-opt ${st}`} disabled={checked} onClick={() => setPick(i)}>
                    <span className="ls-key">{i + 1}</span>
                    <span>{o}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step.kind === 'judge' && (
          <>
            <p className="ls-kicker hand">투자일까, 도박일까?</p>
            <div className="ls-story">{quest.situations![step.i].text}</div>
            <div className="ls-pair">
              {(
                [
                  ['invest', '투자', <ChartUp key="c" />],
                  ['gamble', '도박', <Dice key="d" />],
                ] as const
              ).map(([id, label, icon]) => {
                const ans = quest.situations![step.i].answer
                const st = !checked ? (judge === id ? 'sel' : '') : id === ans ? 'right' : judge === id ? 'wrong' : 'dim'
                return (
                  <button key={id} className={`ls-card ${st}`} disabled={checked} onClick={() => setJudge(id)}>
                    {icon}
                    <b>{label}</b>
                  </button>
                )
              })}
            </div>
            <label className="ls-reason">
              왜 그렇게 생각했어요?
              <input id="judge-reason" value={reason} disabled={checked} maxLength={60} onChange={(e) => setReason(e.target.value)} placeholder="한 줄로 (5자 이상)" />
            </label>
          </>
        )}
      </main>

      {/* 아래 버튼 / 정답·오답 패널 */}
      {step.kind === 'concept' ? (
        <div className="ls-foot">
          <button className="btn btn-primary btn-block" onClick={next}>
            다 읽었어요
          </button>
        </div>
      ) : !checked ? (
        <div className="ls-foot">
          <button className="btn btn-primary btn-block" disabled={!canCheck} onClick={check}>
            확인
          </button>
        </div>
      ) : (
        <div className={`ls-foot feedback ${correct ? 'good' : 'bad'}`}>
          <span className="tape" aria-hidden />
          <div className="fb-head">
            <img src={correct ? ART.face_happy : ART.face_sad} alt="" />
            <div>
              <b className="hand">{correct ? pickPraise(idx) : '여기 다시 보자'}</b>
              {!correct && step.kind === 'quiz' && <span className="fb-ans">정답: {quest.quiz![step.i].options[quest.quiz![step.i].answer]}</span>}
              {!correct && step.kind === 'judge' && (
                <span className="fb-ans">{quest.situations![step.i].answer === 'invest' ? '투자에 가까워요' : '도박에 가까워요'}</span>
              )}
            </div>
          </div>
          <p className="fb-why">{step.kind === 'quiz' ? quest.quiz![step.i].why : quest.situations![step.i].why}</p>
          <button className="btn btn-primary btn-block" onClick={next}>
            {correct ? '다음 쪽' : '알겠어요'}
          </button>
        </div>
      )}

      {asking && (
        <ConfirmDialog
          title="정말 종료하시겠습니까?"
          message="기록이 안 남습니다."
          ok="종료하기"
          cancel="계속하기"
          onOk={onExit}
          onCancel={() => setAsking(false)}
        />
      )}
    </div>
  )
}

const PRAISE = ['맞았어요!', '좋아요, 정확해요!', '바로 그거예요!', '훌륭해요!']
const pickPraise = (i: number) => PRAISE[i % PRAISE.length]
