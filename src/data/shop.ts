// F9 상점 아이템 (shopItems 컬렉션 자리)
// 원칙: 보이는 것만 바꾸는 아이템, 투자에 유리한 아이템·확률형 뽑기 없음
// 옷·가구 그림은 보영이 그린 캐릭터 시트에서 가져옴

export type ShopItem = {
  id: string
  name: string
  kind: 'food' | 'deco' | 'place'
  price: number
  effect?: { hunger?: number; mood?: number; clean?: number }
  slot?: 'outfit' | 'room' // 옷은 한 번에 하나, 가구는 여러 개
  desc?: string
}

export const SHOP: ShopItem[] = [
  { id: 'feed', name: '기본 사료', kind: 'food', price: 100, effect: { hunger: 30 } },
  { id: 'snack', name: '생선 인형 간식', kind: 'food', price: 180, effect: { hunger: 15, mood: 25 } },
  { id: 'boba', name: '버블티', kind: 'food', price: 200, effect: { hunger: 10, mood: 30 } },
  { id: 'toy', name: '낚싯대 장난감', kind: 'food', price: 150, effect: { mood: 30 } },
  { id: 'bath', name: '거품 목욕', kind: 'food', price: 80, effect: { clean: 100, mood: 5 } },
  { id: 'hoodie', name: '하늘 고양이 후드', kind: 'deco', price: 1200, slot: 'outfit' },
  { id: 'duck', name: '노랑 우비', kind: 'deco', price: 1200, slot: 'outfit' },
  { id: 'beret', name: '세일러 베레모', kind: 'deco', price: 1500, slot: 'outfit' },
  { id: 'scarf', name: '빨간 목도리', kind: 'deco', price: 900, slot: 'outfit' },
  { id: 'bear', name: '곰돌이 옷', kind: 'deco', price: 1800, slot: 'outfit' },
  { id: 'dino', name: '공룡 옷', kind: 'deco', price: 1800, slot: 'outfit' },
  { id: 'frog', name: '개구리 옷', kind: 'deco', price: 1800, slot: 'outfit' },
  { id: 'bunny', name: '토끼 망토', kind: 'deco', price: 2000, slot: 'outfit' },
  { id: 'witch', name: '마법사 모자', kind: 'deco', price: 2200, slot: 'outfit' },
  { id: 'cloak', name: '보라 망토', kind: 'deco', price: 2200, slot: 'outfit' },
  { id: 'santa', name: '산타 옷', kind: 'deco', price: 2000, slot: 'outfit' },
  { id: 'prince', name: '왕관 망토', kind: 'deco', price: 3000, slot: 'outfit', desc: 'Lv.3부터 어울려요' },
  { id: 'police', name: '경찰 모자', kind: 'deco', price: 1600, slot: 'outfit' },
  { id: 'chef', name: '요리사 모자', kind: 'deco', price: 1600, slot: 'outfit' },
  { id: 'coat', name: '검정 코트', kind: 'deco', price: 1700, slot: 'outfit' },
  { id: 'ribbon', name: '리본 셔츠', kind: 'deco', price: 1300, slot: 'outfit' },
  { id: 'artist', name: '화가 베레모', kind: 'deco', price: 1400, slot: 'outfit' },
  { id: 'headphone', name: '헤드폰', kind: 'deco', price: 1300, slot: 'outfit' },
  { id: 'bow', name: '검정 리본', kind: 'deco', price: 800, slot: 'outfit' },
  { id: 'shades', name: '선글라스', kind: 'deco', price: 1000, slot: 'outfit' },
  { id: 'star_shades', name: '별 안경', kind: 'deco', price: 1100, slot: 'outfit' },
  { id: 'box', name: '종이 상자', kind: 'deco', price: 600, slot: 'room', desc: '가끔 들어가서 놀아요' },
  { id: 'cushion', name: '체크 방석', kind: 'deco', price: 1000, slot: 'room', desc: '방석에서 낮잠 자요' },
  { id: 'bed', name: '동굴 침대', kind: 'deco', price: 2200, slot: 'room', desc: '졸리면 들어가요' },
  // 테마(장소): 홈에서 옆으로 넘기면 나오는 곳. 사면 고양이가 거기서도 놀아요.
  { id: 'yard', name: '마당', kind: 'place', price: 3000, desc: '잔디밭에서 나비를 쫓아요' },
  { id: 'rooftop', name: '옥상', kind: 'place', price: 5000, desc: '노을 보면서 바람 쐬요' },
  { id: 'beach', name: '바닷가', kind: 'place', price: 8000, desc: '파도 소리 들으며 낮잠 자요' },
]

// 홈에서 옆으로 넘기는 순서. 방은 처음부터 있어요.
export const PLACES = [
  { id: 'room', name: '거실' },
  { id: 'yard', name: '마당' },
  { id: 'rooftop', name: '옥상' },
  { id: 'beach', name: '바닷가' },
] as const
export type PlaceId = (typeof PLACES)[number]['id']

export const itemOf = (id: string) => SHOP.find((s) => s.id === id)
