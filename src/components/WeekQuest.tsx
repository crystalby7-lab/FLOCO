// 이번 주 같이 하기: 길드 전체가 목표 하나를 같이 채운다. 바는 멤버별 색으로 쌓인다.
// 주마다 목표가 바뀐다 (피드백 주고받기 → 근거 쓰고 사기 → 길드 이야기).
import { actions, useGame } from '../store'
import { RULES } from '../store'
import { Avatar } from './Avatar'
import type { Guild } from '../types'

const COLORS = ['#5b8def', '#f07b8f', '#46b39d', '#f2a33a', '#8d7bea']
// 이번 주 월요일 0시
export function weekStart(t = Date.now()) {
  const d = new Date(t)
  const day = (d.getDay() + 6) % 7
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}
type Q = { id: string; title: string; goal: number; count: (g: Guild, id: string, since: number) => number }
const QUESTS: Q[] = [
  { id: 'review', title: '친구 거래에 피드백 10개', goal: 10, count: (g, id, since) => g.proposals.reduce((n, p) => n + (p.reviews ?? []).filter((r) => r.memberId === id && r.at >= since).length, 0) },
  { id: 'trade', title: '근거 쓰고 사기 4번', goal: 4, count: (g, id, since) => g.proposals.filter((p) => p.proposerId === id && (p.boughtAt ?? 0) >= since).length },
  { id: 'talk', title: '길드에 이야기 12개', goal: 12, count: (g, id, since) => g.board.reduce((n, p) => n + (p.memberId === id && p.at >= since ? 1 : 0) + (p.comments ?? []).filter((c) => c.memberId === id && c.at >= since).length, 0) },
]

export function WeekQuest() {
  const s = useGame()
  const g = s.guild!
  const start = weekStart()
  const key = start.toISOString().slice(0, 10)
  const weekNo = Math.floor(start.getTime() / (7 * 86_400_000))
  const q = QUESTS[weekNo % QUESTS.length]
  const parts = g.members.map((m, i) => ({ m, n: q.count(g, m.id, start.getTime()), c: COLORS[i % COLORS.length] }))
  const total = parts.reduce((a, p) => a + p.n, 0)
  const done = total >= q.goal
  const claimed = g.weekClaimed === key
  const left = Math.max(0, Math.ceil((start.getTime() + 7 * 86_400_000 - Date.now()) / 86_400_000))
  return (
    <section className="card wq">
      <div className="wq-head">
        <small>이번 주 같이 하기 · {left}일 남음</small>
        <b>{q.title}</b>
      </div>
      <div className="wq-bar" aria-label={`${total}/${q.goal}`}>
        {parts.map((p) => (p.n > 0 ? <i key={p.m.id} style={{ width: `${(Math.min(p.n, q.goal) / q.goal) * 100}%`, background: p.c }} /> : null))}
        <span>
          {Math.min(total, q.goal)}/{q.goal}
        </span>
      </div>
      <ul className="wq-who">
        {parts.map((p) => (
          <li key={p.m.id}>
            <span className="wq-dot" style={{ background: p.c }} />
            <Avatar g={g} id={p.m.id} size={26} />
            <small>{p.m.nickname}</small>
            <b>{p.n}</b>
          </li>
        ))}
      </ul>
      <button className="btn btn-primary btn-block" disabled={!done || claimed} onClick={() => actions.claimWeek(key)}>
        {claimed ? '이번 주 보상 받았어요' : done ? `다 채웠어요! 코인 +${RULES.weekReward} 받기` : `다 채우면 길드 코인 +${RULES.weekReward}`}
      </button>
    </section>
  )
}
