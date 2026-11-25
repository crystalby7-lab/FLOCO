// 길드 맨 위 배너: 길드마다 배경·글꼴·문장·구호를 골라 꾸민다.
import { useState } from 'react'
import { actions } from '../store'
import { ART } from './CatView'
import { Avatar } from './Avatar'
import type { Guild, GuildLook } from '../types'

// 길드 마당 배경 = 보영이 준 고해상도 장소 그림 (2026-11-25, 예전 작은 그림 6장 대신)
export const GUILD_THEMES = [
  { id: 'yard', name: '마당', art: 'sc_h_yard' },
  { id: 'park', name: '벚꽃길', art: 'sc_h_park' },
  { id: 'harbor', name: '바닷가', art: 'sc_h_harbor' },
  { id: 'roof', name: '옥상', art: 'sc_h_roof' },
  { id: 'living', name: '거실', art: 'sc_h_living' },
]
const OLD_THEME: Record<string, string> = { cherry: 'park', beach: 'harbor', country: 'yard', sunset: 'roof', night: 'roof', snow: 'yard' }
export const GUILD_EMBLEMS = ['i_paw', 'i_star', 'i_heart', 'i_fish', 'i_cake', 'i_duck', 'i_yarn', 'i_boba']

const DEFAULT: GuildLook = { theme: 'yard', emblem: 'i_paw', motto: '' }
export const lookOf = (g: Guild): GuildLook => {
  const l = { ...DEFAULT, ...(g.look ?? {}) }
  return { ...l, theme: OLD_THEME[l.theme] ?? l.theme }
}
export const themeArt = (id: string) => ART[(GUILD_THEMES.find((t) => t.id === id) ?? GUILD_THEMES[0]).art]

export function GuildBanner({ g, days }: { g: Guild; days: number }) {
  const [edit, setEdit] = useState(false)
  const look = lookOf(g)
  return (
    <>
      <header className="gb2">
        <div className="gb2-cover">
          <img src={themeArt(look.theme)} alt="" />
          <button className="gb-edit" onClick={() => setEdit(true)}>
            🎨 꾸미기
          </button>
        </div>
        <div className="gb2-body">
          <span className="gb-emblem">
            <img src={ART[look.emblem]} alt="" />
          </span>
          <div className="gb2-text">
            <h1>
              {g.name}
            </h1>
            {look.motto && <p className="gb2-motto">{look.motto}</p>}
          </div>
          <div className="gb2-meta">
            <span className="head-avatars">
              {g.members.slice(0, 5).map((m) => (
                <Avatar key={m.id} g={g} id={m.id} size={26} />
              ))}
            </span>
            <small>
              {g.members.length}/5명 · D+{days}
            </small>
          </div>
        </div>
      </header>
      {edit && <GuildDeco g={g} onClose={() => setEdit(false)} />}
    </>
  )
}

export function GuildDeco({ g, onClose }: { g: Guild; onClose: () => void }) {
  const [name, setName] = useState(g.name)
  const [look, setLook] = useState(lookOf(g))
  const put = (k: keyof GuildLook, v: string) => setLook({ ...look, [k]: v })
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet gd" onClick={(e) => e.stopPropagation()}>
        {/* 미리보기 */}
        <div className="gb2 gb-preview">
          <div className="gb2-cover">
            <img src={themeArt(look.theme)} alt="" />
          </div>
          <div className="gb2-body">
            <span className="gb-emblem">
              <img src={ART[look.emblem]} alt="" />
            </span>
            <div className="gb2-text">
              <h1>
                {name || '길드 이름'}
              </h1>
              {look.motto && <p className="gb2-motto">{look.motto}</p>}
            </div>
          </div>
        </div>

        <label className="gd-label">길드 이름</label>
        <input className="gd-input" value={name} maxLength={12} onChange={(e) => setName(e.target.value)} />
        <label className="gd-label">우리 구호</label>
        <input className="gd-input" value={look.motto} maxLength={20} placeholder="한 줄로 적어요 (안 써도 돼요)" onChange={(e) => put('motto', e.target.value)} />

        <label className="gd-label">배경</label>
        <div className="gd-themes">
          {GUILD_THEMES.map((t) => (
            <button key={t.id} className={look.theme === t.id ? 'on' : ''} onClick={() => put('theme', t.id)}>
              <img src={ART[t.art]} alt="" />
              <small>{t.name}</small>
            </button>
          ))}
        </div>

        <label className="gd-label">문장</label>
        <div className="gd-emblems">
          {GUILD_EMBLEMS.map((e) => (
            <button key={e} className={look.emblem === e ? 'on' : ''} onClick={() => put('emblem', e)}>
              <img src={ART[e]} alt="" />
            </button>
          ))}
        </div>

        <div className="gd-foot">
          <button className="btn btn-ghost" onClick={onClose}>
            취소
          </button>
          <button
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={() => {
              actions.decorateGuild(name.trim(), look)
              onClose()
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
