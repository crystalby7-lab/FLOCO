// 고양이가 사는 방
// 스스로 걷고, 앉고, 기지개 켜고, 눕고, 창밖을 보고, 상자에 들어가고, 졸리면 잔다.
// 밥·간식·장난감을 주면 반응하고, 누르면 배를 보이며 뒹군다. 레벨이 오르면 왕관.
import { useEffect, useRef, useState } from 'react'
import type { Cat } from '../types'
import { CatFace, CatSprite, POSES, type Face, type Pose } from './CatView'

export type PlayEvent = { type: 'feed' | 'snack' | 'boba' | 'toy'; key: number } | null

const SPEED = 95 // px/s
const SPOT = { box: 0.16, bed: 0.84, cushion: 0.2, window: 0.78 }

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const rand = (a: number, b: number) => a + Math.random() * (b - a)

export function Playground({
  cat,
  event,
  height = 300,
  catHeight = 120,
}: {
  cat: Cat
  event?: PlayEvent
  height?: number
  catHeight?: number
}) {
  const room = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const xRef = useRef(0.5)
  const [x, setX] = useState(0.5)
  const [dur, setDur] = useState(0)
  const [facing, setFacing] = useState<'left' | 'right'>('left')
  const [pose, setPose] = useState<Pose>('sit')
  const [walking, setWalking] = useState(false)
  const [bowl, setBowl] = useState(false)
  const [face, setFace] = useState<{ f: Face; key: number } | null>(null)
  const [hopping, setHopping] = useState(false)
  const level = useRef(cat.level)

  const has = (id: string) => cat.equipped.includes(id)
  const sleepy = cat.mood < 30
  const hungry = cat.hunger < 30
  const unit = catHeight / 177 // 앉은 그림 높이 기준
  const width = () => room.current?.clientWidth ?? 360

  const clear = () => window.clearTimeout(timer.current)

  const walkTo = (tx: number, then: () => void) => {
    clear()
    const dist = Math.abs(tx - xRef.current) * width()
    if (dist < 10) return then()
    const t = dist / SPEED
    setFacing(tx > xRef.current ? 'right' : 'left')
    setPose('walk')
    setWalking(true)
    setDur(t)
    setX(tx)
    xRef.current = tx
    timer.current = window.setTimeout(() => {
      setWalking(false)
      then()
    }, t * 1000)
  }

  const stay = (p: Pose, ms: number, after: () => void = next) => {
    clear()
    setPose(p)
    timer.current = window.setTimeout(after, ms)
  }

  const say = (f: Face) => {
    setFace({ f, key: Date.now() })
    window.setTimeout(() => setFace(null), 1900)
  }

  // 다음 행동 고르기
  function next() {
    if (sleepy) {
      if (has('bed')) return walkTo(SPOT.bed, () => stay('bed', 14000))
      if (has('cushion')) return walkTo(SPOT.cushion, () => stay('sleep', 14000))
      return stay('blanket', 12000)
    }
    const r = Math.random()
    if (r < 0.58) {
      let tx = rand(0.14, 0.86)
      if (Math.abs(tx - xRef.current) < 0.18) tx = xRef.current > 0.5 ? rand(0.14, 0.4) : rand(0.6, 0.86)
      return walkTo(tx, () => stay(pick<Pose>(['sit', 'sit', 'side', 'lielook', 'stretch']), rand(2600, 4500)))
    }
    if (r < 0.66) return stay('sit', rand(2500, 4000))
    if (r < 0.72) return walkTo(SPOT.window, () => stay(pick<Pose>(['back', 'back2']), rand(3000, 4500)))
    if (r < 0.77) return stay('stretch', 2400)
    if (r < 0.83) return stay(pick<Pose>(['lie', 'lielook']), rand(3500, 6000))
    if (r < 0.89 && has('box')) return walkTo(SPOT.box, () => stay('box', rand(4000, 6000)))
    if (r < 0.93 && has('bed')) return walkTo(SPOT.bed, () => stay('bed', rand(4000, 6000)))
    if (r < 0.97 && has('cushion')) return walkTo(SPOT.cushion, () => stay('sleep', rand(5000, 8000)))
    return stay('side', rand(2000, 3500))
  }

  useEffect(() => {
    timer.current = window.setTimeout(() => (sleepy ? next() : walkTo(rand(0.2, 0.8), () => stay('sit', 2500))), 700)
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepy])

  // 레벨 업 → 왕관
  useEffect(() => {
    if (cat.level > level.current) {
      level.current = cat.level
      stay('crown', 3500)
      say('happy')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat.level])

  // 밥·간식·장난감
  useEffect(() => {
    if (!event) return
    const tx = Math.min(0.8, Math.max(0.25, xRef.current + (xRef.current > 0.5 ? -0.18 : 0.18)))
    const done = () => {
      say('happy')
      stay('sit', 2500)
    }
    if (event.type === 'feed') {
      setBowl(true)
      walkTo(0.62, () => {
        setFacing('right')
        stay('side', 2600, () => {
          setBowl(false)
          done()
        })
      })
    } else if (event.type === 'snack') walkTo(tx, () => stay('hug', 3200, done))
    else if (event.type === 'boba') walkTo(tx, () => stay('boba', 3200, done))
    else walkTo(tx, () => stay('toy', 1800, () => stay('reach', 1600, done)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.key])

  const tap = () => {
    if (walking) return
    setHopping(true)
    window.setTimeout(() => setHopping(false), 460)
    if (['sleep', 'bed', 'blanket'].includes(pose)) return say('sleepy')
    if (hungry) {
      say('wow')
      return stay('sit', 2500)
    }
    say(pick<Face>(['happy', 'happy', 'calm']))
    stay('roll', 2000, () => stay('sit', 2500))
  }

  const dir = POSES[pose].dir
  const flip = (dir === 'left' && facing === 'right') || (dir === 'right' && facing === 'left')

  return (
    <div className="room" ref={room} style={{ height }}>
      <div className="room-wall">
        <div className="window" style={{ left: `${SPOT.window * 100}%` }} aria-hidden>
          <span className="cloud c1" />
          <span className="cloud c2" />
        </div>
        <div className="shelf" aria-hidden>
          <i className="b1" />
          <i className="b2" />
          <i className="b3" />
        </div>
      </div>
      <div className="room-floor" />
      <div className="rug" aria-hidden />
      {bowl && (
        <svg className="room-bowl" style={{ left: '74%' }} viewBox="0 0 60 30" aria-hidden>
          <path d="M4 10 h52 a26 18 0 0 1 -52 0 Z" fill="#C9DCEF" stroke="#8a7b74" strokeWidth="2.5" />
          <ellipse cx="30" cy="10" rx="26" ry="5" fill="#F7E3C8" stroke="#8a7b74" strokeWidth="2.5" />
        </svg>
      )}

      <button
        className="cat-actor"
        style={{ left: `${x * 100}%`, transitionDuration: `${dur}s` }}
        onClick={tap}
        aria-label={`${cat.name || '고양이'} 쓰다듬기`}
      >
        <span className="cat-shadow" />
        <span
          key={pose}
          className={`cat-body ${walking ? 'walking' : ''} ${hopping ? 'hop' : ''}`}
          style={{ transform: flip ? 'scaleX(-1)' : undefined }}
        >
          <CatSprite cat={cat} pose={pose} unit={unit} />
        </span>
        {face && (
          <span key={face.key} className="reaction">
            <CatFace cat={cat} face={face.f} size={50} />
            <i className="heart" />
          </span>
        )}
        {!face && hungry && !walking && <span className="say">배고파…</span>}
      </button>
    </div>
  )
}
