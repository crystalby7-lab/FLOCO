// 길드 멤버 얼굴: 나는 내가 꾸민 프로필, 친구들은 각자 다른 품종 고양이 (캐릭터 시트)
import type { AvatarLook, Guild } from '../types'
import { useGame } from '../store'
import { ART } from './CatView'

const BREEDS = ['b_tuxedo', 'b_orange', 'b_black', 'b_calico', 'b_grey', 'b_siamese']
export const DEFAULT_LOOK: AvatarLook = { art: 'sit', bg: '#eef4fb' }

export function breedOf(g: Guild, memberId: string) {
  const m = g.members.find((x) => x.id === memberId)
  if (!m || m.isMe) return 'sit'
  const others = g.members.filter((x) => !x.isMe)
  return BREEDS[Math.max(0, others.indexOf(m)) % BREEDS.length]
}

// 동그란 프로필: 배경색 + 전신 그림의 머리 부분 + 작은 스티커
export function AvatarView({ look, size = 28 }: { look: AvatarLook; size?: number }) {
  return (
    <span className="av breed-av" style={{ width: size, height: size, background: look.bg }}>
      <img src={ART[look.art]} alt="" />
      {look.sticker && <img className="av-sticker" src={ART[look.sticker]} alt="" style={{ width: Math.max(12, size * 0.36) }} />}
    </span>
  )
}

export function Avatar({ g, id, size = 28 }: { g: Guild; id: string; size?: number }) {
  const s = useGame()
  const m = g.members.find((x) => x.id === id)
  const look = m?.isMe ? (s.user?.avatar ?? DEFAULT_LOOK) : { art: breedOf(g, id), bg: '#eef4fb' }
  return <AvatarView look={look} size={size} />
}
