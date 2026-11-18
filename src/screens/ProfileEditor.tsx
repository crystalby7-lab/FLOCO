// 프로필 사진 꾸미기: 고양이 고르기 · 배경색 · 스티커
import { useState } from 'react'
import { actions, useGame } from '../store'
import { ART } from '../components/CatView'
import { AvatarView, DEFAULT_LOOK } from '../components/Avatar'
import { Page } from '../components/Page'
import { BREEDS, EMOTES, OUTFIT_NAMES, breedLocks } from '../data/kitty'
import type { AvatarLook } from '../types'

const BGS = ['#eef4fb', '#dbe8fb', '#fde8ee', '#fff1c9', '#e3f4ea', '#ece6fb', '#ffe3d3', '#2f3a5a']
const STICKERS = ['', 'i_heart', 'i_star', 'i_paw', 'bb_heart', 'i_cupcake', 'bg_flower', 'i_fish']

export function ProfileEditor({ onClose }: { onClose: () => void }) {
  const s = useGame()
  const g = s.guild!
  const [look, setLook] = useState<AvatarLook>(s.user?.avatar ?? DEFAULT_LOOK)
  // 키우는 고양이는 처음부터, 다른 고양이는 키우는 고양이 레벨이 오르면 하나씩 열린다
  const locks = breedLocks(g.cat)

  return (
    <Page title="프로필 꾸미기" sub="길드 친구들에게 보이는 내 사진" onExit={onClose}>
      <div className="pe-preview">
        <AvatarView look={look} size={132} />
        <b>{s.user?.nickname}</b>
      </div>

      {locks.map(({ id, open, level }) => {
        const b = BREEDS.find((x) => x.id === id)!
        return (
          <section key={id} className={`pe-breed ${open ? '' : 'locked'}`}>
            <h3 className="pe-title">
              {b.name}
              {open ? (level === 0 ? <em>키우는 고양이</em> : null) : <em className="lock">🔒 {g.cat.name} Lv.{level}에 열려요</em>}
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
