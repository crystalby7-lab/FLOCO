// 플로코 고양이 — 보영이 그린 캐릭터 시트에서 자른 그림
import type { Cat } from '../types'
import { SHOP } from '../data/shop'

// src/assets/cat/*.png 를 이름으로 불러온다
const files = import.meta.glob('../assets/cat/*.png', { eager: true, import: 'default' }) as Record<string, string>
export const ART: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace('.png', ''), url]),
)

// 원본 크기(시트 그대로라 모든 그림 비율이 같다)와 그림이 바라보는 방향
export const POSES = {
  sit: { w: 142, h: 177, dir: 'front' },
  side: { w: 138, h: 171, dir: 'left' },
  back: { w: 125, h: 172, dir: 'front' },
  back2: { w: 114, h: 175, dir: 'front' },
  walk: { w: 201, h: 153, dir: 'left' },
  stretch: { w: 211, h: 207, dir: 'left' },
  reach: { w: 124, h: 221, dir: 'front' },
  hug: { w: 159, h: 184, dir: 'left' },
  box: { w: 192, h: 162, dir: 'front' },
  blanket: { w: 187, h: 169, dir: 'front' },
  lie: { w: 258, h: 126, dir: 'left' },
  lielook: { w: 198, h: 136, dir: 'right' },
  sleep: { w: 244, h: 160, dir: 'front' },
  roll: { w: 177, h: 165, dir: 'front' },
  crown: { w: 180, h: 178, dir: 'front' },
  toy: { w: 175, h: 187, dir: 'left' },
  bed: { w: 162, h: 166, dir: 'front' },
  boba: { w: 150, h: 177, dir: 'front' },
  bath: { w: 170, h: 157, dir: 'front' },
} as const
export type Pose = keyof typeof POSES

export const OUTFITS = SHOP.filter((i) => i.slot === 'outfit').map((i) => i.id)
export const outfitOf = (cat: Cat) => cat.equipped.find((e) => OUTFITS.includes(e))

export type Face = 'calm' | 'happy' | 'wow' | 'sad' | 'mad' | 'sleepy'

// 한 포즈의 그림. 앉아 있을 때 옷을 입고 있으면 옷 입은 그림으로 바꾼다.
export function CatSprite({ cat, pose, unit }: { cat: Cat; pose: Pose; unit: number }) {
  const outfit = pose === 'sit' ? outfitOf(cat) : undefined
  const src = ART[outfit ?? pose]
  const h = (outfit ? 180 : POSES[pose].h) * unit
  return (
    <div className={`cat-sprite ${pose}`} style={{ height: h }}>
      <img src={src} alt={cat.name || '고양이'} draggable={false} />
    </div>
  )
}

export function faceFor(cat: Cat): Face {
  if (cat.hunger < 30) return 'wow'
  if (cat.mood < 30) return 'sad'
  if (cat.mood < 45) return 'sleepy'
  if (cat.mood >= 75) return 'happy'
  return 'calm'
}

export function CatFace({ cat, size = 96, face }: { cat: Cat; size?: number; face?: Face }) {
  return <img className="cat-face" src={ART[`face_${face ?? faceFor(cat)}`]} width={size} alt="" draggable={false} />
}
