// 친구들의 발자국 (기능 B): 길드원이 실제로 한 일 한 줄씩. 금액·수익률은 남기지 않는다.
import { useState } from 'react'
import { useGame } from '../store'
import { ART } from './CatView'
import type { ActKind } from '../types'

const ICON: Record<ActKind, string> = { lesson: 'i_star', review: 'i_heart', reason: 'i_paw', retro: 'i_paw', care: 'i_fish', post: 'i_paw' }
const ago = (at: number) => {
  const m = Math.floor((Date.now() - at) / 60000)
  return m < 1 ? '방금' : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`
}

export function Footprints() {
  const s = useGame()
  const g = s.guild!
  const [more, setMore] = useState(false)
  const acts = g.acts ?? []
  const list = more ? acts.slice(0, 30) : acts.slice(0, 5)
  const name = (id: string) => {
    const m = g.members.find((x) => x.id === id)
    return m ? (m.isMe ? '내가' : `${m.nickname}${(m.nickname.charCodeAt(m.nickname.length - 1) - 0xac00) % 28 ? '이' : '가'}`) : '떠난 친구가'
  }
  return (
    <section className="card fp">
      <h3 className="card-title">친구들의 발자국</h3>
      {acts.length === 0 ? (
        <p className="fp-empty">
          <img src={ART.i_paw} alt="" />
          {g.members.length < 2 ? '친구를 부르면 여기에 같이 한 일이 쌓여요' : '레슨을 끝내거나 피드백을 남기면 발자국이 찍혀요'}
        </p>
      ) : (
        <ul>
          {list.map((a) => (
            <li key={a.id}>
              <span className={`fp-ic fk-${a.kind}`}>
                <img src={ART[ICON[a.kind]]} alt="" />
              </span>
              <p>
                <b>{name(a.memberId)}</b> {a.text}
              </p>
              <small>{ago(a.at)}</small>
            </li>
          ))}
        </ul>
      )}
      {acts.length > 5 && (
        <button className="text-btn fp-more" onClick={() => setMore(!more)}>
          {more ? '접기' : '더 보기'}
        </button>
      )}
    </section>
  )
}
