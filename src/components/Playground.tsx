// 고양이가 돌아다니는 방
// 스스로 걷고, 앉고, 옆을 보고, 창밖을 보고, 졸리면 방석에서 잔다.
// 밥을 주면 그릇으로 걸어가 먹고, 장난감을 주면 놀고, 누르면 반응한다.
import { useEffect, useRef, useState } from 'react'
import type { Cat } from '../types'
import { CatSprite, FACES, type Face, type Pose } from './CatView'

export type PlayEvent = { type: 'feed' | 'play'; key: number } | null

const SPEED = 110 // px/s
const CUSHION_X = 0.2
const ITEM_X = 0.72

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const rand = (a: number, b: number) => a + Math.random() * (b - a)

export function Playground({ cat, event, height = 290, catHeight = 132 }: { cat: Cat; event?: PlayEvent; height?: number; catHeight?: number }) {
  const room = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [x, setX] = useState(0.5)
  const [dur, setDur] = useState(0)
  const [facing, setFacing] = useState<'left' | 'right'>('left')
  const [pose, setPose] = useState<Pose>('sit')
  const [walking, setWalking] = useState(false)
  const [item, setItem] = useState<'bowl' | 'toy' | null>(null)
  const [reaction, setReaction] = useState<{ face: Face; key: number } | null>(null)
  const [hop, setHop] = useState(0)
  const xRef = useRef(0.5)
  const sleepy = cat.mood < 30
  const hungry = cat.hunger < 30

  const width = () => room.current?.clientWidth ?? 360

  // 목표 위치까지 걸어간 뒤 then 실행
  const walkTo = (tx: number, then: () => void) => {
    window.clearTimeout(timer.current)
    const dist = Math.abs(tx - xRef.current) * width()
    if (dist < 8) return then()
    const t = dist / SPEED
    setFacing(tx > xRef.current ? 'right' : 'left')
    setPose('side')
    setWalking(true)
    setDur(t)
    setX(tx)
    xRef.current = tx
    timer.current = window.setTimeout(() => {
      setWalking(false)
      then()
    }, t * 1000)
  }

  const rest = (p: Pose, ms: number) => {
    setPose(p)
    timer.current = window.setTimeout(next, ms)
  }

  // 다음 행동 고르기
  function next() {
    if (sleepy) return walkTo(CUSHION_X, () => rest('sleep', 12000))
    const r = Math.random()
    if (r < 0.45) {
      let tx = rand(0.15, 0.85)
      if (Math.abs(tx - xRef.current) < 0.15) tx = xRef.current > 0.5 ? rand(0.15, 0.4) : rand(0.6, 0.85)
      walkTo(tx, () => rest(pick<Pose>(['sit', 'sit', 'side', 'back']), rand(2500, 4500)))
    } else if (r < 0.7) rest('sit', rand(3000, 5000))
    else if (r < 0.85) rest('back', rand(2500, 4000))
    else if (r < 0.95) rest('side', rand(2000, 3500))
    else walkTo(CUSHION_X, () => rest('sleep', rand(5000, 8000)))
  }

  useEffect(() => {
    timer.current = window.setTimeout(next, 1200)
    return () => window.clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepy])

  // 밥·장난감 이벤트
  useEffect(() => {
    if (!event) return
    const kind = event.type === 'feed' ? 'bowl' : 'toy'
    setItem(kind)
    walkTo(ITEM_X - 0.17, () => {
      setFacing('right')
      setPose(event.type === 'feed' ? 'snack' : 'play')
      timer.current = window.setTimeout(() => {
        setItem(null)
        react('happy')
        rest('sit', 3000)
      }, 3200)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.key])

  const react = (face: Face) => {
    setReaction({ face, key: Date.now() })
    window.setTimeout(() => setReaction(null), 1800)
  }

  const tap = () => {
    if (walking) return
    setHop((h) => h + 1)
    if (pose === 'sleep') {
      react('sleepy')
      return
    }
    react(hungry ? 'what' : pick<Face>(['happy', 'happy', 'wow']))
    setPose('sit')
  }

  const flip = facing === 'right' && pose !== 'sit' && pose !== 'back'

  return (
    <div className="room" ref={room} style={{ height }}>
      <div className="room-wall">
        <div className="window" aria-hidden>
          <span className="cloud c1" />
          <span className="cloud c2" />
        </div>
        <div className="frame" aria-hidden>
          <i />
        </div>
      </div>
      <div className="room-floor" />
      <div className="rug" aria-hidden />
      {cat.equipped.includes('cushion') && !(pose === 'sleep') && (
        <div className="cushion" style={{ left: `${CUSHION_X * 100}%` }} aria-hidden />
      )}
      {cat.equipped.includes('plant') && (
        <svg className="room-plant" viewBox="0 0 48 64" aria-hidden>
          <path d="M22 30 C12 24 10 10 18 6 C24 12 26 22 22 30 Z" fill="#CFE3C3" stroke="#7a6a62" strokeWidth="2" />
          <path d="M26 30 C34 20 46 20 44 28 C40 33 32 33 26 30 Z" fill="#DDEBD3" stroke="#7a6a62" strokeWidth="2" />
          <path d="M12 30 h24 l-3 30 h-18 Z" fill="#F6D1D1" stroke="#7a6a62" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )}
      {item && (
        <div className={`room-item ${item}`} style={{ left: `${ITEM_X * 100}%` }} aria-hidden>
          {item === 'bowl' ? (
            <svg viewBox="0 0 60 30">
              <path d="M4 10 h52 a26 18 0 0 1 -52 0 Z" fill="#C9DCEF" stroke="#7a6a62" strokeWidth="2.5" />
              <ellipse cx="30" cy="10" rx="26" ry="5" fill="#F7E3C8" stroke="#7a6a62" strokeWidth="2.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 60 30">
              <ellipse cx="30" cy="20" rx="16" ry="9" fill="#CFC6C6" stroke="#7a6a62" strokeWidth="2.5" />
              <circle cx="18" cy="13" r="4" fill="#CFC6C6" stroke="#7a6a62" strokeWidth="2" />
              <path d="M46 20 q8 0 10 -8" fill="none" stroke="#E9A3A9" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
      )}

      <button
        className="cat-actor"
        style={{ left: `${x * 100}%`, transitionDuration: `${dur}s` }}
        onClick={tap}
        aria-label={`${cat.name} 쓰다듬기`}
      >
        <span className="cat-shadow" />
        <span key={hop} className={`cat-body ${walking ? 'walking' : ''} ${hop ? 'hop' : ''} ${pose}`} style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
          <CatSprite cat={cat} pose={pose} height={catHeight} />
        </span>
        {reaction && (
          <span key={reaction.key} className="reaction">
            <img src={FACES[reaction.face]} alt="" />
            <i className="heart" />
          </span>
        )}
        {!reaction && hungry && pose !== 'snack' && <span className="say">배고파…</span>}
      </button>
    </div>
  )
}
