// 플로코 고양이 — 보영이 그린 캐릭터 시트에서 자른 그림
import type { Cat } from '../types'
import { SHOP } from '../data/shop'
import { DEFAULT_BREED, KIT, type BreedId } from '../data/kitty'

// src/assets/cat/*.png·*.jpg 를 이름으로 불러온다 (장소 배경 sc_h_*는 jpg)
const files = import.meta.glob('../assets/cat/*.{png,jpg}', { eager: true, import: 'default' }) as Record<string, string>
const RAW: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace(/\.(png|jpg)$/, ''), url]),
)

// 2026-11-18: 고양이 그림은 전부 새 캐릭터(src/data/kitty.ts)로 바뀐다.
// 예전 이름(sit, face_happy, t_wave…)을 쓰는 곳은 그대로 두고, 여기서 '지금 키우는 종'의 표정 그림으로 바꿔 준다.
// 걷는 고양이(walk)는 보영 요청으로 예전 그림 그대로.
let curBreed: BreedId = DEFAULT_BREED
export const setArtBreed = (b: BreedId) => {
  curBreed = b
}
const POSE_TO_EMO: Record<string, string> = {
  sit: 'e0', side: 'e0', back: 'e0', back2: 'e0', box: 'e0', reach: 'e3', hug: 'e2', stretch: 'e1', lie: 'e2', lielook: 'e3', sleep: 'e6', blanket: 'e6', bed: 'e6',
  roll: 'e1', crown: 'e1', toy: 'e1', boba: 'e2', bath: 'e3', chef: 'e2',
  face_calm: 'e0', face_happy: 'e1', face_wow: 'e3', face_sad: 'e4', face_mad: 'e5', face_sleepy: 'e6',
  t_wave: 'e1', t_jump: 'e1', t_happy: 'e2', t_rain: 'e4', t_think: 'e3', t_sprout: 'e2',
}
// 포즈 그림 (2026-11-18 보영 포즈 시트: walk·stretch·sleep·groom·play, 솜뭉치는 아직 없음)
const MOTION: Record<string, string> = {
  walk: 'walk', stretch: 'stretch', lie: 'sleep', sleep: 'sleep', bed: 'sleep', blanket: 'sleep',
  lielook: 'groom', hug: 'groom', bath: 'groom', roll: 'play', toy: 'play', reach: 'play',
}
// 포즈 그림 높이 (앉은 그림 177 기준)
const MOTION_H: Record<string, number> = { walk: 150, stretch: 132, sleep: 112, groom: 172, play: 128 }
export const hasMotion = (pose: string) => !!MOTION[pose] && !!KIT[`${curBreed}_p_${MOTION[pose]}`]
// 친구·뉴스 고양이처럼 종이 정해진 그림
const FIXED: Record<string, string> = {
  b_orange: 'orange_e0', b_black: 'black_e0', b_grey: 'grey_e0', b_calico: 'calico_e0', b_tuxedo: 'cream_e0', b_siamese: 'grey_e2', b_ragdoll: 'cream_e2', b_snow: 'cream_e0',
  friend_orange: 'orange_e0', friend_black: 'black_e0', friend_grey: 'grey_e0', friend_fluffy: 'cream_e0',
}
// 탭바 위를 걸어 다니는 고양이는 예전 그림 그대로 (보영: 귀여우니까 냅둬)
export const ART_OLD = RAW
export const ART: Record<string, string> = new Proxy(RAW, {
  get(t, k: string) {
    // 움직이는 포즈(걷기·기지개·잠·그루밍·놀기)는 종별 포즈 그림이 있으면 그걸, 없으면(솜뭉치) 표정 그림
    if (MOTION[k] && KIT[`${curBreed}_p_${MOTION[k]}`]) return KIT[`${curBreed}_p_${MOTION[k]}`]
    if (k === 'walk') return KIT[`${curBreed}_e0`]
    if (POSE_TO_EMO[k]) return KIT[`${curBreed}_${POSE_TO_EMO[k]}`]
    if (FIXED[k]) return KIT[FIXED[k]]
    return t[k] ?? KIT[k]
  },
})

// 원본 크기(시트 그대로라 모든 그림 비율이 같다)와 그림이 바라보는 방향
export const POSES = {
  sit: { w: 142, h: 177, dir: 'front' },
  side: { w: 138, h: 171, dir: 'left' },
  back: { w: 125, h: 172, dir: 'front' },
  back2: { w: 114, h: 175, dir: 'front' },
  walk: { w: 201, h: 153, dir: 'left' },
  stretch: { w: 211, h: 207, dir: 'left' },
  reach: { w: 124, h: 221, dir: 'right' },
  hug: { w: 159, h: 184, dir: 'front' },
  box: { w: 192, h: 162, dir: 'front' },
  blanket: { w: 187, h: 169, dir: 'left' },
  lie: { w: 258, h: 126, dir: 'left' },
  lielook: { w: 198, h: 136, dir: 'front' },
  sleep: { w: 244, h: 160, dir: 'left' },
  roll: { w: 177, h: 165, dir: 'right' },
  crown: { w: 180, h: 178, dir: 'front' },
  toy: { w: 175, h: 187, dir: 'right' },
  bed: { w: 162, h: 166, dir: 'left' },
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
  // 새 캐릭터 그림은 포즈마다 크기가 같아서 걷기만 예전 비율
  const h = (outfit ? 180 : hasMotion(pose) ? MOTION_H[MOTION[pose]] : 177) * unit
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
