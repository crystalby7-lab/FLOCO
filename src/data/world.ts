// 플로월드 마을: 빈 땅 10곳(위치 고정) = 단원 10개 = 상점 10곳.
// 퀘스트를 끝내면 그 땅에 상점이 지어지고, 누르면 안으로 들어가 꾸민다.
// 그림: 마을 바탕(world/village.jpg), 가게 안(world/room/*), 가구(world/fur/f000~f136).
const rooms = import.meta.glob('../assets/world/room/*.jpg', { eager: true, import: 'default' }) as Record<string, string>
const furs = import.meta.glob('../assets/world/fur/*.png', { eager: true, import: 'default' }) as Record<string, string>
export { default as VILLAGE } from '../assets/world/village.jpg'
const byName = (m: Record<string, string>, ext: string) => Object.fromEntries(Object.entries(m).map(([p, u]) => [p.split('/').pop()!.replace(ext, ''), u]))
export const ROOM = byName(rooms, '.jpg')
const FUR_BY = byName(furs, '.png')
export const fur = (n: number) => FUR_BY['f' + String(n).padStart(3, '0')]

// 가게 안 정해진 자리 5칸 (방 그림 기준 %, 바닥에서 위로)
export const SLOTS = [
  { id: 'light', name: '조명', x: 44, bottom: 72, w: 12 },
  { id: 'display', name: '진열대', x: 5, bottom: 22, w: 26 },
  { id: 'counter', name: '카운터', x: 31, bottom: 6, w: 34 },
  { id: 'table', name: '테이블', x: 67, bottom: 5, w: 29 },
  { id: 'deco', name: '소품', x: 3, bottom: 3, w: 13 },
] as const
export type SlotId = (typeof SLOTS)[number]['id']

export const STYLES = [
  { id: 'base', name: '기본', color: '#f3e6cf' },
  { id: 'mint', name: '민트', color: '#9fdcc8' },
  { id: 'pink', name: '핑크', color: '#f7b9cc' },
  { id: 'black', name: '블랙', color: '#3a3d45' },
] as const

const LIGHTS = [8, 16, 17]
export type Shop = {
  id: string
  name: string
  room: string
  building: string // 마을에 지어질 건물 (지금은 마을 시트 그림)
  lot: { x: number; y: number } // 마을 그림 위 땅 가운데 (%)
  options: Record<SlotId, number[]>
}
// 순서 = 퀘스트 순서 = 단원 순서
export const SHOPS: Shop[] = [
  { id: 'conv', name: '편의점', room: 'conv', building: 't_shop', lot: { x: 75, y: 90 }, options: { light: LIGHTS, display: [120, 121, 31, 130], counter: [0, 1, 50, 126], table: [10, 15, 11], deco: [122, 136, 129] } },
  { id: 'flower', name: '꽃집', room: 'flower', building: 't_greenhouse', lot: { x: 22.5, y: 78 }, options: { light: LIGHTS, display: [85, 90, 81], counter: [88, 49, 3], table: [14, 12, 13], deco: [74, 91, 99] } },
  { id: 'bank', name: '은행', room: 'bank', building: 't_dome', lot: { x: 77, y: 73.5 }, options: { light: LIGHTS, display: [5, 127, 128], counter: [4, 126, 50], table: [133, 11, 15], deco: [107, 125, 135] } },
  { id: 'bakery', name: '빵집', room: 'bakery', building: 't_pink', lot: { x: 33, y: 63.5 }, options: { light: LIGHTS, display: [23, 24, 37], counter: [2, 0, 49], table: [10, 12, 14], deco: [41, 40, 39] } },
  { id: 'gift', name: '선물가게', room: 'gift', building: 't_bluecat', lot: { x: 80, y: 55 }, options: { light: LIGHTS, display: [28, 26, 69], counter: [3, 103, 50], table: [14, 13, 11], deco: [47, 48, 129] } },
  { id: 'market', name: '시장', room: 'market', building: 't_booth', lot: { x: 16.5, y: 51.5 }, options: { light: LIGHTS, display: [117, 123, 60], counter: [88, 115, 103], table: [12, 13, 10], deco: [130, 131, 110] } },
  { id: 'book', name: '서점', room: 'book', building: 't_school', lot: { x: 79, y: 35 }, options: { light: LIGHTS, display: [7, 71, 83], counter: [50, 76, 3], table: [12, 14, 86], deco: [74, 70, 78] } },
  { id: 'clothes', name: '옷가게', room: 'clothes', building: 't_redroof', lot: { x: 20.5, y: 35 }, options: { light: LIGHTS, display: [6, 58, 27], counter: [3, 63, 50], table: [59, 60, 69], deco: [56, 57, 66] } },
  { id: 'salon', name: '미용실', room: 'salon', building: 't_bluehouse', lot: { x: 63.5, y: 21 }, options: { light: LIGHTS, display: [87, 92, 93], counter: [89, 67, 4], table: [94, 101, 65], deco: [102, 84, 97] } },
  { id: 'cafe', name: '카페', room: 'cafe', building: 't_cafe', lot: { x: 26, y: 19.5 }, options: { light: LIGHTS, display: [28, 45, 53], counter: [43, 1, 2], table: [10, 11, 13], deco: [52, 51, 34] } },
]
