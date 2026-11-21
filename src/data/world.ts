// 플로월드 마을: 빈 땅 10곳(위치 고정) = 단원 10개 = 상점 10곳.
// 챕터를 끝내면 그 땅에 상점이 지어지고, 누르면 안으로 들어가 꾸민다.
// 그림: 마을 바탕(world/village.jpg), 가게 안(world/room/*, 세로 그림), 가구(world/furn/*.webp, 예전 world/fur/f000~f136).
const rooms = import.meta.glob('../assets/world/room/*.jpg', { eager: true, import: 'default' }) as Record<string, string>
const furs = import.meta.glob('../assets/world/fur/*.png', { eager: true, import: 'default' }) as Record<string, string>
// 보영이 준 가게별 가구 시트에서 자른 것 (2026-11-18): {가게}_{번호} 또는 {가게}_{cute|pretty|cool|light}{번호}
const furn = import.meta.glob('../assets/world/furn/*.webp', { eager: true, import: 'default' }) as Record<string, string>
export { default as VILLAGE } from '../assets/world/village.jpg'
const byName = (m: Record<string, string>, ext: string) => Object.fromEntries(Object.entries(m).map(([p, u]) => [p.split('/').pop()!.replace(ext, ''), u]))
export const ROOM = byName(rooms, '.jpg')
const FUR_BY = byName(furs, '.png')
export const fur = (n: number) => FUR_BY['f' + String(n).padStart(3, '0')]
const FURN = byName(furn, '.webp')
// 예전 저장본은 번호(f000~), 새 가구는 이름
export const furSrc = (v: number | string) => (typeof v === 'number' ? fur(v) : FURN[v])

// 가게 안 정해진 자리 6칸 (세로 방 그림 카드 기준 %, 바닥에서 위로). 배열 순서 = 그리는 순서(뒤 → 앞)
export const SLOTS = [
  { id: 'light', name: '조명', x: 39, bottom: 74, w: 22 },
  { id: 'display', name: '진열대', x: 3, bottom: 33, w: 36 },
  { id: 'counter', name: '카운터', x: 57, bottom: 31, w: 40 },
  { id: 'table', name: '테이블', x: 28, bottom: 11, w: 42 },
  { id: 'deco', name: '소품', x: 2, bottom: 3, w: 26 },
  { id: 'side', name: '가구', x: 70, bottom: 3, w: 28 },
] as const
export type SlotId = (typeof SLOTS)[number]['id']

export type StyleId = 'cute' | 'pretty' | 'cool'
export const STYLE_NAMES: Record<StyleId, string> = { cute: '귀여운', pretty: '예쁜', cool: '멋진' }

// 조명 그림이 없는 가게는 다른 가게 조명 시트에서 같이 쓴다
const LAMPS = ['cafe_light1', 'flower_light0', 'salon_light3', 'bank_light3', 'cafe_light3']

export type Shop = {
  id: string
  name: string
  room: string
  building: string // 마을에 지어질 건물 그림 (보영이 준 건물 그림 bld_*, 2026-11-21)
  lot: { x: number; y: number } // 마을 그림 위 땅 가운데 (%)
  options: Record<SlotId, string[]>
  presets?: Partial<Record<StyleId, Partial<Record<SlotId, string>>>> // 스타일 한 번에 깔기 (스타일 시트가 있는 가게만)
}

// 새 가구 시트(2026-11-21): {가게}_n0~n8 (시트 3×3, 왼쪽 위부터)
const nn = (shop: string, ...k: number[]) => k.map((i) => `${shop}_n${i}`)
const st = (shop: string, ...k: string[]) => k.map((x) => `${shop}_${x}`)
const LIGHTS5 = ['light0', 'light1', 'light2', 'light3', 'light4']

// 순서 = 챕터 순서
export const SHOPS: Shop[] = [
  { id: 'conv', name: '편의점', room: 'conv', building: 'bld_conv', lot: { x: 75, y: 90 },
    options: { light: LAMPS, display: nn('conv', 6, 7, 8), counter: nn('conv', 0, 1, 2), table: nn('conv', 4), deco: nn('conv', 5), side: nn('conv', 3) } },
  { id: 'flower', name: '꽃집', room: 'flower', building: 'bld_flower', lot: { x: 22.5, y: 78 },
    options: { light: st('flower', ...LIGHTS5), display: nn('flower', 0, 1, 4), counter: nn('flower', 2), table: nn('flower', 3, 6), deco: nn('flower', 7, 8), side: nn('flower', 5) } },
  { id: 'bank', name: '은행', room: 'bank', building: 'bld_bank', lot: { x: 77, y: 73.5 },
    options: { light: st('bank', ...LIGHTS5), display: nn('bank', 4, 5), counter: nn('bank', 0, 6), table: nn('bank', 2), deco: nn('bank', 7, 8), side: nn('bank', 1, 3) } },
  { id: 'bakery', name: '빵집', room: 'bakery', building: 'bld_bakery', lot: { x: 33, y: 63.5 },
    options: { light: LAMPS, display: nn('bakery', 0, 8), counter: nn('bakery', 3), table: nn('bakery', 4, 2), deco: nn('bakery', 6, 7, 5), side: nn('bakery', 1) } },
  { id: 'gift', name: '선물가게', room: 'gift', building: 'bld_gift', lot: { x: 80, y: 55 },
    options: { light: LAMPS, display: nn('gift', 0, 5, 4), counter: nn('gift', 2), table: nn('gift', 1), deco: nn('gift', 7, 8, 6), side: nn('gift', 3) } },
  { id: 'market', name: '시장', room: 'market', building: 'bld_market', lot: { x: 16.5, y: 51.5 },
    options: { light: LAMPS, display: nn('market', 0, 1, 2), counter: nn('market', 3), table: nn('market', 5), deco: nn('market', 6, 7), side: nn('market', 4, 8) } },
  { id: 'book', name: '서점', room: 'book', building: 'bld_book', lot: { x: 79, y: 35 },
    options: { light: LAMPS, display: nn('book', 0, 3, 7), counter: nn('book', 1, 6), table: nn('book', 4), deco: nn('book', 8), side: nn('book', 2, 5) } },
  { id: 'clothes', name: '옷가게', room: 'clothes', building: 'bld_clothes', lot: { x: 20.5, y: 35 },
    options: { light: LAMPS, display: nn('clothes', 0, 2), counter: nn('clothes', 5), table: nn('clothes', 6, 7), deco: nn('clothes', 1, 3, 8), side: nn('clothes', 4) } },
  { id: 'salon', name: '미용실', room: 'salon', building: 'bld_salon', lot: { x: 63.5, y: 21 },
    options: { light: st('salon', ...LIGHTS5), display: nn('salon', 4), counter: nn('salon', 1, 7), table: nn('salon', 0, 6, 3), deco: nn('salon', 5), side: nn('salon', 2, 8) } },
  { id: 'cafe', name: '카페', room: 'cafe', building: 'bld_cafe', lot: { x: 26, y: 19.5 },
    options: { light: st('cafe', ...LIGHTS5), display: nn('cafe', 3, 4), counter: nn('cafe', 2), table: nn('cafe', 0), deco: nn('cafe', 7, 5), side: nn('cafe', 1, 6, 8) } },
]
