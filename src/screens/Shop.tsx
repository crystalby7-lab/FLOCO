// 상점 (F9): 가상 골드로만 구매, 투자에 유리한 아이템·확률형 뽑기 없음
import { useState } from 'react'
import { actions, useGame } from '../store'
import { SHOP } from '../data/shop'
import { Gold } from '../components/ui'
import { CatView } from '../components/CatView'
import { Scene } from '../components/Scene'
import { ItemIcon } from '../components/Icons'

export function Shop() {
  const s = useGame()
  const g = s.guild!
  const [msg, setMsg] = useState('')

  const buy = (id: string) => {
    const err = actions.buyItem(id)
    setMsg(err ?? '샀어요!')
    setTimeout(() => setMsg(''), 1500)
  }

  const section = (kind: 'food' | 'deco', title: string) => (
    <>
      <h2 className="section-title">{title}</h2>
      <div className="shop-grid">
        {SHOP.filter((i) => i.kind === kind).map((item) => {
          const owned = g.ownedItems.includes(item.id)
          const on = g.cat.equipped.includes(item.id)
          return (
            <div key={item.id} className={`shop-item ${on ? 'equipped' : ''}`}>
              <div className="shop-ico">{ItemIcon[item.id]}</div>
              <b>{item.name}</b>
              {item.effect && (
                <small className="muted">
                  {item.effect.hunger ? `배부름 +${item.effect.hunger} ` : ''}
                  {item.effect.mood ? `기분 +${item.effect.mood}` : ''}
                </small>
              )}
              {owned ? (
                <button className={`btn small ${on ? 'primary' : ''}`} onClick={() => actions.toggleEquip(item.id)}>
                  {on ? '입는 중' : '입히기'}
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
      <div className="shop-preview">
        <Scene compact>
          <CatView cat={g.cat} size={150} />
        </Scene>
      </div>
      {msg && <p className="toast-inline">{msg}</p>}
      {section('food', '간식·장난감')}
      {section('deco', '꾸미기')}
      <p className="fineprint">뽑기는 없어요. 꾸미기는 모습만 바뀌어요.</p>
    </div>
  )
}
