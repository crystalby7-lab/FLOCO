// F9 상점 아이템 (shopItems 컬렉션 자리)
// 원칙: 보이는 것만 바꾸는 아이템, 투자에 유리한 아이템·확률형 뽑기 없음
// 옷·가구 그림은 보영이 그린 캐릭터 시트에서 가져옴

export type ShopItem = {
  id: string
  name: string
  kind: 'food' | 'deco'
  price: number
  effect?: { hunger?: number; mood?: number }
  slot?: 'outfit' | 'room' // 옷은 한 번에 하나, 가구는 여러 개
  desc?: string
}

export const SHOP: ShopItem[] = [
  { id: 'feed', name: '기본 사료', kind: 'food', price: 100, effect: { hunger: 30 } },
  { id: 'snack', name: '생선 인형 간식', kind: 'food', price: 180, effect: { hunger: 15, mood: 25 } },
  { id: 'boba', name: '버블티', kind: 'food', price: 200, effect: { hunger: 10, mood: 30 } },
  { id: 'toy', name: '낚싯대 장난감', kind: 'food', price: 150, effect: { mood: 30 } },
  { id: 'hoodie', name: '하늘 후드', kind: 'deco', price: 1200, slot: 'outfit' },
  { id: 'beret', name: '베레모 세트', kind: 'deco', price: 1500, slot: 'outfit' },
  { id: 'dino', name: '공룡 옷', kind: 'deco', price: 1800, slot: 'outfit' },
  { id: 'duck', name: '오리 옷', kind: 'deco', price: 1800, slot: 'outfit' },
  { id: 'scarf', name: '빨간 목도리', kind: 'deco', price: 900, slot: 'outfit' },
  { id: 'box', name: '종이 상자', kind: 'deco', price: 600, slot: 'room', desc: '가끔 들어가서 놀아요' },
  { id: 'cushion', name: '체크 방석', kind: 'deco', price: 1000, slot: 'room', desc: '방석에서 낮잠 자요' },
  { id: 'bed', name: '동굴 침대', kind: 'deco', price: 2200, slot: 'room', desc: '졸리면 들어가요' },
]

export const itemOf = (id: string) => SHOP.find((s) => s.id === id)
