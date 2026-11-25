// 이번 주 같이 하기 (기능 A·D): 길드 공동 목표 하나를 같이 채운다.
// - 주는 한국 시간 월요일 0시 ~ 일요일 23:59:59. 주마다 미션 4종을 돌아가며.
// - 진행도는 '친구들의 발자국'(guild.acts)으로 센다. 같은 레슨·같은 거래는 한 번만(key 중복 없음).
// - 투자 수익률·거래 금액·매매 횟수는 세지 않는다. 목표치는 인원수에 맞춰 바뀐다(GOAL_PER_MEMBER).
// - 진행도가 오르면 고양이가 반응하고, 다 채우면 축하 + 길드 코인.
import { useEffect, useState } from 'react'
import { actions, RULES, useGame } from '../store'
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

const MILESTONE = ['', '4분의 1 왔어요!', '절반을 해냈어요!', '거의 다 왔어요!']

export function WeekQuest() {
  const s = useGame()
  const g = s.guild!
  const start = weekStartKST()
  const w = weekMission(g, start)
  const claimed = g.weekClaimed === w.week
  const left = Math.max(1, Math.ceil((start + 7 * 86_400_000 - Date.now()) / 86_400_000))
  const pct = Math.min(100, (w.total / w.goal) * 100)
  const helped = w.by.filter((p) => p.n > 0).length

  // 지난주 결과를 한 번 기록 (기념 카드)
  useEffect(() => {
    const prev = weekMission(g, start - 7 * 86_400_000)
    if (g.createdAt < start && !(g.weekLog ?? []).some((x) => x.week === prev.week))
      actions.logWeek({ week: prev.week, mission: prev.title, total: prev.total, goal: prev.goal, done: prev.done, members: prev.by.filter((p) => p.n > 0).length })
  }, [g, start])

  // 25·50·75% 지점을 처음 넘으면 고양이가 한 번 반응 (기기마다 한 번, 다시 열면 안 나옴)
  const msKey = `floco-week-ms-${w.week}`
  const [say, setSay] = useState('')
  useEffect(() => {
    const reached = Math.min(3, Math.floor(pct / 25))
    let seen = 0
    try {
      seen = Number(localStorage.getItem(msKey) ?? 0)
    } catch {
      /* 저장 못 해도 괜찮음 */
    }
    if (reached > seen) {
      setSay(MILESTONE[reached])
      try {
        localStorage.setItem(msKey, String(reached))
      } catch {
        /* */
      }
      const t = setTimeout(() => setSay(''), 2600)
      return () => clearTimeout(t)
    }
  }, [pct, msKey])

  const party = w.done && !claimed
  return (
    <section className={`card wq2 ${party ? 'party' : ''} ${claimed ? 'claimed' : ''}`}>
      <div className="wq2-head">
        <small>이번 주 같이 하기 · {claimed ? '완료' : `${left}일 남음`}</small>
        <b>{w.title}</b>
      </div>

      <div className="wq2-track">
        <div className="wq2-bar">
          {w.by.map((p) => (p.n > 0 ? <i key={p.m.id} style={{ width: `${(Math.min(p.n, w.goal) / w.goal) * 100}%`, background: p.c }} /> : null))}
        </div>
        {[25, 50, 75].map((m) => (
          <span key={m} className={`wq2-ms ${pct >= m ? 'on' : ''}`} style={{ left: `${m}%` }} />
        ))}
        <span className={`wq2-goal ${w.done ? 'on' : ''}`}>
          <img src={ART.i_fish} alt="" />
        </span>
        <span className="wq2-walker" style={{ left: `${Math.max(4, Math.min(92, pct))}%` }}>
          {say && <em>{say}</em>}
          <img src={ART[party ? 't_jump' : say ? 't_happy' : 'walk']} alt="" />
        </span>
      </div>

      <div className="wq2-foot">
        <span className="wq2-who">
          {w.by.map((p) => (
            <span key={p.m.id} className={p.n ? '' : 'zero'} title={p.m.isMe ? '나' : p.m.nickname}>
              <Avatar g={g} id={p.m.id} size={26} />
              {p.n > 0 && <b style={{ background: p.c }}>{p.n}</b>}
            </span>
          ))}
        </span>
        <span className="wq2-count">
          <b>{Math.min(w.total, w.goal)}</b>/{w.goal}
        </span>
      </div>

      {party ? (
        <button className="btn btn-primary btn-block" onClick={() => actions.claimWeek({ week: w.week, mission: w.title, total: w.total, goal: w.goal, done: true, members: helped })}>
          다 같이 채웠어요 · 코인 +{RULES.weekReward} 받기
        </button>
      ) : (
        !claimed && <p className="wq2-reward">다 채우면 길드 코인 +{RULES.weekReward}</p>
      )}
    </section>
  )
}
