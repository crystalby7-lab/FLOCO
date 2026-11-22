// 이번 주 같이 하기 (기능 A·D): 길드 공동 목표 하나를 같이 채운다.
// - 주는 한국 시간 월요일 0시 ~ 일요일 23:59:59. 주마다 미션 4종을 돌아가며.
// - 진행도는 '친구들의 발자국'(guild.acts)으로 센다. 같은 레슨·같은 거래는 한 번만(key 중복 없음).
// - 투자 수익률·거래 금액·매매 횟수는 세지 않는다. 목표치는 인원수에 맞춰 바뀐다(GOAL_PER_MEMBER).
// - 진행도가 오르면 고양이가 반응하고, 다 채우면 축하 + 길드 코인.
import { useEffect, useRef, useState } from 'react'
import { actions, catNow, RULES, useGame } from '../store'
import { ART } from './CatView'
import { Avatar } from './Avatar'
import type { ActKind, Guild } from '../types'

const COLORS = ['#5b8def', '#f07b8f', '#46b39d', '#f2a33a', '#8d7bea']
const KST = 9 * 3_600_000

// 한국 시간 기준 이번 주 월요일 0시 (UTC ms)
export function weekStartKST(t = Date.now()) {
  const k = new Date(t + KST)
  const day = (k.getUTCDay() + 6) % 7
  return Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() - day) - KST
}
export const weekId = (start: number) => new Date(start + KST).toISOString().slice(0, 10)

type Mission = { id: ActKind; title: (goal: number) => string; perMember: number }
// 목표치 = 인원 × perMember (2~5명 규모에 맞게 여기서 조정)
export const MISSIONS: Mission[] = [
  { id: 'lesson', title: (n) => `레슨 ${n}개 같이 끝내기`, perMember: 3 },
  { id: 'review', title: (n) => `친구 근거에 피드백 ${n}개`, perMember: 2 },
  { id: 'reason', title: (n) => `투자 근거 3칸 ${n}번 쓰기`, perMember: 1 },
  { id: 'retro', title: (n) => `팔고 돌아보기 ${n}번`, perMember: 1 },
]
export function weekMission(g: Guild, start: number) {
  const m = MISSIONS[Math.floor(start / (7 * 86_400_000)) % MISSIONS.length]
  const n = Math.max(2, g.members.length)
  const goal = m.perMember * n + (m.id === 'lesson' ? 1 : 0)
  const end = start + 7 * 86_400_000
  const acts = (g.acts ?? []).filter((a) => a.kind === m.id && a.at >= start && a.at < end)
  const by = g.members.map((mem, i) => ({ m: mem, n: acts.filter((a) => a.memberId === mem.id).length, c: COLORS[i % COLORS.length] }))
  const total = by.reduce((a, b) => a + b.n, 0)
  return { m, goal, title: m.title(goal), by, total, done: total >= goal, week: weekId(start) }
}

export function WeekQuest() {
  const s = useGame()
  const g = s.guild!
  const start = weekStartKST()
  const w = weekMission(g, start)
  const claimed = g.weekClaimed === w.week
  const left = Math.max(1, Math.ceil((start + 7 * 86_400_000 - Date.now()) / 86_400_000))
  const cat = catNow(g.cat)

  // 지난주 결과를 한 번 기록
  useEffect(() => {
    const prev = weekMission(g, start - 7 * 86_400_000)
    if (g.createdAt < start && !(g.weekLog ?? []).some((x) => x.week === prev.week)) actions.logWeek({ week: prev.week, mission: prev.title, total: prev.total, goal: prev.goal, done: prev.done })
  }, [g, start])

  // 진행도가 오르면 고양이 반응 (지난번 본 값과 비교, 기기마다)
  const seenKey = `floco-week-seen-${w.week}`
  const [bump, setBump] = useState(0)
  const first = useRef(true)
  useEffect(() => {
    let seen = 0
    try {
      seen = Number(localStorage.getItem(seenKey) ?? 0)
    } catch {
      /* 저장 못 해도 괜찮음 */
    }
    if (w.total > seen && !first.current) setBump(w.total - seen)
    if (w.total > seen && first.current && seen > 0) setBump(w.total - seen)
    first.current = false
    try {
      localStorage.setItem(seenKey, String(w.total))
    } catch {
      /* */
    }
    if (w.total > seen) {
      const t = setTimeout(() => setBump(0), 2600)
      return () => clearTimeout(t)
    }
  }, [w.total, seenKey])

  const last = (g.weekLog ?? [])[0]
  const face = w.done && !claimed ? 't_jump' : bump ? 't_happy' : cat.hunger < 40 ? 'face_sad' : 'sit'

  return (
    <section className={`card wq ${w.done && !claimed ? 'party' : ''}`}>
      <div className="wq-top">
        <div className="wq-head">
          <small>이번 주 같이 하기 · {left}일 남음</small>
          <b>{w.title}</b>
        </div>
        <span className="wq-cat">
          <img key={face + bump} src={ART[face]} alt="" />
          {bump > 0 && <em>+{bump}</em>}
        </span>
      </div>
      <div className="wq-bar" aria-label={`${w.total}/${w.goal}`}>
        {w.by.map((p) => (p.n > 0 ? <i key={p.m.id} style={{ width: `${(Math.min(p.n, w.goal) / w.goal) * 100}%`, background: p.c }} /> : null))}
        <span>
          {Math.min(w.total, w.goal)}/{w.goal}
        </span>
      </div>
      <ul className="wq-who">
        {w.by.map((p) => (
          <li key={p.m.id}>
            <span className="wq-dot" style={{ background: p.c }} />
            <Avatar g={g} id={p.m.id} size={24} />
            <small>{p.m.isMe ? '나' : p.m.nickname}</small>
            <b>{p.n}</b>
          </li>
        ))}
      </ul>
      {w.done && !claimed && <p className="wq-party">다 같이 채웠어요! {g.cat.name}가 신났어요</p>}
      <button className="btn btn-primary btn-block" disabled={!w.done || claimed} onClick={() => actions.claimWeek({ week: w.week, mission: w.title, total: w.total, goal: w.goal, done: true })}>
        {claimed ? `이번 주 보상 받았어요 · 상점에서 ${g.cat.name} 선물 사기` : w.done ? `길드 코인 +${RULES.weekReward} 받기` : `다 채우면 길드 코인 +${RULES.weekReward}`}
      </button>
      {last && (
        <p className="wq-last">
          지난주 · {last.mission} {last.done ? '성공' : `${last.total}/${last.goal}`}
        </p>
      )}
    </section>
  )
}
