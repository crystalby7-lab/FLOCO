// 길드 맨 위 배너: 길드마다 배경·글꼴·문장·구호를 골라 꾸민다.
import { useState } from 'react'
import { actions } from '../store'
import { ART } from './CatView'
import { Avatar } from './Avatar'
import type { Guild, GuildLook } from '../types'

export const GUILD_THEMES = [
  { id: 'cherry', name: '벚꽃길', art: 'sc_cherry' },
  { id: 'beach', name: '바닷가', art: 'sc_beach' },
  { id: 'country', name: '들판', art: 'sc_country' },
  { id: 'sunset', name: '노을', art: 'sc_sunset' },
  { id: 'night', name: '밤 도시', art: 'sc_night' },
  { id: 'snow', name: '눈 마을', art: 'sc_snow' },
]
export const GUILD_FONTS = [
  { id: 'single', name: '통통', css: "'Single Day', 'SUIT Variable', sans-serif" },
  { id: 'sunflower', name: '깔끔', css: "'Sunflower', 'SUIT Variable', sans-serif" },
  { id: 'yeonsung', name: '레트로', css: "'Yeon Sung', 'SUIT Variable', sans-serif" },
  { id: 'gamja', name: '손글씨', css: "'Gamja Flower', 'SUIT Variable', sans-serif" },
  { id: 'dongle', name: '말랑', css: "'Dongle', 'SUIT Variable', sans-serif" },
]
export const GUILD_EMBLEMS = ['i_paw', 'i_star', 'i_heart', 'i_fish', 'i_cake', 'i_duck', 'i_yarn', 'i_boba']

const DEFAULT: GuildLook = { theme: 'cherry', font: 'single', emblem: 'i_paw', motto: '' }
export const lookOf = (g: Guild): GuildLook => {
  const l = { ...DEFAULT, ...(g.look ?? {}) }
  return GUILD_FONTS.some((f) => f.id === l.font) ? l : { ...l, font: DEFAULT.font }
}
const fontCss = (id: string) => (GUILD_FONTS.find((f) => f.id === id) ?? GUILD_FONTS[0]).css
const themeArt = (id: string) => ART[(GUILD_THEMES.find((t) => t.id === id) ?? GUILD_THEMES[0]).art]

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
            <h1 style={{ fontFamily: fontCss(look.font) }} className={`f-${look.font}`}>
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

function GuildDeco({ g, onClose }: { g: Guild; onClose: () => void }) {
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
              <h1 style={{ fontFamily: fontCss(look.font) }} className={`f-${look.font}`}>
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

        <label className="gd-label">글꼴</label>
        <div className="gd-fonts">
          {GUILD_FONTS.map((f) => (
            <button key={f.id} className={`${look.font === f.id ? 'on' : ''} f-${f.id}`} style={{ fontFamily: f.css }} onClick={() => put('font', f.id)}>
              {f.name}
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
