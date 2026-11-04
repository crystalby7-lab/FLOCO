// 상점 (F9): 가상 골드로만 구매, 투자에 유리한 아이템·확률형 뽑기 없음
import { useState } from 'react'
import { actions, useGame } from '../store'
import { SHOP } from '../data/shop'
import { Gold } from '../components/ui'
import { Backdrop, Playground, timeOfDay } from '../components/Playground'
import { ItemIcon } from '../components/Icons'
import { ART } from '../components/CatView'

const ICON: Record<string, string> = {
  snack: ART.hug,
  boba: ART.boba,
  toy: ART.toy,
  hoodie: ART.hoodie,
  beret: ART.beret,
  dino: ART.dino,
  duck: ART.duck,
  scarf: ART.scarf,
  box: ART.box,
  cushion: ART.sleep,
  bed: ART.bed,
}

export function Shop() {
  const s = useGame()
  const g = s.guild!
  const [msg, setMsg] = useState('')

  const buy = (id: string) => {
    const err = actions.buyItem(id)
    setMsg(err ?? '샀어요!')
    setTimeout(() => setMsg(''), 1500)
  }

  const section = (kind: 'food' | 'deco' | 'place', title: string) => (
    <>
      <h2 className="section-title">{title}</h2>
      <div className="shop-grid">
        {SHOP.filter((i) => i.kind === kind).map((item) => {
          const owned = g.ownedItems.includes(item.id)
          const on = g.cat.equipped.includes(item.id)
          return (
            <div key={item.id} className={`shop-item ${on ? 'equipped' : ''}`}>
              {kind === 'place' ? (
                <div className={`shop-place room tod-${timeOfDay()} place-${item.id}`}>
                  <Backdrop place={item.id} tod={timeOfDay()} />
                </div>
              ) : (
                <div className="shop-ico">{ICON[item.id] ? <img src={ICON[item.id]} alt="" /> : ItemIcon[item.id]}</div>
              )}
              <b>{item.name}</b>
              {item.desc && <small className="muted">{item.desc}</small>}
              {item.effect && (
                <small className="muted">
                  {item.effect.hunger ? `배부름 +${item.effect.hunger} ` : ''}
                  {item.effect.mood ? `기분 +${item.effect.mood}` : ''}
                </small>
              )}
              {owned && kind === 'place' ? (
                <span className="owned-tag">열림 · 홈에서 옆으로 넘겨요</span>
              ) : owned ? (
                <button className={`btn small ${on ? 'primary' : ''}`} onClick={() => actions.toggleEquip(item.id)}>
                  {on ? (item.slot === 'room' ? '두는 중' : '입는 중') : item.slot === 'room' ? '두기' : '입히기'}
                </button>
              ) : (
                <button className="btn small" onClick={() => buy(item.id)}>
                  <Gold value={item.price} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )

  return (
    <div className="tab-panel">
      <header className="top">
        <div>
          <div className="eyebrow">길드 금고로 사요</div>
          <h1>상점</h1>
        </div>
      </header>
      <div className="bleed">
        <Playground cat={g.cat} height={230} catHeight={112} />
      </div>
      {msg && <p className="toast-inline">{msg}</p>}
      {section('food', '돌보기')}
      {section('deco', '옷·가구')}
      {section('place', '테마')}
      <p className="fineprint">뽑기는 없어요. 꾸미기는 모습만 바뀌어요.</p>
    </div>
  )
}
