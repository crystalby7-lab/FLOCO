// 길드 맨 위 (2026-11-27, 보영: "우리는 한 고양이를 같이 키운다"): 길드 이름 줄 + 홈과 같은 '고양이 돌보러 가기' 배너.
// 친구 프로필이 둘러선 마당 장면은 고양이가 여러 마리로 보여서 뺐다.
import { useState } from 'react'
import { useGame } from '../store'
import { ART } from './CatView'
import { GuildDeco, lookOf } from './GuildBanner'
import { CareBanner } from './CareBanner'
import { CatWorld } from '../screens/CatWorld'

export function GuildYard() {
  const s = useGame()
  const g = s.guild!
  const [edit, setEdit] = useState(false)
  const [world, setWorld] = useState(false)
  const look = lookOf(g)
  return (
    <section className="gy">
      <div className="gy-top">
        <span className="gy-name">
          <img src={ART[look.emblem]} alt="" />
          <b>{g.name}</b>
          <small>{g.members.length}/5</small>
        </span>
        <button className="gy-edit" aria-label="길드 꾸미기" onClick={() => setEdit(true)}>
          <img src={ART.i_star} alt="" />
        </button>
      </div>
      <CareBanner onOpen={() => setWorld(true)} label={`우리가 같이 키우는 ${g.cat.name}`} />
      {edit && <GuildDeco g={g} onClose={() => setEdit(false)} />}
      {world && <CatWorld start={0} dress={false} onExit={() => setWorld(false)} />}
    </section>
  )
}
