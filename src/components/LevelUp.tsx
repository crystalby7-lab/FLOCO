// 레벨업 축하 창: 왕관 쓴 고양이
import { actions } from '../store'
import type { Cat } from '../types'
import { ART } from './CatView'

const PERKS: Record<number, string> = {
  2: '이제 친구들이 길드 이름 옆에 Lv.2 배지를 봐요',
  3: '상점에 새 옷이 더 들어올 예정이에요',
  5: '기업 도시 지역이 열릴 예정이에요',
}

export function LevelUp({ cat }: { cat: Cat }) {
  return (
    <div className="levelup-bg" onClick={actions.ackLevel}>
      <div className="levelup" onClick={(e) => e.stopPropagation()}>
        <div className="confetti" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} style={{ left: `${(i * 7.3) % 100}%`, animationDelay: `${(i % 7) * 0.12}s` }} />
          ))}
        </div>
        <img className="levelup-art" src={ART.crown} alt="" />
        <div className="levelup-lv">Lv.{cat.level}</div>
        <h2>{cat.name}가 한 뼘 자랐어요</h2>
        <p>근거를 쓰고 같이 돌아본 덕분이에요. 수익이 아니라 생각하는 힘으로 자라요.</p>
        {PERKS[cat.level] && <p className="levelup-perk">{PERKS[cat.level]}</p>}
        <button className="btn btn-primary btn-block" onClick={actions.ackLevel}>
          좋아요
        </button>
      </div>
    </div>
  )
}
