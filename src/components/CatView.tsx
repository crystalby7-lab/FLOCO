// 플로코 고양이 — 보영이 그린 캐릭터 시트에서 자른 그림
// 포즈는 고양이 상태에 따라 바뀌고, 꾸미기 아이템은 앉은 포즈 위에 겹쳐 그린다.
import type { Cat } from '../types'
import sit from '../assets/cat/sit.png'
import sleep from '../assets/cat/sleep.png'
import love from '../assets/cat/love.png'
import play from '../assets/cat/play.png'
import snack from '../assets/cat/snack.png'
import faceHappy from '../assets/cat/face_happy.png'
import faceWow from '../assets/cat/face_wow.png'
import faceWhat from '../assets/cat/face_what.png'
import faceSad from '../assets/cat/face_sad.png'
import faceMad from '../assets/cat/face_mad.png'
import faceSleepy from '../assets/cat/face_sleepy.png'

export type Pose = 'sit' | 'sleep' | 'love' | 'play' | 'snack'
const POSES: Record<Pose, { src: string; w: number; h: number }> = {
  sit: { src: sit, w: 334, h: 400 },
  sleep: { src: sleep, w: 365, h: 250 },
  love: { src: love, w: 242, h: 241 },
  play: { src: play, w: 245, h: 233 },
  snack: { src: snack, w: 288, h: 228 },
}
// 같은 비율로 보이도록 포즈별 크기 보정 (앉은 포즈 = 1)
const SCALE: Record<Pose, number> = { sit: 1, sleep: 1.25, love: 0.95, play: 0.95, snack: 1.05 }

const WEARABLE = ['ribbon', 'beanie', 'scarf', 'glasses']

export function poseFor(cat: Cat): Pose {
  if (cat.equipped.some((e) => WEARABLE.includes(e))) return 'sit'
  if (cat.mood < 30) return 'sleep'
  if (cat.mood >= 75 && cat.hunger >= 50) return 'love'
  return 'sit'
}

export function CatView({ cat, size = 220, pose }: { cat: Cat; size?: number; pose?: Pose }) {
  const p = pose ?? poseFor(cat)
  const img = POSES[p]
  const eq = (id: string) => cat.equipped.includes(id)
  // 앉은 포즈는 높이 기준, 나머지는 폭 기준으로 크기를 맞춘다
  const h0 = size * 0.82
  const w = p === 'sit' ? (h0 * img.w) / img.h : size * SCALE[p] * 0.85
  const h = p === 'sit' ? h0 : (w * img.h) / img.w

  return (
    <div className="cat-view" style={{ width: Math.max(w, size * 0.7), height: h0 }}>
      {eq('cushion') && <div className="cat-cushion" />}
      {eq('plant') && (
        <svg className="cat-plant" viewBox="0 0 48 64" aria-hidden>
          <path d="M22 30 C12 24 10 10 18 6 C24 12 26 22 22 30 Z" fill="#B9D8A6" stroke="#6b5a50" strokeWidth="2" />
          <path d="M26 30 C34 20 46 20 44 28 C40 33 32 33 26 30 Z" fill="#CFE5C0" stroke="#6b5a50" strokeWidth="2" />
          <path d="M12 30 h24 l-3 30 h-18 Z" fill="#F3D7C0" stroke="#6b5a50" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )}
      <div className={`cat-pose ${p}`} style={{ width: w, height: h }}>
        <img src={img.src} alt={cat.name || '고양이'} draggable={false} />
        {p === 'sit' && (
          <svg className="cat-wear" viewBox="0 0 334 400" aria-hidden>
            <g stroke="#6b5a50" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
              {eq('scarf') && (
                <>
                  <path d="M58 212 Q160 250 278 210 L282 236 Q160 278 56 238 Z" fill="#BFD4EE" />
                  <path d="M196 246 L210 300 L186 300 L178 250 Z" fill="#BFD4EE" />
                </>
              )}
              {eq('glasses') && (
                <g fill="#EAF3FB" fillOpacity="0.3">
                  <circle cx="92" cy="140" r="31" />
                  <circle cx="215" cy="140" r="31" />
                  <path d="M123 138 Q153 128 184 138" fill="none" />
                </g>
              )}
              {eq('ribbon') && (
                <g transform="translate(232 70) rotate(18)">
                  <path d="M0 0 L-26 -16 L-26 16 Z M0 0 L26 -16 L26 16 Z" fill="#F7C9CC" />
                  <circle r="8" fill="#F7C9CC" />
                </g>
              )}
              {eq('beanie') && (
                <>
                  <path d="M42 96 C46 8 270 4 276 96 Z" fill="#D9D0EF" />
                  <rect x="34" y="84" width="250" height="26" rx="13" fill="#E9E3F7" />
                  <circle cx="158" cy="12" r="15" fill="#FDF8F1" />
                </>
              )}
            </g>
          </svg>
        )}
      </div>
      {cat.hunger < 30 && <div className="cat-say">배고파…</div>}
    </div>
  )
}

// 진한 카드 위로 고개 내민 얼굴
export function CatFace({ cat, size = 96 }: { cat: Cat; size?: number }) {
  const src = cat.hunger < 30 ? faceWhat : cat.mood < 30 ? faceSad : cat.mood < 45 ? faceSleepy : cat.mood >= 75 ? faceHappy : faceWow
  return <img className="cat-face" src={src} width={size} alt="" draggable={false} />
}

export const FACES = { faceHappy, faceWow, faceWhat, faceSad, faceMad, faceSleepy }
