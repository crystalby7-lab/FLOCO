// 새 고양이 캐릭터 5종 (보영 GPT 그림, 2026-11-18). 종마다 표정 7개(e0~e6) + 옷 7벌(o0~o6).
// 길드는 고양이 한 마리(한 종)를 키운다. 키우는 고양이 레벨이 오르면 다른 종이 하나씩 열려 프로필에 쓸 수 있다.
import type { Cat } from '../types'

const files = import.meta.glob('../assets/kitty/*.webp', { eager: true, import: 'default' }) as Record<string, string>
export const KIT: Record<string, string> = Object.fromEntries(Object.entries(files).map(([p, u]) => [p.split('/').pop()!.replace('.webp', ''), u]))

export type BreedId = 'calico' | 'cream' | 'grey' | 'orange' | 'black'
export const BREEDS: { id: BreedId; name: string; desc: string }[] = [
  { id: 'calico', name: '삼색이', desc: '호기심 많은 얼룩 고양이' },
  { id: 'cream', name: '솜뭉치', desc: '털이 복슬복슬한 크림 고양이' },
  { id: 'grey', name: '회색 줄무늬', desc: '차분한 고등어 고양이' },
  { id: 'orange', name: '치즈', desc: '밝고 씩씩한 치즈 고양이' },
  { id: 'black', name: '까망이', desc: '노란 눈이 반짝이는 검은 고양이' },
]
export const DEFAULT_BREED: BreedId = 'calico'
export const breedOfCat = (cat?: Pick<Cat, 'breed'> | null): BreedId => (cat?.breed as BreedId) ?? DEFAULT_BREED

// 표정: 0 기본 · 1 신남 · 2 웃음 · 3 놀람 · 4 울음 · 5 화남 · 6 졸림
export const EMOTES = ['기본', '신남', '웃음', '놀람', '울음', '화남', '졸림'] as const

export const OUTFIT_NAMES: Record<BreedId, string[]> = {
  cream: ['세일러', '셰프', '꽃 모자', '책 읽는 날', '노란 우비', '왕관 망토', '비행사'],
  calico: ['카페 앞치마', '셰프', '꽃다발 원피스', '책 읽는 날', '파란 모자', '리본 원피스', '회사원'],
  grey: ['선생님', '눈꽃 스웨터', '곰돌이 후드', '분홍 망토', '마법사', '탐정', '신사'],
  orange: ['멜빵바지', '공룡 후드', '세일러', '리본 원피스', '꿀벌', '비행사', '탐험가'],
  black: ['멜빵바지', '공룡 후드', '세일러', '리본 원피스', '꿀벌', '비행사', '탐험가'],
}

export const kit = (breed: BreedId, key: string) => KIT[`${breed}_${key}`]

// 키우는 고양이 레벨이 이만큼 되면 다른 종이 하나씩 열린다 (키우는 종은 처음부터 열림)
export const UNLOCK_LEVELS = [3, 5, 7, 10]
export function breedLocks(cat: Cat): { id: BreedId; open: boolean; level: number }[] {
  const mine = breedOfCat(cat)
  const others = BREEDS.filter((b) => b.id !== mine)
  return [{ id: mine, open: true, level: 0 }, ...others.map((b, i) => ({ id: b.id, open: cat.level >= UNLOCK_LEVELS[i], level: UNLOCK_LEVELS[i] }))]
}
