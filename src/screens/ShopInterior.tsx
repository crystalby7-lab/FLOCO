// 마을 상점 안: 정해진 자리 5칸에 가구를 골라 넣고, 가게 전체 스타일(기본·민트·핑크·블랙)을 바꾼다.
import { useState } from 'react'
import { actions, useGame } from '../store'
import { Page } from '../components/Page'
import { ROOM, SLOTS, STYLES, fur, type Shop, type SlotId } from '../data/world'

export function ShopInterior({ shop, onExit }: { shop: Shop; onExit: () => void }) {
  const s = useGame()
  const d = s.decor[shop.id] ?? { style: 'base', slots: {} }
  const [slot, setSlot] = useState<SlotId>('counter')
  return (
    <Page title={shop.name} onExit={onExit}>
      <div className={`si-room st-${d.style}`}>
        <img className="si-bg" src={ROOM[shop.room]} alt="" />
        {SLOTS.map((sl) => {
          const n = d.slots[sl.id]
          const on = slot === sl.id
          return (
            <button
              key={sl.id}
              className={`si-slot ${n == null ? 'empty' : ''} ${on ? 'on' : ''} at-${sl.id}`}
              style={{ left: `${sl.x}%`, bottom: `${sl.bottom}%`, width: `${sl.w}%` }}
              onClick={() => setSlot(sl.id)}
              aria-label={sl.name}
            >
              {n != null ? <img src={fur(n)} alt="" /> : <span>+</span>}
            </button>
          )
        })}
      </div>

      <div className="si-styles">
        {STYLES.map((st) => (
          <button key={st.id} className={d.style === st.id ? 'on' : ''} onClick={() => actions.decorate(shop.id, { style: st.id })}>
            <i style={{ background: st.color }} />
            {st.name}
          </button>
        ))}
      </div>

      <div className="si-tabs">
        {SLOTS.map((sl) => (
          <button key={sl.id} className={slot === sl.id ? 'on' : ''} onClick={() => setSlot(sl.id)}>
            {sl.name}
          </button>
        ))}
      </div>
      <div className={`si-opts st-${d.style}`}>
        {shop.options[slot].map((n) => (
          <button key={n} className={d.slots[slot] === n ? 'on' : ''} onClick={() => actions.decorate(shop.id, { slot, num: n })}>
            <img src={fur(n)} alt="" />
          </button>
        ))}
        <button className="si-clear" onClick={() => actions.decorate(shop.id, { slot, num: null })}>
          비우기
        </button>
      </div>
    </Page>
  )
}
