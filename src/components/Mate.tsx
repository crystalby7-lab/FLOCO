// 길드 화면의 친구 표시 (2026-11-27 보영: "고양이는 길드당 한 마리, 변하지 않아").
// 길드에선 친구를 고양이 그림 프로필 대신 이름 첫 글자 색 동그라미로 — 고양이가 여러 마리로 보이지 않게.
import type { Guild } from '../types'

export const MATE_COLORS = ['#5b8def', '#f07b8f', '#46b39d', '#f2a33a', '#8d7bea']
export const mateColor = (g: Guild, id: string) => MATE_COLORS[Math.max(0, g.members.findIndex((m) => m.id === id)) % MATE_COLORS.length]

export function Mate({ g, id, size = 40 }: { g: Guild; id: string; size?: number }) {
  const m = g.members.find((x) => x.id === id)
  const name = m?.nickname || '?' // 나도 내 닉네임 첫 글자 ('나'로 쓰면 '나비' 같은 친구와 헷갈림)
  return (
    <span className="mate" style={{ width: size, height: size, fontSize: size * 0.42, background: mateColor(g, id) }} aria-label={name}>
      {name.slice(0, 1)}
    </span>
  )
}
