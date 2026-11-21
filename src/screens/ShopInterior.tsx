// 마을 상점 안: 정해진 자리 6칸에 가구를 골라 넣는다. 스타일 시트가 있는 가게(꽃집·은행·미용실·카페)는
// 귀여운·예쁜·멋진 스타일을 한 번에 깔 수도 있다. 저장하기를 눌러야 저장된다.
import { useState } from 'react'
import { actions, useGame } from '../store'
import { Page } from '../components/Page'
import { Lock } from '../components/Icons'
import { ROOM, SLOTS, STYLE_NAMES, furSrc, type Shop, type SlotId, type StyleId } from '../data/world'

type Decor = { style: string; slots: Record<string, number | string> }

// 가구 잠금: 자리마다 첫 가구는 처음부터. 나머지는 챕터를 하나 끝낼 때마다(지은 건물 수만큼) 하나씩 열린다.
// 여는 순서는 자리를 돌아가며 (조명 2번째 → 진열대 2번째 → … → 조명 3번째 …)
export function unlockOrder(shop: Shop): string[] {
  const rest = SLOTS.map((sl) => shop.options[sl.id].slice(1))
  const out: string[] = []
  for (let k = 0; out.length < rest.flat().length; k++) rest.forEach((r) => r[k] && !out.includes(r[k]) && out.push(r[k]))
  return out
}

// 처음 들어오면 빈 방 대신 기본 배치 (자리마다 첫 가구 = 처음부터 열린 가구)
const starter = (shop: Shop): Decor => ({ style: 'base', slots: Object.fromEntries(SLOTS.map((sl) => [sl.id, shop.options[sl.id][0]]).filter(([, v]) => v)) })

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
  const builtCount = Object.keys(s.learn.built).length
  const order = unlockOrder(shop)
  const free = new Set(SLOTS.map((sl) => shop.options[sl.id][0]))
  const isOpen = (v: string) => free.has(v) || order.indexOf(v) < builtCount
  const needFor = (v: string) => order.indexOf(v) + 1 // 지은 건물이 몇 개면 열리나
  const nextUnlock = order[builtCount]
  const presets = shop.presets ? (Object.keys(shop.presets) as StyleId[]) : []
  const presetOpen = (p: StyleId) => Object.values(shop.presets![p] ?? {}).every((v) => isOpen(v!))
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
            <button key={p} className={`${d.style === p ? 'on' : ''} ${presetOpen(p) ? '' : 'locked'}`} disabled={!presetOpen(p)} onClick={() => setD({ style: p, slots: { ...shop.presets![p] } as Record<string, string> })}>
              <img src={furSrc(shop.presets![p]!.counter ?? shop.presets![p]!.display!)} alt="" />
              {presetOpen(p) ? '' : <Lock size={12} />} {STYLE_NAMES[p]} 스타일
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
        {shop.options[slot].map((v) =>
          isOpen(v) ? (
            <button key={v} className={d.slots[slot] === v ? 'on' : ''} onClick={() => put(slot, v)}>
              <img src={furSrc(v)} alt="" />
            </button>
          ) : (
            <button key={v} className="locked" disabled aria-label={`건물 ${needFor(v)}개를 열면 열려요`}>
              <img src={furSrc(v)} alt="" />
              <span className="si-lock">
                <Lock size={14} />
                {needFor(v)}
              </span>
            </button>
          ),
        )}
        <button className="si-clear" onClick={() => put(slot, null)}>
          비우기
        </button>
      </div>

      {nextUnlock && (
        <p className="si-next">
          <img src={furSrc(nextUnlock)} alt="" />
          챕터를 하나 더 끝내면 이 가구가 열려요 · 지금 {builtCount}개 열림
        </p>
      )}

      <div className="si-save">
        <button className="btn btn-primary btn-block" disabled={!dirty} onClick={save}>
          {flash ? '저장했어요' : dirty ? '저장하기' : '저장됨'}
        </button>
      </div>
    </Page>
  )
}
