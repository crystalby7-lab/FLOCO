// 길드 멤버 얼굴: 나는 우리 고양이, 친구들은 각자 다른 품종 고양이 (캐릭터 시트 두 번째 장)
import type { Guild } from '../types'
import { ART } from './CatView'

const BREEDS = ['b_tuxedo', 'b_orange', 'b_black', 'b_calico', 'b_grey', 'b_siamese']

export function breedOf(g: Guild, memberId: string) {
  const m = g.members.find((x) => x.id === memberId)
  if (!m || m.isMe) return 'sit'
  const others = g.members.filter((x) => !x.isMe)
  return BREEDS[Math.max(0, others.indexOf(m)) % BREEDS.length]
}

export function avatarSrc(g: Guild, memberId: string) {
  return ART[breedOf(g, memberId)]
}

// 전신 그림에서 머리 부분만 동그랗게 보여준다
export function Avatar({ g, id, size = 28 }: { g: Guild; id: string; size?: number }) {
  return (
    <span className="av breed-av" style={{ width: size, height: size }}>
      <img src={avatarSrc(g, id)} alt="" />
    </span>
  )
}
