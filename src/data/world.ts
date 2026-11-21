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

const n = (shop: string, ...k: number[]) => k.map((i) => `${shop}_${String(i).padStart(2, '0')}`)
const st = (shop: string, ...k: string[]) => k.map((x) => `${shop}_${x}`)
const P = (shop: string, m: Partial<Record<SlotId, string>>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, `${shop}_${v}`])) as Partial<Record<SlotId, string>>
const LIGHTS5 = ['light0', 'light1', 'light2', 'light3', 'light4']

// 순서 = 챕터 순서
export const SHOPS: Shop[] = [
  { id: 'conv', name: '편의점', room: 'conv', building: 'bld_conv', lot: { x: 75, y: 90 },
    options: { light: LAMPS, display: n('conv', 1, 2, 5, 7), counter: n('conv', 0, 4, 9), table: n('conv', 6, 3), deco: n('conv', 11, 13, 14), side: n('conv', 8, 10, 12) } },
  { id: 'flower', name: '꽃집', room: 'flower', building: 'bld_flower', lot: { x: 22.5, y: 78 },
    options: { light: st('flower', ...LIGHTS5), display: st('flower', 'cute0', 'pretty1', 'cool0', 'cool2'), counter: st('flower', 'cute1', 'pretty2', 'cool1'), table: st('flower', 'cute2', 'cute3', 'cool3'), deco: st('flower', 'cute4', 'pretty4', 'cool4'), side: st('flower', 'pretty0', 'pretty3', 'cool2') },
    presets: {
      cute: P('flower', { light: 'light0', display: 'cute0', counter: 'cute1', table: 'cute2', deco: 'cute4', side: 'cute3' }),
      pretty: P('flower', { light: 'light1', display: 'pretty1', counter: 'pretty2', deco: 'pretty4', side: 'pretty0' }),
      cool: P('flower', { light: 'light4', display: 'cool0', counter: 'cool1', table: 'cool3', deco: 'cool4', side: 'cool2' }),
    } },
  { id: 'bank', name: '은행', room: 'bank', building: 'bld_bank', lot: { x: 77, y: 73.5 },
    options: { light: st('bank', ...LIGHTS5), display: st('bank', 'cute4', 'pretty3', 'cool3', 'cool4'), counter: st('bank', 'cute0', 'pretty0', 'cool0'), table: st('bank', 'cute2', 'pretty2', 'cool2'), deco: st('bank', 'cute1', 'pretty4', 'cool1'), side: st('bank', 'cute3', 'pretty1', 'cool3') },
    presets: {
      cute: P('bank', { light: 'light0', display: 'cute4', counter: 'cute0', table: 'cute2', deco: 'cute1', side: 'cute3' }),
      pretty: P('bank', { light: 'light3', display: 'pretty3', counter: 'pretty0', table: 'pretty2', deco: 'pretty4', side: 'pretty1' }),
      cool: P('bank', { light: 'light2', display: 'cool4', counter: 'cool0', table: 'cool2', deco: 'cool1', side: 'cool3' }),
    } },
  { id: 'bakery', name: '빵집', room: 'bakery', building: 'bld_bakery', lot: { x: 33, y: 63.5 },
    options: { light: LAMPS, display: n('bakery', 0, 7, 6, 12, 14), counter: n('bakery', 1, 4), table: n('bakery', 3, 10), deco: n('bakery', 2, 5, 8, 13), side: n('bakery', 9, 11) } },
  { id: 'gift', name: '선물가게', room: 'gift', building: 'bld_gift', lot: { x: 80, y: 55 },
    options: { light: LAMPS, display: n('gift', 2, 10, 6, 11), counter: n('gift', 1, 5, 9), table: n('gift', 0, 7, 4), deco: n('gift', 8, 13), side: n('gift', 12, 14, 3) } },
  { id: 'market', name: '시장', room: 'market', building: 'bld_market', lot: { x: 16.5, y: 51.5 },
    options: { light: LAMPS, display: n('market', 0, 1, 3, 8, 6), counter: n('market', 9, 2, 4), table: n('market', 13, 7), deco: n('market', 10, 11, 14), side: n('market', 12, 5) } },
  { id: 'book', name: '서점', room: 'book', building: 'bld_book', lot: { x: 79, y: 35 },
    options: { light: LAMPS, display: n('book', 0, 12, 10, 1, 13), counter: n('book', 4, 7, 6), table: n('book', 9, 3), deco: n('book', 14, 5), side: n('book', 2, 11, 8) } },
  { id: 'clothes', name: '옷가게', room: 'clothes', building: 'bld_clothes', lot: { x: 20.5, y: 35 },
    options: { light: LAMPS, display: n('clothes', 1, 2, 8, 3), counter: n('clothes', 0, 10, 6), table: n('clothes', 7, 12), deco: n('clothes', 9, 11, 14), side: n('clothes', 13, 5, 4) } },
  { id: 'salon', name: '미용실', room: 'salon', building: 'bld_salon', lot: { x: 63.5, y: 21 },
    options: { light: st('salon', ...LIGHTS5), display: st('salon', 'cute2', 'pretty2', 'cool2'), counter: st('salon', 'cute3', 'pretty3', 'cool3'), table: st('salon', 'cute0', 'pretty0', 'cool0'), deco: st('salon', 'cute4', 'pretty4', 'cool4'), side: st('salon', 'cute1', 'pretty1', 'cool1') },
    presets: {
      cute: P('salon', { light: 'light0', display: 'cute2', counter: 'cute3', table: 'cute0', deco: 'cute4', side: 'cute1' }),
      pretty: P('salon', { light: 'light3', display: 'pretty2', counter: 'pretty3', table: 'pretty0', deco: 'pretty4', side: 'pretty1' }),
      cool: P('salon', { light: 'light4', display: 'cool2', counter: 'cool3', table: 'cool0', deco: 'cool4', side: 'cool1' }),
    } },
  { id: 'cafe', name: '카페', room: 'cafe', building: 'bld_cafe', lot: { x: 26, y: 19.5 },
    options: { light: st('cafe', ...LIGHTS5), display: st('cafe', 'cute4', 'pretty3', 'pretty4', 'cool2', 'cool3'), counter: st('cafe', 'cute2', 'pretty2', 'cool1'), table: st('cafe', 'cute0', 'pretty0', 'cool0'), deco: st('cafe', 'cute3', 'cool4'), side: st('cafe', 'cute1', 'pretty1', 'cool3') },
    presets: {
      cute: P('cafe', { light: 'light0', display: 'cute4', counter: 'cute2', table: 'cute0', deco: 'cute3', side: 'cute1' }),
      pretty: P('cafe', { light: 'light1', display: 'pretty3', counter: 'pretty2', table: 'pretty0', side: 'pretty1' }),
      cool: P('cafe', { light: 'light4', display: 'cool2', counter: 'cool1', table: 'cool0', deco: 'cool4', side: 'cool3' }),
    } },
]
