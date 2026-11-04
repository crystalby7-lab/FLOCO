// 우리 마을: 길드 금고로 건물·나무·소품을 사서 빈 땅에 짓는다.
// 빈 땅을 누르면 고르는 창, 지은 걸 누르면 치우기.
import { useState } from 'react'
import { actions, useGame } from '../store'
import { TOWN, townItem, type TownItem } from '../data/town'
import { ART } from '../components/CatView'
import { Page } from '../components/Page'
import { Gold } from '../components/ui'

// 땅 12칸: 4줄 × 3칸, 줄마다 엇갈리게 놓아 깊이감을 준다 (뒤 줄부터 그림)
const SLOTS = Array.from({ length: 12 }, (_, i) => {
  const r = Math.floor(i / 3)
  const c = i % 3
  return { x: 18 + c * 32 + (r % 2 ? 6 : -2), y: 150 + r * 92 }
})

const KINDS: { id: TownItem['kind']; label: string }[] = [
  { id: 'building', label: '건물' },
  { id: 'nature', label: '자연' },
  { id: 'deco', label: '소품' },
]

export function Town({ onClose }: { onClose: () => void }) {
  const s = useGame()
  const g = s.guild!
  const [slot, setSlot] = useState<number | null>(null)
  const [kind, setKind] = useState<TownItem['kind']>('building')
  const [toast, setToast] = useState('')
  const built = g.town.filter(Boolean).length

  const flash = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(''), 1600)
  }
  const pick = (id: string) => {
    if (slot === null) return
    const err = actions.buildTown(slot, id)
    flash(err ?? `${townItem(id)!.name}을(를) 지었어요!`)
    if (!err) setSlot(null)
  }
  const cur = slot !== null ? g.town[slot] : null

  return (
    <Page title="우리 마을" sub={`${built}/12칸 · 길드 금고로 지어요`} onExit={onClose}>
      <div className="town-gold">
        <Gold value={g.gold} size={16} />
      </div>
      <div className="town-map">
        <img className="town-sky" src={ART.sc_country} alt="" aria-hidden />
        <div className="town-ground" aria-hidden />
        <div className="town-road" aria-hidden />
        {SLOTS.map((p, i) => {
          const id = g.town[i]
          const it = id ? townItem(id) : undefined
          return (
            <button
              key={i}
              className={`town-slot ${id ? 'filled' : ''} ${slot === i ? 'on' : ''}`}
              style={{ left: `${p.x}%`, top: p.y, zIndex: 10 + i }}
              onClick={() => setSlot(slot === i ? null : i)}
              aria-label={it ? it.name : '빈 땅'}
            >
              {it ? <img src={ART[it.id]} alt="" style={{ height: it.size }} /> : <span className="plot">+</span>}
            </button>
          )
        })}
        <img className="town-cat" src={ART.walk} alt="" aria-hidden />
      </div>

      {slot !== null && cur && (
        <div className="town-sheet small">
          <b>{townItem(cur)!.name}</b>
          <div className="row">
            <button
              className="btn btn-sm"
              onClick={() => {
                actions.clearTown(slot)
                setSlot(null)
                flash('땅을 비웠어요')
              }}
            >
              치우기 (골드는 안 돌아와요)
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setSlot(null)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {slot !== null && !cur && (
        <div className="town-sheet">
          <div className="seg">
            {KINDS.map((k) => (
              <button key={k.id} className={kind === k.id ? 'on' : ''} onClick={() => setKind(k.id)}>
                {k.label}
              </button>
            ))}
          </div>
          <div className="town-grid">
            {TOWN.filter((t) => t.kind === kind).map((t) => (
              <button key={t.id} className="town-item" disabled={g.gold < t.price} onClick={() => pick(t.id)}>
                <span className="ti-art">
                  <img src={ART[t.id]} alt="" />
                </span>
                <b>{t.name}</b>
                <Gold value={t.price} size={13} />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </Page>
  )
}
