// 우리의 기념 카드 (2026-11-25): 지난 '이번 주 같이 하기' 결과를 한 장씩 모은 앨범.
// 성공한 주도, 다 못 채운 주도 같이 배운 기록으로 남긴다(실패라고 쓰지 않음). 길드 안에서만 보인다.
import { RULES, useGame } from '../store'
import { ART } from './CatView'

const label = (week: string) => {
  const [, m, d] = week.split('-').map(Number)
  return `${m}월 ${Math.ceil(d / 7)}주`
}

export function WeekAlbum() {
  const s = useGame()
  const g = s.guild!
  const log = g.weekLog ?? []
  return (
    <section className="wa">
      <h3 className="wa-title">지난 주 협동 기록</h3>
      {log.length === 0 ? (
        <div className="wa-empty">
          <img src={ART.i_paw} alt="" />
          <span>첫 주를 마치면 여기에 남아요</span>
        </div>
      ) : (
        <div className="wa-row">
          {log.map((w) => (
            <article key={w.week} className={`wa-card ${w.done ? 'done' : ''}`}>
              <small>{label(w.week)}</small>
              <img src={ART[w.done ? 't_jump' : 't_happy']} alt="" />
              <b>{w.mission}</b>
              <span>
                {Math.min(w.total, w.goal)}/{w.goal}
                {w.members ? ` · 친구 ${w.members}명` : ''}
              </span>
              <em>{w.done ? `다 같이 해냈어요 · 코인 +${RULES.weekReward}` : '이번 주에도 같이 배웠어요'}</em>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
