// 게임처럼 화면을 넘길 때 쓰는 전환 화면: 동그랗게 닫힘 → 고양이가 걸어가는 로딩 → 동그랗게 열림.
// 가운데에서 onSwap을 불러 뒤 화면을 바꾼다 (닫혀 있는 동안 바뀌어서 깜빡임이 없다).
import { useEffect, useState } from 'react'
import { ART } from './CatView'

export type Hop = { label: string; sub?: string; key: number }

export function GameLoader({ hop, onSwap, onDone }: { hop: Hop; onSwap: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<'close' | 'load' | 'open'>('close')
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t1 = setTimeout(() => {
      setPhase('load')
      onSwap()
    }, reduce ? 50 : 380)
    const t2 = setTimeout(() => setPhase('open'), reduce ? 300 : 1500)
    const t3 = setTimeout(onDone, reduce ? 400 : 1900)
    return () => [t1, t2, t3].forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hop.key])
  return (
    <div className={`gl gl-${phase}`} aria-live="polite">
      <div className="gl-sun" />
      <img className="gl-cloud c1" src={ART.bg_cloud} alt="" />
      <img className="gl-cloud c2" src={ART.bg_cloud} alt="" />
      <img className="gl-cloud c3" src={ART.bg_cloud} alt="" />
      <div className="gl-title">
        <b>{hop.label}</b>
        {hop.sub && <small>{hop.sub}</small>}
      </div>
      <div className="gl-hill" />
      <img className="gl-house" src={ART.t_bluecat} alt="" />
      <div className="gl-ground" />
      <img className="gl-cat" src={ART.walk} alt="" />
      <div className="gl-bar">
        <i />
      </div>
    </div>
  )
}
