// 길드 멤버 얼굴 (친구 고양이 그림)
import type { Guild } from '../types'
import { ART } from './CatView'

const FACES = ['friend_grey', 'friend_orange', 'friend_black', 'friend_fluffy']

export function avatarSrc(g: Guild, memberId: string) {
  const i = Math.max(0, g.members.findIndex((m) => m.id === memberId))
  return ART[FACES[i % FACES.length]]
}

export function Avatar({ g, id, size = 28 }: { g: Guild; id: string; size?: number }) {
  return <img className="av" src={avatarSrc(g, id)} width={size} height={size} alt="" />
}
