import { useState } from 'react'
import { me, mustRetro, streakNow, useGame } from './store'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { MapScreen } from './screens/MapScreen'
import { Invest } from './screens/Invest'
import { Shop } from './screens/Shop'
import { GuildScreen } from './screens/GuildScreen'
import { Coin, Flame, TabIcon } from './components/Icons'
import { TabCat } from './components/TabCat'
import logoFace from './assets/logo-face.png'
import { LevelUp } from './components/LevelUp'
import { Settings } from './screens/Settings'

export type Tab = 'home' | 'map' | 'invest' | 'shop' | 'guild'

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: '홈' },
  { id: 'map', label: '지도' },
  { id: 'invest', label: '투자' },
  { id: 'shop', label: '상점' },
  { id: 'guild', label: '길드' },
]

export default function App() {
  const s = useGame()
  const [tab, setTab] = useState<Tab>('home')
  const [settings, setSettings] = useState(false)

  if (!s.user || !s.guild) {
    return (
      <div className="app">
        <main className="app-main">
          <Onboarding />
        </main>
      </div>
    )
  }

  const g = s.guild
  const myId = me(g).id
  const investBadge =
    g.proposals.filter((p) => p.status === 'voting' && !p.votes.some((v) => v.memberId === myId)).length +
    g.proposals.filter((p) => mustRetro(g, p, myId)).length

  const go = (t: Tab) => {
    setTab(t)
    document.querySelector('.app-main')?.scrollTo(0, 0)
  }

  return (
    <div className={`app ${s.prefs.calm ? 'calm' : ''}`}>
      <header className="appbar stats-bar">
        <button className="sb-logo" onClick={() => go('home')} aria-label="홈으로">
          <span className="wm-mark">
            <img src={logoFace} alt="" />
          </span>
        </button>
        <div className="sb-stats">
          <span className={`sb-stat streak ${streakNow(s) ? '' : 'off'}`} title="연속 출석">
            <Flame size={18} off={!streakNow(s)} />
            <b>{streakNow(s)}일</b>
          </span>
          <span className="sb-stat gold-stat" title="길드 금고">
            <Coin size={20} />
            <b>{g.gold.toLocaleString()}</b>
          </span>
          <span className="sb-stat lv" title="고양이 레벨">
            <i>Lv</i>
            <b>{g.cat.level}</b>
          </span>
        </div>
        <button className="icon-btn gear" aria-label="설정" onClick={() => setSettings(true)}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
          </svg>
        </button>
      </header>
      <main className="app-main">
        {tab === 'home' && <Home go={go} />}
        {tab === 'map' && <MapScreen go={go} />}
        {tab === 'invest' && <Invest go={go} />}
        {tab === 'shop' && <Shop />}
        {tab === 'guild' && <GuildScreen />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => go(t.id)}>
            <span className="tab-icon">{TabIcon[t.id]}</span>
            <span>{t.label}</span>
            {t.id === 'invest' && investBadge > 0 && <span className="tab-badge">{investBadge}</span>}
          </button>
        ))}
        {!s.prefs.calm && <TabCat index={TABS.findIndex((t) => t.id === tab)} count={TABS.length} />}
      </nav>
      {g.cat.level > (g.levelSeen ?? 1) && <LevelUp cat={g.cat} />}
      {settings && <Settings onClose={() => setSettings(false)} />}
    </div>
  )
}
