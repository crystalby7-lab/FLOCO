// 마을 상점 안: 정해진 자리 6칸에 가구를 골라 넣는다. 스타일 시트가 있는 가게(꽃집·은행·미용실·카페)는
// 귀여운·예쁜·멋진 스타일을 한 번에 깔 수도 있다. 저장하기를 눌러야 저장된다.
import { useState } from 'react'
import { actions, useGame } from '../store'
import { Page } from '../components/Page'
import { ROOM, SLOTS, STYLE_NAMES, furSrc, type Shop, type SlotId, type StyleId } from '../data/world'

type Decor = { style: string; slots: Record<string, number | string> }

// 처음 들어오면 빈 방 대신 기본 배치 (스타일 시트가 있으면 귀여운 스타일, 없으면 자리마다 첫 가구)
const starter = (shop: Shop): Decor =>
  shop.presets?.cute
    ? { style: 'cute', slots: { ...shop.presets.cute } as Record<string, string> }
    : { style: 'base', slots: Object.fromEntries(SLOTS.map((sl) => [sl.id, shop.options[sl.id][0]]).filter(([, v]) => v)) }

export function ShopInterior({ shop, onExit }: { shop: Shop; onExit: () => void }) {
  const s = useGame()
  const stored = s.decor[shop.id]
  const saved: Decor = stored && Object.keys(stored.slots).length ? stored : starter(shop)
  const [d, setD] = useState<Decor>(saved)
  const [slot, setSlot] = useState<SlotId>('counter')
  const [flash, setFlash] = useState(false)
  const dirty = !stored || JSON.stringify(d) !== JSON.stringify(stored)
  const put = (sl: string, v: string | null) => {
    const slots = { ...d.slots }
    if (v == null) delete slots[sl]
    else slots[sl] = v
    setD({ ...d, slots })
  }
  const save = () => {
    actions.setDecor(shop.id, d)
    setFlash(true)
    setTimeout(() => setFlash(false), 1400)
  }
  const presets = shop.presets ? (Object.keys(shop.presets) as StyleId[]) : []
  return (
    <Page title={shop.name} onExit={onExit} confirm={dirty && !!stored}>
      <div className="si-room tall">
        <img className="si-bg" src={ROOM[shop.room]} alt="" />
        {SLOTS.map((sl) => {
          const v = d.slots[sl.id]
          const on = slot === sl.id
          return (
            <button
              key={sl.id}
              className={`si-slot ${v == null ? 'empty' : ''} ${on ? 'on' : ''} at-${sl.id}`}
              style={{ left: `${sl.x}%`, bottom: `${sl.bottom}%`, width: `${sl.w}%` }}
              onClick={() => setSlot(sl.id)}
              aria-label={sl.name}
            >
              {v != null ? <img src={furSrc(v)} alt="" /> : <span>+</span>}
            </button>
          )
        })}
      </div>

      {presets.length > 0 && (
        <div className="si-presets">
          {presets.map((p) => (
            <button key={p} className={d.style === p ? 'on' : ''} onClick={() => setD({ style: p, slots: { ...shop.presets![p] } as Record<string, string> })}>
              <img src={furSrc(shop.presets![p]!.counter ?? shop.presets![p]!.display!)} alt="" />
              {STYLE_NAMES[p]} 스타일
            </button>
          ))}
        </div>
      )}

      <div className="si-tabs">
        {SLOTS.map((sl) => (
          <button key={sl.id} className={slot === sl.id ? 'on' : ''} onClick={() => setSlot(sl.id)}>
            {sl.name}
          </button>
        ))}
      </div>
      <div className="si-opts">
        {shop.options[slot].map((v) => (
          <button key={v} className={d.slots[slot] === v ? 'on' : ''} onClick={() => put(slot, v)}>
            <img src={furSrc(v)} alt="" />
          </button>
        ))}
        <button className="si-clear" onClick={() => put(slot, null)}>
          비우기
        </button>
      </div>

      <div className="si-save">
        <button className="btn btn-primary btn-block" disabled={!dirty} onClick={save}>
          {flash ? '저장했어요' : dirty ? '저장하기' : '저장됨'}
        </button>
      </div>
    </Page>
  )
}
