// 우리 마을: 길드 금고로 건물·나무·소품을 사서 빈 땅에 짓는다 (마을 시트 그림)
export type TownItem = { id: string; name: string; kind: 'building' | 'nature' | 'deco'; price: number; size: number }

export const TOWN: TownItem[] = [
  { id: 't_navy', name: '남색 지붕 집', kind: 'building', price: 1500, size: 86 },
  { id: 't_bluehouse', name: '파랑 고양이 집', kind: 'building', price: 1800, size: 88 },
  { id: 't_redroof', name: '빨간 지붕 집', kind: 'building', price: 1800, size: 88 },
  { id: 't_cafe', name: '고양이 카페', kind: 'building', price: 2500, size: 92 },
  { id: 't_shop', name: '고양이 상점가', kind: 'building', price: 2500, size: 92 },
  { id: 't_pink', name: '분홍 빌딩', kind: 'building', price: 3000, size: 96 },
  { id: 't_bluecat', name: '고양이 은행', kind: 'building', price: 3500, size: 96 },
  { id: 't_church', name: '하얀 고양이 성당', kind: 'building', price: 3500, size: 96 },
  { id: 't_clock', name: '시계탑', kind: 'building', price: 4000, size: 100 },
  { id: 't_school', name: '플로코 학교', kind: 'building', price: 5000, size: 104 },
  { id: 't_dome', name: '유리 도서관', kind: 'building', price: 6000, size: 108 },
  { id: 't_stadium', name: '고양이 경기장', kind: 'building', price: 8000, size: 112 },
  { id: 't_tree', name: '둥근 나무', kind: 'nature', price: 300, size: 56 },
  { id: 't_sakura', name: '벚나무', kind: 'nature', price: 500, size: 56 },
  { id: 't_pine', name: '소나무', kind: 'nature', price: 300, size: 60 },
  { id: 't_fountain', name: '분수', kind: 'deco', price: 1200, size: 60 },
  { id: 't_greenhouse', name: '유리 온실', kind: 'deco', price: 1500, size: 62 },
  { id: 't_tram', name: '꼬마 트램', kind: 'deco', price: 1500, size: 50 },
  { id: 't_vending', name: '자판기', kind: 'deco', price: 600, size: 50 },
  { id: 't_booth', name: '빨간 공중전화', kind: 'deco', price: 500, size: 50 },
  { id: 't_bench', name: '벤치', kind: 'deco', price: 300, size: 34 },
  { id: 't_lamp', name: '가로등', kind: 'deco', price: 300, size: 56 },
]
export const townItem = (id: string) => TOWN.find((t) => t.id === id)
export const TOWN_SLOTS = 12
