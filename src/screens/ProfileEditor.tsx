// 프로필 사진 꾸미기: 고양이 고르기 · 배경색 · 스티커
import { useRef, useState } from 'react'
import { actions, useGame } from '../store'
import { ART } from '../components/CatView'
import { AvatarView, DEFAULT_LOOK, LOOK_DEFAULT } from '../components/Avatar'
import { Page } from '../components/Page'
import { EMOTES, OUTFIT_NAMES, breedLocks } from '../data/kitty'
import type { AvatarLook } from '../types'

const BGS = ['#eef4fb', '#dbe8fb', '#fde8ee', '#fff1c9', '#e3f4ea', '#ece6fb', '#ffe3d3', '#2f3a5a']
const STICKERS = ['', 'i_heart', 'i_star', 'i_paw', 'bb_heart', 'i_cupcake', 'bg_flower', 'i_fish']

const clamp = (v: number, a: number, b: number) => Math.round(Math.min(b, Math.max(a, v)))

export function ProfileEditor({ onClose }: { onClose: () => void }) {
  const s = useGame()
  const g = s.guild!
  const [look, setLook] = useState<AvatarLook>(s.user?.avatar ?? DEFAULT_LOOK)
  // 키우는 고양이는 처음부터, 다른 고양이는 키우는 고양이 레벨이 오르면 하나씩 열린다
  const locks = breedLocks(g.cat)
  const pos = { zoom: look.zoom ?? LOOK_DEFAULT.zoom, x: look.x ?? LOOK_DEFAULT.x, y: look.y ?? LOOK_DEFAULT.y }
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null)

  return (
    <Page title="프로필 꾸미기" sub="길드 친구들에게 보이는 내 사진" onExit={onClose}>
      <div className="pe-preview">
        <div
          className="pe-drag"
          onPointerDown={(e) => {
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y }
          }}
          onPointerMove={(e) => {
            const d = drag.current
            if (!d) return
            const k = 100 / 132
            setLook({ ...look, x: clamp(d.x + (e.clientX - d.px) * k, -40, 40), y: clamp(d.y + (e.clientY - d.py) * k, -40, 60) })
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          <AvatarView look={look} size={132} />
        </div>
        <b>{s.user?.nickname}</b>
        <small className="pe-hint">사진을 끌어서 위치를 옮겨요</small>
      </div>

      <div className="pe-adjust">
        <label>
          <span>크기</span>
          <input type="range" min={0.5} max={1.6} step={0.02} value={pos.zoom} onChange={(e) => setLook({ ...look, zoom: Number(e.target.value) })} />
        </label>
        <label>
          <span>좌우</span>
          <input type="range" min={-40} max={40} step={1} value={pos.x} onChange={(e) => setLook({ ...look, x: Number(e.target.value) })} />
        </label>
        <label>
          <span>위아래</span>
          <input type="range" min={-40} max={60} step={1} value={pos.y} onChange={(e) => setLook({ ...look, y: Number(e.target.value) })} />
        </label>
        <button className="text-btn" onClick={() => setLook({ ...look, ...LOOK_DEFAULT })}>
          처음 위치로
        </button>
      </div>

      {locks.map(({ id, open, level }) => {
        return (
          <section key={id} className={`pe-breed ${open ? '' : 'locked'}`}>
            <h3 className="pe-title">
              {open ? <em>{level === 0 ? '키우는 고양이' : '열림'}</em> : <em className="lock">🔒 {g.cat.name} Lv.{level}에 열려요</em>}
            </h3>
            <div className="pe-grid">
              {[...EMOTES.map((_, i) => `${id}_e${i}`), ...OUTFIT_NAMES[id].map((_, i) => `${id}_o${i}`)].map((a) => (
                <button key={a} className={`pe-cell ${look.art === a ? 'on' : ''}`} disabled={!open} onClick={() => setLook({ ...look, art: a })}>
                  <img src={ART[a]} alt="" />
                </button>
              ))}
            </div>
          </section>
        )
      })}

      <h3 className="pe-title">배경색</h3>
      <div className="pe-colors">
        {BGS.map((c) => (
          <button key={c} className={`pe-color ${look.bg === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setLook({ ...look, bg: c })} aria-label={c} />
        ))}
      </div>

      <h3 className="pe-title">스티커</h3>
      <div className="pe-grid stickers">
        {STICKERS.map((st) => (
          <button key={st || 'none'} className={`pe-cell ${(look.sticker ?? '') === st ? 'on' : ''}`} onClick={() => setLook({ ...look, sticker: st || undefined })}>
            {st ? <img src={ART[st]} alt="" /> : <span className="pe-none">없음</span>}
          </button>
        ))}
      </div>

      <button
        className="btn btn-primary btn-block pe-save"
        onClick={() => {
          actions.setAvatar(look)
          onClose()
        }}
      >
        저장하기
      </button>
    </Page>
  )
}
