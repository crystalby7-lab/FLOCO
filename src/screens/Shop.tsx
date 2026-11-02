// 상점 (F9): 가상 골드로만 구매, 투자에 유리한 아이템·확률형 뽑기 없음
import { useState } from 'react'
import { actions, useGame } from '../store'
import { SHOP } from '../data/shop'
import { Gold } from '../components/ui'
import { CatView } from '../components/CatView'

export function Shop() {
  const s = useGame()
  const g = s.guild!
  const [msg, setMsg] = useState('')

  const buy = (id: string) => {
    const err = actions.buyItem(id)
    setMsg(err ?? '구매 완료!')
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
              <div className="shop-emoji">{item.emoji}</div>
              <b>{item.name}</b>
              {item.effect && (
                <small className="muted">
                  {item.effect.hunger ? `배부름 +${item.effect.hunger} ` : ''}
                  {item.effect.mood ? `기분 +${item.effect.mood}` : ''}
                </small>
              )}
              {owned ? (
                <button className={`btn small ${on ? 'primary' : ''}`} onClick={() => actions.toggleEquip(item.id)}>
                  {on ? '착용 중' : '착용'}
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
    <div className="screen">
      <header className="top">
        <div>
          <div className="eyebrow">보이는 것만 바뀌어요</div>
          <h1>상점</h1>
        </div>
        <div className="vault">
          <div className="eyebrow">금고</div>
          <Gold value={g.gold} />
        </div>
      </header>
      <div className="shop-preview">
        <CatView cat={g.cat} size={150} />
      </div>
      {msg && <p className="toast-inline">{msg}</p>}
      {section('food', '돌봄')}
      {section('deco', '꾸미기')}
      <p className="fineprint">투자에 유리해지는 아이템, 골드 충전, 확률형 뽑기는 팔지 않아요.</p>
    </div>
  )
}
