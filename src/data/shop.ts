// F9 상점 아이템 (shopItems 컬렉션 자리)
// 원칙: 보이는 것만 바꾸는 아이템, 투자에 유리한 아이템·확률형 뽑기 없음

export type ShopItem = {
  id: string
  name: string
  kind: 'food' | 'deco'
  price: number
  effect?: { hunger?: number; mood?: number }
  slot?: 'head' | 'neck' | 'face' | 'room'
  emoji: string
}

export const SHOP: ShopItem[] = [
  { id: 'feed', name: '기본 사료', kind: 'food', price: 100, effect: { hunger: 30 }, emoji: '🥣' },
  { id: 'snack', name: '참치 간식', kind: 'food', price: 180, effect: { hunger: 15, mood: 25 }, emoji: '🐟' },
  { id: 'toy', name: '깃털 장난감', kind: 'food', price: 150, effect: { mood: 30 }, emoji: '🪶' },
  { id: 'ribbon', name: '빨간 리본', kind: 'deco', price: 800, slot: 'head', emoji: '🎀' },
  { id: 'beanie', name: '털모자', kind: 'deco', price: 1200, slot: 'head', emoji: '🧶' },
  { id: 'scarf', name: '파란 목도리', kind: 'deco', price: 1000, slot: 'neck', emoji: '🧣' },
  { id: 'glasses', name: '동그란 안경', kind: 'deco', price: 1500, slot: 'face', emoji: '👓' },
  { id: 'cushion', name: '노란 방석', kind: 'deco', price: 2000, slot: 'room', emoji: '🟡' },
  { id: 'plant', name: '화분', kind: 'deco', price: 1800, slot: 'room', emoji: '🪴' },
]

export const itemOf = (id: string) => SHOP.find((s) => s.id === id)
