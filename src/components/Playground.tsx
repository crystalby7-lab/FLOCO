// 고양이가 사는 방
// 스스로 걷고, 앉고, 기지개 켜고, 눕고, 창밖을 보고, 상자에 들어가고, 졸리면 잔다.
// 밥·간식·장난감을 주면 반응하고, 누르면 배를 보이며 뒹군다. 레벨이 오르면 왕관.
import { useEffect, useRef, useState } from 'react'
import type { Cat } from '../types'
import { ART, CatSprite, OUTFITS, POSES, type Face, type Pose } from './CatView'

export type PlayEvent = { type: 'feed' | 'snack' | 'boba' | 'toy' | 'bath'; key: number } | null

// 실제 시각에 따라 방 분위기가 바뀐다
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night'
export function timeOfDay(h = new Date().getHours()): TimeOfDay {
  if (h >= 6 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'evening'
  return 'night'
}

const SPEED = 95 // px/s
// 표정 반응 → 시트의 말풍선
const BB: Record<Face, string> = { happy: 'bb_heart', calm: 'bb_dots', wow: 'bb_bang', sad: 'bb_mess', mad: 'bb_mess', sleepy: 'bb_zzz' }
const SPOT = { box: 0.16, bed: 0.84, cushion: 0.2, window: 0.78 }

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const rand = (a: number, b: number) => a + Math.random() * (b - a)

export function Playground({
  cat,
  event,
  height = 300,
  catHeight = 120,
  lines = [],
  onPose,
  place = 'room',
  ask = false,
  onTapCat,
}: {
  cat: Cat
  event?: PlayEvent
  height?: number
  catHeight?: number
  lines?: string[] // 고양이 혼잣말 후보
  onPose?: (id: string) => void // 앨범 기록용
  place?: string // 방·마당·옥상·바닷가
  ask?: boolean // 고양이가 물어볼 게 있으면 머리 위에 ? 말풍선
  onTapCat?: () => boolean // true를 돌려주면 기본 반응(뒹굴기) 대신 그쪽에서 처리
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
  const [talk, setTalk] = useState<string | null>(null)
  const [bubbles, setBubbles] = useState(false)
  const level = useRef(cat.level)
  const tod = timeOfDay()
  const linesRef = useRef(lines)
  linesRef.current = lines

  const has = (id: string) => cat.equipped.includes(id)
  const sleepy = cat.mood < 30
  const hungry = cat.hunger < 30
  const dirty = (cat.clean ?? 80) < 35
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
    if (tod === 'night' && Math.random() < 0.35) {
      if (has('bed')) return walkTo(SPOT.bed, () => stay('bed', rand(6000, 9000)))
      if (has('cushion')) return walkTo(SPOT.cushion, () => stay('sleep', rand(6000, 9000)))
      return stay('blanket', rand(5000, 8000))
    }
    const r = Math.random()
    if (r < 0.58) {
      let tx = rand(0.14, 0.86)
      if (Math.abs(tx - xRef.current) < 0.18) tx = xRef.current > 0.5 ? rand(0.14, 0.4) : rand(0.6, 0.86)
      return walkTo(tx, () => stay(pick<Pose>(['sit', 'sit', 'side', 'lielook', 'stretch']), rand(2600, 4500)))
    }
    if (r < 0.66) return stay('sit', rand(2500, 4000))
    if (r < 0.72) return walkTo(place === 'room' ? SPOT.window : rand(0.2, 0.8), () => stay(pick<Pose>(['back', 'back2']), rand(3000, 4500)))
    if (r < 0.77) return stay('stretch', 2400)
    if (r < 0.83) return stay(pick<Pose>(['lie', 'lielook']), rand(3500, 6000))
    if (r < 0.89 && has('box')) return walkTo(SPOT.box, () => stay('box', rand(4000, 6000)))
    if (r < 0.93 && has('bed')) return walkTo(SPOT.bed, () => stay('bed', rand(4000, 6000)))
    if (r < 0.97 && has('cushion')) return walkTo(SPOT.cushion, () => stay('sleep', rand(5000, 8000)))
    return stay('side', rand(2000, 3500))
  }

  // 포즈가 바뀌면 앨범에 기록 (옷 입고 앉아 있으면 옷 모습으로)
  useEffect(() => {
    const outfit = pose === 'sit' ? cat.equipped.find((e) => OUTFITS.includes(e)) : undefined
    onPose?.(outfit ?? pose)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, cat.equipped.join()])

  // 가끔 혼잣말
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!linesRef.current.length || Math.random() < 0.35) return
      setTalk(pick(linesRef.current))
      window.setTimeout(() => setTalk(null), 3400)
    }, 7000)
    return () => window.clearInterval(id)
  }, [])

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
    if (event.type === 'bath') {
      clear()
      setWalking(false)
      setBubbles(true)
      stay('bath', 3600, () => {
        setBubbles(false)
        say('happy')
        stay('sit', 2500)
      })
      return
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
    if (onTapCat?.()) {
      setHopping(true)
      window.setTimeout(() => setHopping(false), 460)
      return
    }
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
    <div className={`room tod-${tod} place-${place}`} ref={room} style={{ height }}>
      <Backdrop place={place} tod={tod} />
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
        {dirty && !['bath'].includes(pose) && (
          <span className="dust" aria-hidden>
            <i />
            <i />
            <i />
          </span>
        )}
        {bubbles && (
          <span className="soap" aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </span>
        )}
        {(() => {
          // 머리 위 말풍선 (캐릭터 시트 그림): 반응 > 질문 > 혼잣말 > 상태
          if (face) return <img key={face.key} className="mood-bb pop" src={ART[BB[face.f]]} alt="" />
          if (walking) return null
          if (talk && !ask) return <span className="say talk">{talk}</span>
          if (['sleep', 'bed', 'blanket'].includes(pose)) return <img className="mood-bb" src={ART.bb_zzz} alt="자는 중" />
          if (hungry)
            return (
              <span className="mood-bb need" aria-label="배고파요">
                <img src={ART.bb_empty} alt="" />
                <img className="in" src={ART.i_bowl} alt="" />
              </span>
            )
          if (dirty && pose !== 'bath') return <img className="mood-bb" src={ART.bb_mess} alt="씻고 싶어요" />
          return null
        })()}
      </button>
    </div>
  )
}

// 장소별 배경 (잠긴 장소 미리보기에도 쓴다). 소품은 캐릭터 시트 그림을 쓴다.
const Spr = ({ n, c, style }: { n: string; c: string; style?: React.CSSProperties }) => <img className={`spr ${c}`} src={ART[n]} alt="" aria-hidden style={style} />

// 시간대 조명: 아침은 따뜻하게, 저녁은 노을빛, 밤은 어둡게 (실내는 스탠드 불빛)
function Light({ tod, lamp }: { tod: TimeOfDay; lamp?: boolean }) {
  return (
    <>
      <div className={`tod-light ${tod}`} aria-hidden />
      {lamp && <div className={`lamp-glow ${tod}`} aria-hidden />}
    </>
  )
}

const PHOTO: Record<string, (night: boolean) => string> = {
  yard: () => 'sc_country',
  rooftop: (n) => (n ? 'sc_night' : 'sc_sunset'),
  beach: () => 'sc_beach',
  cherry: () => 'sc_cherry',
  snow: () => 'sc_snow',
}

export function Backdrop({ place, tod }: { place: string; tod: TimeOfDay }) {
  const night = tod === 'night'
  if (PHOTO[place]) {
    const photo = PHOTO[place](night)
    return (
      <>
        <img className="scene-photo" src={ART[photo]} alt="" aria-hidden />
        <div className="photo-ground" aria-hidden />
        {place === 'yard' && (
          <>
            <div className="spr-fence" aria-hidden>
              <img src={ART.bg_fence} alt="" />
              <img src={ART.bg_fence} alt="" />
              <img src={ART.bg_fence} alt="" />
            </div>
            <Spr n="bg_flowers" c="yard-flowers" />
            <Spr n="bg_flower" c="yard-flower" />
            {!night && <span className="butterfly" aria-hidden />}
          </>
        )}
        {place === 'rooftop' && (
          <>
            <div className="rail" aria-hidden />
            <Spr n="bg_plant1" c="roof-plant l" />
            <Spr n="bg_plant2" c="roof-plant r" />
          </>
        )}
        {place === 'cherry' && (
          <div className="petals" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        )}
        {place === 'snow' && (
          <div className="snowfall" aria-hidden>
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        )}
        {photo !== 'sc_night' && <Light tod={tod} />}
      </>
    )
  }
  // 거실: 가랜드·창문·장식장·소파·스탠드·화분 + 스탠드 불빛
  return (
    <>
      <div className="room-wall living" />
      <Spr n="f_bunting" c="lv-bunting" />
      <Spr n="bg_window" c={`room-window ${night ? 'night' : ''}`} style={{ left: `${SPOT.window * 100}%` }} />
      <Spr n="f_cabinet" c="lv-cabinet" />
      <Spr n="f_sofa" c="lv-sofa" />
      <div className="room-floor living" />
      <div className="rug" aria-hidden />
      <Spr n="f_lamp" c="lv-lamp" />
      <Spr n="bg_plant3" c="lv-plant" />
      <Light tod={tod} lamp />
    </>
  )
}
