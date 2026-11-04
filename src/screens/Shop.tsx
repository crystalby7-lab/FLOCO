// 상점 (F9): 가상 골드로만 구매, 투자에 유리한 아이템·확률형 뽑기 없음
import { useState } from 'react'
import { actions, useGame } from '../store'
import { SHOP } from '../data/shop'
import { Gold } from '../components/ui'
import { Backdrop, timeOfDay } from '../components/Playground'
import { ItemIcon } from '../components/Icons'
import { ART } from '../components/CatView'

const ICON: Record<string, string> = {
  feed: ART.i_bowl,
  snack: ART.i_fish,
  toy: ART.i_yarn,
  boba: ART.i_boba,
  bath: ART.i_duck,
  box: ART.i_box,
  cushion: ART.i_pillow,
  bed: ART.i_bed,
}

export function Shop() {
  const s = useGame()
  const g = s.guild!
  const [msg, setMsg] = useState('')

  const buy = (id: string) => {
    const err = actions.buyItem(id)
    const it = SHOP.find((i) => i.id === id)!
    setMsg(err ?? (it.kind === 'food' ? `${it.name} 보관함에 넣었어요 · 홈에서 줘요` : it.kind === 'place' ? '테마가 열렸어요 · 홈에서 옆으로 넘겨요' : '옷장에 넣었어요 · 홈에서 입혀요'))
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
              {kind === 'food' && (g.inventory[item.id] ?? 0) > 0 && <span className="have-badge">보유 {g.inventory[item.id]}</span>}
              {kind === 'place' ? (
                <div className={`shop-place room tod-${timeOfDay()} place-${item.id}`}>
                  <Backdrop place={item.id} tod={timeOfDay()} />
                </div>
              ) : (
                <div className="shop-ico">{ICON[item.id] ?? ART[item.id] ? <img src={ICON[item.id] ?? ART[item.id]} alt="" /> : ItemIcon[item.id]}</div>
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
                <span className="owned-tag">옷장에 있어요</span>
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
      {msg && <p className="toast-inline">{msg}</p>}
      {section('food', '먹이·장난감 · 사면 보관함으로')}
      {section('deco', '옷·가구 · 홈 옷장에서 입혀요')}
      {section('place', '테마')}
      <p className="fineprint">뽑기는 없어요. 꾸미기는 모습만 바뀌어요.</p>
    </div>
  )
}
