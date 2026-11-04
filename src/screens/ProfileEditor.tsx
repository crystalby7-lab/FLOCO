// 프로필 사진 꾸미기: 고양이 고르기 · 배경색 · 스티커
import { useState } from 'react'
import { actions, useGame } from '../store'
import { ART } from '../components/CatView'
import { AvatarView, DEFAULT_LOOK } from '../components/Avatar'
import { Page } from '../components/Page'
import { SHOP } from '../data/shop'
import type { AvatarLook } from '../types'

const BASE_CATS = ['sit', 't_wave', 't_happy', 't_think', 't_sprout', 'crown']
const BREEDS = ['b_tuxedo', 'b_orange', 'b_black', 'b_calico', 'b_grey', 'b_siamese', 'b_ragdoll']
const BGS = ['#eef4fb', '#dbe8fb', '#fde8ee', '#fff1c9', '#e3f4ea', '#ece6fb', '#ffe3d3', '#2f3a5a']
const STICKERS = ['', 'i_heart', 'i_star', 'i_paw', 'bb_heart', 'i_cupcake', 'bg_flower', 'i_fish']

export function ProfileEditor({ onClose }: { onClose: () => void }) {
  const s = useGame()
  const g = s.guild!
  const [look, setLook] = useState<AvatarLook>(s.user?.avatar ?? DEFAULT_LOOK)
  // 길드가 산 옷은 프로필에도 쓸 수 있다
  const outfits = SHOP.filter((i) => i.slot === 'outfit' && g.ownedItems.includes(i.id)).map((i) => i.id)
  const cats = [...BASE_CATS, ...outfits, ...BREEDS]

  return (
    <Page title="프로필 꾸미기" sub="길드 친구들에게 보이는 내 사진" onExit={onClose}>
      <div className="pe-preview">
        <AvatarView look={look} size={132} />
        <b>{s.user?.nickname}</b>
      </div>

      <h3 className="pe-title">고양이</h3>
      <div className="pe-grid">
        {cats.map((a) => (
          <button key={a} className={`pe-cell ${look.art === a ? 'on' : ''}`} onClick={() => setLook({ ...look, art: a })}>
            <img src={ART[a]} alt="" />
          </button>
        ))}
      </div>
      {outfits.length === 0 && <p className="fineprint">상점에서 옷을 사면 옷 입은 모습도 고를 수 있어요.</p>}

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
