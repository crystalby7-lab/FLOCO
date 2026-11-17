// 커리큘럼 레슨: 개념 카드 → 문제(OX·고르기·순서·나누기·숫자·서술형) → 결과.
// 틀린 문제(서술형 제외)는 끝에 한 번 더 나온다. 점수는 처음 푼 결과로 매긴다.
import { useMemo, useState } from 'react'
import { actions, useGame } from '../store'
import { Page } from '../components/Page'
import { ART } from '../components/CatView'
import { qsFor, type LessonDef, type Q, type Track } from '../data/curriculum'

const shuffle = <T,>(a: T[], seed: number) => {
  const r = [...a]
  let x = seed
  for (let i = r.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280
    const j = Math.floor((x / 233280) * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

type Item = { q: Q; retry: boolean; n: number }

export function LessonPlay({ lesson, chapterTitle, onExit }: { lesson: LessonDef; chapterTitle: string; onExit: () => void }) {
  const s = useGame()
  const track: Track = s.learn.track
  const base = useMemo(() => qsFor(lesson, track), [lesson, track])
  const [queue, setQueue] = useState<Item[]>(() => base.map((q, n) => ({ q, retry: false, n })))
  const [i, setI] = useState(-1) // -1 = 개념 카드
  const [checked, setChecked] = useState<null | boolean>(null)
  const [firstRight, setFirstRight] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<null | { coins: number; chapterDone: boolean; built: string | null }>(null)
  // 답 상태
  const [pick, setPick] = useState<number | null>(null)
  const [ox, setOx] = useState<boolean | null>(null)
  const [order, setOrder] = useState<number[]>([])
  const [bins, setBins] = useState<Record<number, 0 | 1>>({})
  const [num, setNum] = useState('')
  const [text, setText] = useState('')

  const cur = i >= 0 ? queue[i] : null
  const q = cur?.q
  const reset = () => {
    setPick(null)
    setOx(null)
    setOrder([])
    setBins({})
    setNum('')
    setText('')
    setChecked(null)
  }
  const shuffled = useMemo(() => (q && q.k === 'order' ? shuffle(q.items.map((_, k) => k), i + 7) : []), [q, i])

  const ready =
    !q ? true : q.k === 'ox' ? ox !== null : q.k === 'pick' ? pick !== null : q.k === 'order' ? order.length === q.items.length : q.k === 'sort' ? Object.keys(bins).length === q.items.length : q.k === 'num' ? num.trim() !== '' : text.trim().length >= 4

  const judge = (): boolean => {
    if (!q) return true
    switch (q.k) {
      case 'ox':
        return ox === q.a
      case 'pick':
        return pick === q.a
      case 'order':
        return order.every((v, k) => v === k)
      case 'sort':
        return q.items.every(([, b], k) => bins[k] === b)
      case 'num':
        return Number(num.replace(/[,\s원%]/g, '')) === q.a
      case 'write':
        return q.keys.some((k) => text.includes(k))
    }
  }

  const check = () => {
    const ok = judge()
    setChecked(ok)
    if (ok && cur && !cur.retry) setFirstRight((st) => new Set(st).add(cur.n))
    if (!ok && cur && !cur.retry && q?.k !== 'write') setQueue((qq) => [...qq, { ...cur, retry: true }])
  }

  const next = () => {
    if (i + 1 < queue.length) {
      setI(i + 1)
      reset()
    } else {
      setResult(actions.completeLesson(lesson.id, firstRight.size, base.length))
    }
  }

  const progress = result ? 1 : Math.max(0, i + (checked !== null ? 1 : 0)) / (queue.length || 1)

  return (
    <Page title={lesson.title} sub={chapterTitle} onExit={onExit} confirm={!result && i >= 0}>
      <div className="lp-bar">
        <i style={{ width: `${progress * 100}%` }} />
        <span className={`lp-track ${track}`}>{track === 'basic' ? 'Basic' : 'Advanced'}</span>
      </div>

      {result ? (
        <div className="lp-result">
          <img src={ART[firstRight.size === base.length ? 't_jump' : 't_happy']} alt="" />
          <h2>{firstRight.size === base.length ? '완벽해요!' : '레슨 완료!'}</h2>
          <p className="lp-score">
            {firstRight.size} / {base.length} 처음에 맞혔어요
          </p>
          {result.coins > 0 && <p className="lp-coins">코인 +{result.coins.toLocaleString()}{result.chapterDone ? ' · 챕터 완성 보너스' : ''}</p>}
          {result.built && <p className="lp-built">🏘️ 새 건물이 지어졌어요! 지도에서 확인해요</p>}
          {lesson.note && (
            <div className="lp-note">
              <small>내 노트에 적었어요</small>
              <p>{lesson.note}</p>
            </div>
          )}
          <button className="btn btn-primary btn-block" onClick={onExit}>
            계속
          </button>
        </div>
      ) : i === -1 ? (
        <div className="lp-card">
          <img className="lp-cat" src={ART.t_wave} alt="" />
          <h2>{lesson.title}</h2>
          <ul>
            {lesson.core?.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          {track === 'basic' && lesson.basic && (
            <div className="lp-box basic">
              <small>쉽게 보면</small>
              <p>{lesson.basic}</p>
            </div>
          )}
          {track === 'adv' && lesson.adv && (
            <div className="lp-box adv">
              <small>더 깊이</small>
              <p>{lesson.adv}</p>
            </div>
          )}
          <button className="btn btn-primary btn-block" onClick={() => setI(0)}>
            문제 풀기 · {base.length}문제
          </button>
        </div>
      ) : q ? (
        <div className="lp-q">
          {cur?.retry && <span className="lp-retry">다시 풀어 봐요</span>}
          <span className="lp-kind">{KIND[q.k]}</span>
          <h3>{q.q}</h3>

          {q.k === 'ox' && (
            <div className="lp-ox">
              {[true, false].map((v) => (
                <button key={String(v)} className={`${ox === v ? 'on' : ''} ${v ? 'o' : 'x'}`} disabled={checked !== null} onClick={() => setOx(v)}>
                  {v ? 'O' : 'X'}
                </button>
              ))}
            </div>
          )}

          {q.k === 'pick' && (
            <div className="lp-opts">
              {q.opts.map((o, k) => (
                <button key={o} className={`${pick === k ? 'on' : ''} ${checked !== null && k === q.a ? 'right' : ''}`} disabled={checked !== null} onClick={() => setPick(k)}>
                  {o}
                </button>
              ))}
            </div>
          )}

          {q.k === 'order' && (
            <>
              <ol className="lp-slots">
                {q.items.map((_, k) => (
                  <li key={k} className={order[k] !== undefined ? 'filled' : ''} onClick={() => checked === null && order[k] !== undefined && setOrder(order.filter((_, x) => x !== k))}>
                    <b>{k + 1}</b>
                    {order[k] !== undefined ? q.items[order[k]] : ''}
                  </li>
                ))}
              </ol>
              <div className="lp-chips">
                {shuffled
                  .filter((k) => !order.includes(k))
                  .map((k) => (
                    <button key={k} disabled={checked !== null} onClick={() => setOrder([...order, k])}>
                      {q.items[k]}
                    </button>
                  ))}
              </div>
              {checked === false && (
                <p className="lp-answer">
                  정답 순서: {q.items.map((t, k) => `${k + 1}. ${t}`).join('  ')}
                </p>
              )}
            </>
          )}

          {q.k === 'sort' && (
            <div className="lp-sort">
              <div className="lp-sort-head">
                <span>{q.bins[0]}</span>
                <span>{q.bins[1]}</span>
              </div>
              {q.items.map(([t, b], k) => (
                <div key={t} className={`lp-sort-row ${checked !== null ? (bins[k] === b ? 'right' : 'wrong') : ''}`}>
                  <button className={bins[k] === 0 ? 'on' : ''} disabled={checked !== null} onClick={() => setBins({ ...bins, [k]: 0 })}>
                    ‹
                  </button>
                  <span>{t}</span>
                  <button className={bins[k] === 1 ? 'on' : ''} disabled={checked !== null} onClick={() => setBins({ ...bins, [k]: 1 })}>
                    ›
                  </button>
                </div>
              ))}
            </div>
          )}

          {q.k === 'num' && (
            <label className="lp-num">
              <input inputMode="numeric" value={num} disabled={checked !== null} onChange={(e) => setNum(e.target.value)} placeholder="숫자만" />
              <span>{q.unit}</span>
            </label>
          )}

          {q.k === 'write' && <textarea className="lp-write" rows={3} maxLength={120} value={text} disabled={checked !== null} onChange={(e) => setText(e.target.value)} placeholder="내 말로 짧게 써 보세요" />}

          {checked !== null && (
            <div className={`lp-feedback ${checked ? 'good' : q.k === 'write' ? 'soft' : 'bad'}`}>
              <b>{checked ? '맞았어요!' : q.k === 'write' ? '예시 답과 비교해 봐요' : '아쉬워요'}</b>
              {q.k === 'write' && <p className="lp-sample">예시: {q.sample}</p>}
              {q.k === 'num' && !checked && <p className="lp-sample">정답: {q.a.toLocaleString()}{q.unit}</p>}
              <p>{q.why}</p>
            </div>
          )}

          <div className="lp-foot">
            {checked === null ? (
              <button className="btn btn-primary btn-block" disabled={!ready} onClick={check}>
                확인
              </button>
            ) : (
              <button className="btn btn-primary btn-block" onClick={next}>
                {i + 1 < queue.length ? '계속' : '결과 보기'}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </Page>
  )
}

const KIND: Record<Q['k'], string> = { ox: 'OX', pick: '골라요', order: '순서대로 눌러요', sort: '양쪽으로 나눠요', num: '계산해요', write: '써 봐요' }
