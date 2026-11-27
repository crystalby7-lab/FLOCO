// 길드 맨 위 '우리 마당' (2026-11-25 길드 개편, 11-26 수정): 고양이는 길드가 같이 키우는 한 마리만 장면에 있고,
// 친구들은 고양이 둘레에 동그란 프로필(같이 키우는 사람)로 둘러선다 — 고양이가 여러 마리로 보이지 않게(보영).
// - 친구 머리 위 말풍선 = 오늘 한 일(발자국). 조용한 친구는 말풍선 없음(재촉하지 않기).
// - 친구를 누르면 응원(하루 한 번). 빈자리는 '친구 부르기'.
// - 금액·수익률은 보이지 않는다.
import { useState } from 'react'
import { actions, catNow, today, useGame } from '../store'
import { ART } from './CatView'
import { Avatar } from './Avatar'
import { GuildDeco, lookOf, themeArt } from './GuildBanner'
import { CatWorld } from '../screens/CatWorld'
import type { ActKind } from '../types'

// 고양이 둘레 자리 (left %, bottom %, 크기 %) — 뒤쪽 자리는 조금 작게
// 프로필 자리 (left %, bottom %) — 고양이 양옆 두 줄 + 위 가운데
const SPOTS = [
  { l: 15, b: 21 },
  { l: 85, b: 21 },
  { l: 15, b: 58 },
  { l: 85, b: 58 },
  { l: 50, b: 72 },
]
const SAY: Record<ActKind, string> = { lesson: '레슨 끝!', review: '피드백 남김', reason: '근거 썼어요', retro: '돌아봤어요', care: '돌봐줬어요', post: '글 남김' }

export function GuildYard({ onInvite }: { onInvite: () => void }) {
  const s = useGame()
  const g = s.guild!
  const [edit, setEdit] = useState(false)
  const [world, setWorld] = useState(false)
  const [pop, setPop] = useState('')
  const [toast, setToast] = useState('')
  const look = lookOf(g)
  const cat = catNow(g.cat)
  const myId = g.members.find((m) => m.isMe)!.id
  const dayStart = new Date().setHours(0, 0, 0, 0)
  const sad = cat.hunger < 40 || cat.mood < 40 || (cat.clean ?? 80) < 40
  const said = (id: string) => (g.acts ?? []).find((a) => a.memberId === id && a.at >= dayStart)
  const flash = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(''), 1600)
  }
  // 나를 맨 앞 자리에
  const members = [...g.members].sort((a, b) => Number(b.isMe) - Number(a.isMe))

  return (
    <section className="gy">
      <div className="gy-top">
        <span className="gy-name">
          <img src={ART[look.emblem]} alt="" />
          <b>{g.name}</b>
          <small>{g.members.length}/5</small>
        </span>
        <button className="gy-edit" aria-label="길드 꾸미기" onClick={() => setEdit(true)}>
          <img src={ART.i_star} alt="" />
        </button>
      </div>
      <div className="gy-stage">
        <img className="gy-bg" src={themeArt(look.theme)} alt="" />

        {/* 길드 고양이 */}
        {/* 같이 키우는 고양이 — 누르면 홈의 '돌보러 가기'와 같은 고양이 집으로 */}
        <button className="gy-cat" onClick={() => setWorld(true)} aria-label={`${g.cat.name} 돌보러 가기`}>
          <img src={ART[sad ? 'face_sad' : 'sit']} alt="" />
          <span className={`gy-care ${sad ? 'sad' : ''}`}>
            <b>
              {g.cat.name} <small>Lv.{g.cat.level}</small>
            </b>
            <em>{sad ? '배고파요 · 돌봐주기' : '돌보러 가기'}</em>
          </span>
        </button>

        {/* 친구들 */}
        {members.slice(0, 5).map((m, i) => {
          const sp = SPOTS[i]
          const a = said(m.id)
          const cheered = g.cheers[`${myId}>${m.id}`] === today()
          return (
            <button
              key={m.id}
              className={`gy-mate ${m.isMe ? 'me' : ''} ${pop === m.id ? 'pop' : ''}`}
              style={{ left: `${sp.l}%`, bottom: `${sp.b}%` }}
              onClick={() => {
                if (m.isMe) return
                const err = actions.cheer(m.id)
                setPop(m.id)
                setTimeout(() => setPop(''), 900)
                flash(err ?? `${m.nickname}에게 응원을 보냈어요`)
              }}
              aria-label={m.isMe ? '나' : `${m.nickname} 응원하기`}
            >
              {a && <span className="gy-say">{SAY[a.kind]}</span>}
              <Avatar g={g} id={m.id} size={58} />
              <span className="gy-tag">
                {m.isMe ? '나' : m.nickname}
                {!m.isMe && cheered && <img src={ART.i_heart} alt="" />}
              </span>
              {pop === m.id && <img className="gy-heart" src={ART.i_heart} alt="" />}
            </button>
          )
        })}
        {g.members.length < 5 && (
          <button
            className="gy-mate ghost"
            style={{ left: `${SPOTS[g.members.length].l}%`, bottom: `${SPOTS[g.members.length].b}%` }}
            onClick={onInvite}
          >
            <span className="gy-plus">＋</span>
            <span className="gy-tag">친구 부르기</span>
          </button>
        )}

      </div>
      {edit && <GuildDeco g={g} onClose={() => setEdit(false)} />}
      {world && <CatWorld start={0} dress={false} onExit={() => setWorld(false)} />}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </section>
  )
}
