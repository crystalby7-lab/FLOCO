// 플로코 고양이 — 보영이 그린 캐릭터 시트에서 자른 그림
import type { Cat } from '../types'
import sit from '../assets/cat/sit.png'
import side from '../assets/cat/side.png'
import back from '../assets/cat/back.png'
import sleep from '../assets/cat/sleep.png'
import play from '../assets/cat/play.png'
import snack from '../assets/cat/snack.png'
import faceHappy from '../assets/cat/face_happy.png'
import faceWow from '../assets/cat/face_wow.png'
import faceWhat from '../assets/cat/face_what.png'
import faceSad from '../assets/cat/face_sad.png'
import faceMad from '../assets/cat/face_mad.png'
import faceSleepy from '../assets/cat/face_sleepy.png'

export type Pose = 'sit' | 'side' | 'back' | 'sleep' | 'play' | 'snack'

// 그림 원본 크기와 화면에서의 높이 비율 (앉은 포즈 높이 = 1)
export const POSES: Record<Pose, { src: string; w: number; h: number; scale: number }> = {
  sit: { src: sit, w: 333, h: 395, scale: 1 },
  side: { src: side, w: 269, h: 355, scale: 0.92 },
  back: { src: back, w: 218, h: 328, scale: 0.86 },
  sleep: { src: sleep, w: 357, h: 235, scale: 0.72 },
  play: { src: play, w: 241, h: 233, scale: 0.7 },
  snack: { src: snack, w: 288, h: 228, scale: 0.7 },
}

export const FACES = { happy: faceHappy, wow: faceWow, what: faceWhat, sad: faceSad, mad: faceMad, sleepy: faceSleepy }
export type Face = keyof typeof FACES

// 한 포즈의 그림 (+ 앉은 포즈일 때 꾸미기 아이템)
export function CatSprite({ cat, pose, height }: { cat: Cat; pose: Pose; height: number }) {
  const p = POSES[pose]
  const h = height * p.scale
  const w = (h * p.w) / p.h
  const eq = (id: string) => cat.equipped.includes(id)
  return (
    <div className={`cat-sprite ${pose}`} style={{ width: w, height: h }}>
      <img src={p.src} alt={cat.name || '고양이'} draggable={false} />
      {pose === 'sit' && (
        <svg className="cat-wear" viewBox="0 0 333 395" aria-hidden>
          <g stroke="#7a6a62" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
            {eq('scarf') && (
              <>
                <path d="M58 210 Q160 248 278 208 L282 234 Q160 276 56 236 Z" fill="#C9DCEF" />
                <path d="M196 244 L210 298 L186 298 L178 248 Z" fill="#C9DCEF" />
              </>
            )}
            {eq('glasses') && (
              <g fill="#EEF5FB" fillOpacity="0.3">
                <circle cx="90" cy="138" r="31" />
                <circle cx="212" cy="138" r="31" />
                <path d="M121 136 Q151 126 181 136" fill="none" />
              </g>
            )}
            {eq('ribbon') && (
              <g transform="translate(230 68) rotate(18)">
                <path d="M0 0 L-26 -16 L-26 16 Z M0 0 L26 -16 L26 16 Z" fill="#F6D1D1" />
                <circle r="8" fill="#F6D1D1" />
              </g>
            )}
            {eq('beanie') && (
              <>
                <path d="M42 94 C46 6 268 2 274 94 Z" fill="#DCD3EE" />
                <rect x="34" y="82" width="248" height="26" rx="13" fill="#ECE7F7" />
                <circle cx="157" cy="10" r="15" fill="#FFFDF9" />
              </>
            )}
          </g>
        </svg>
      )}
    </div>
  )
}

// 진한 카드 위로 고개 내민 얼굴
export function CatFace({ cat, size = 96, face }: { cat: Cat; size?: number; face?: Face }) {
  const f: Face = face ?? (cat.hunger < 30 ? 'what' : cat.mood < 30 ? 'sad' : cat.mood < 45 ? 'sleepy' : cat.mood >= 75 ? 'happy' : 'wow')
  return <img className="cat-face" src={FACES[f]} width={size} alt="" draggable={false} />
}
