// 탭바 위에 사는 고양이: 탭을 바꾸면 그 탭까지 걸어가서 앉고, 한참 있으면 눕거나 잔다.
// 누르면 깡총 뛰고, 가끔 혼자 기지개를 켠다.
import { useEffect, useRef, useState } from 'react'
import { ART } from './CatView'

type P = 'walk' | 'sit' | 'lielook' | 'sleep' | 'stretch'
const H: Record<P, number> = { walk: 34, sit: 40, lielook: 30, sleep: 26, stretch: 32 }

export function TabCat({ index, count }: { index: number; count: number }) {
  const [x, setX] = useState(index)
  const [pose, setPose] = useState<P>('sit')
  const [flip, setFlip] = useState(false)
  const [dur, setDur] = useState(0)
  const [hop, setHop] = useState(false)
  const t = useRef<number[]>([])
  const first = useRef(true)

  const later = (ms: number, fn: () => void) => t.current.push(window.setTimeout(fn, ms))
  const clear = () => {
    t.current.forEach(clearTimeout)
    t.current = []
  }

  const idle = () => {
    later(5000, () => {
      setPose('lielook')
      later(9000, () => setPose('sleep'))
    })
  }

  useEffect(() => {
    if (first.current) {
      first.current = false
      idle()
      return clear
    }
    clear()
    const d = Math.abs(index - x)
    if (d === 0) return
    const sec = 0.45 + d * 0.38
    setFlip(index > x) // 걷는 그림은 왼쪽을 본다
    setDur(sec)
    setPose('walk')
    setX(index)
    later(sec * 1000, () => {
      setPose('sit')
      idle()
    })
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const tap = () => {
    if (pose === 'walk') return
    clear()
    setHop(true)
    setPose('stretch')
    later(450, () => setHop(false))
    later(1600, () => {
      setPose('sit')
      idle()
    })
  }

  return (
    <button
      className={`tab-cat ${hop ? 'hop' : ''} ${pose === 'walk' ? 'walking' : ''}`}
      style={{ left: `${((x + 0.5) / count) * 100}%`, transitionDuration: `${dur}s` }}
      onClick={tap}
      aria-label="고양이"
    >
      <img src={ART[pose]} alt="" style={{ height: H[pose], transform: flip ? 'scaleX(-1)' : undefined }} />
      {pose === 'sleep' && <span className="zz">z</span>}
    </button>
  )
}
