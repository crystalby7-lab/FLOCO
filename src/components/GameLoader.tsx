// 집 들어가기(house): 체크 무늬 로딩. 그 밖(door): 나무 문 두 짝이 닫힘 → 따뜻한 방 불빛 + 액자 속 고양이 + 발자국 로딩 → 문이 열림.
// (플로월드 입장 화면과 일부러 다르게: 하늘·마을 대신 집 안 느낌)
// 가운데에서 onSwap을 불러 뒤 화면을 바꾼다 (닫혀 있는 동안 바뀌어서 깜빡임이 없다).
import { useEffect, useState } from 'react'
import { ART } from './CatView'

export type Hop = { label: string; sub?: string; key: number; kind?: 'house' | 'door' }

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
  // 집 들어가기: 하늘색 체크 무늬 + 가운데 고양이 + 아래 바가 차오르면 들어간다
  if (hop.kind === 'house')
    return (
      <div className={`gl check-gl gl-${phase}`} aria-live="polite" aria-label="집에 들어가는 중">
        <div className="cg-cat">
          <img src={ART.sit} alt="" />
          <span className="cg-shadow" />
        </div>
        <div className="cg-bar">
          <i>
            <img src={ART.walk} alt="" />
          </i>
        </div>
      </div>
    )
  return (
    <div className={`gl home-gl gl-${phase}`} aria-live="polite">
      <div className="hg-wall" />
      <div className="hg-door l" />
      <div className="hg-door r" />
      <div className="hg-light" />
      <div className="hg-center">
        <span className="hg-frame">
          <img src={ART.sit} alt="" />
        </span>
        <b>{hop.label}</b>
        {hop.sub && <small>{hop.sub}</small>}
        <div className="hg-paws">
          {[0, 1, 2, 3, 4].map((k) => (
            <i key={k} style={{ animationDelay: `${0.15 + k * 0.17}s` }}>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                <ellipse cx="12" cy="15.5" rx="5" ry="4.2" fill="currentColor" />
                <circle cx="6.2" cy="9.6" r="2.2" fill="currentColor" />
                <circle cx="10" cy="6.4" r="2.2" fill="currentColor" />
                <circle cx="14" cy="6.4" r="2.2" fill="currentColor" />
                <circle cx="17.8" cy="9.6" r="2.2" fill="currentColor" />
              </svg>
            </i>
          ))}
        </div>
      </div>
    </div>
  )
}
