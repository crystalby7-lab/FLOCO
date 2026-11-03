// 처음 설문: 한 화면에 한 질문 → 마지막에 시작 타입
// 처음 들어올 때와 설정 > '내 답변 다시 하기'에서 같이 쓴다.
import { useState } from 'react'
import type { Survey as SurveyT } from '../types'
import { QUESTIONS, typeOf, type Question } from '../data/survey'
import { ART } from '../components/CatView'

type Answers = Partial<Record<Question['key'], string | string[]>>

export function Survey({ initial, onDone, onCancel }: { initial?: SurveyT; onDone: (s: SurveyT) => void; onCancel?: () => void }) {
  const [i, setI] = useState(0)
  const [a, setA] = useState<Answers>(() => (initial ? { ...initial } : {}))
  const [etc, setEtc] = useState(initial?.sourceEtc ?? '')
  const [result, setResult] = useState<SurveyT | null>(null)

  if (result) {
    const t = typeOf(result)
    return (
      <div className="survey">
        <div className="sv-result">
          <img className="sv-result-art" src={ART[t.art]} alt="" />
          <small className="sv-eyebrow">나의 시작 타입</small>
          <h1>{t.name}</h1>
          <p className="sv-desc">{t.desc}</p>
          <div className="sv-start">
            <small>추천 시작점</small>
            <b>{t.start}</b>
          </div>
          <p className="fineprint">이 답은 나만 볼 수 있고, 설정에서 언제든 다시 할 수 있어요.</p>
        </div>
        <button className="btn btn-primary btn-block" onClick={() => onDone(result)}>
          {initial ? '저장하기' : '길드 만들러 가기'}
        </button>
      </div>
    )
  }

  const q = QUESTIONS[i]
  const val = a[q.key]
  const picked = (id: string) => (q.kind === 'single' ? val === id : Array.isArray(val) && val.includes(id))
  const ready = q.kind === 'single' ? typeof val === 'string' && (val !== 'etc' || etc.trim().length > 0) : Array.isArray(val) && val.length > 0
  const last = i === QUESTIONS.length - 1

  const toggle = (id: string) => {
    if (q.kind === 'single') return setA({ ...a, [q.key]: id })
    const cur = Array.isArray(val) ? val : []
    let next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    if (q.none) next = id === q.none ? (cur.includes(id) ? [] : [id]) : next.filter((x) => x !== q.none)
    setA({ ...a, [q.key]: next })
  }

  const next = () => {
    if (!last) return setI(i + 1)
    setResult({
      experience: a.experience as string,
      image: a.image as string[],
      know: a.know as string[],
      pickBy: a.pickBy as string[],
      goals: a.goals as string[],
      source: a.source as string,
      sourceEtc: a.source === 'etc' ? etc.trim() : undefined,
      at: Date.now(),
    })
  }

  return (
    <div className="survey">
      <div className="sv-top">
        <button className="icon-btn" aria-label="이전" onClick={() => (i ? setI(i - 1) : onCancel?.())} disabled={!i && !onCancel}>
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 4 L6.5 10 L12.5 16" />
          </svg>
        </button>
        <div className="sv-progress">
          <div style={{ width: `${((i + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
        <span className="sv-count num">
          {i + 1}/{QUESTIONS.length}
        </span>
      </div>

      <div key={q.key} className="sv-q">
        <img className="sv-face" src={ART[q.face]} alt="" />
        <h1>{q.title}</h1>
        {q.help && <p className="sv-help">{q.help}</p>}
        <div className={`sv-options ${q.options.length > 5 && q.kind === 'multi' ? 'two' : ''}`}>
          {q.options.map((o) => (
            <button key={o.id} className={`sv-opt ${picked(o.id) ? 'on' : ''}`} onClick={() => toggle(o.id)}>
              <span className={`sv-mark ${q.kind}`}>
                {picked(o.id) && (
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8.5 L6.5 12 L13 4.5" />
                  </svg>
                )}
              </span>
              <span className="sv-text">
                <b>{o.label}</b>
                {o.sub && <small>{o.sub}</small>}
              </span>
            </button>
          ))}
        </div>
        {q.key === 'source' && val === 'etc' && (
          <input id="source-etc" className="sv-etc" value={etc} maxLength={30} onChange={(e) => setEtc(e.target.value)} placeholder="어디서 알게 됐는지 짧게" autoFocus />
        )}
      </div>

      <button className="btn btn-primary btn-block" disabled={!ready} onClick={next}>
        {last ? '결과 보기' : '다음'}
      </button>
    </div>
  )
}
