import { useState } from 'react'
import { me, mustRetro, useGame } from './store'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { MapScreen } from './screens/MapScreen'
import { Invest } from './screens/Invest'
import { Shop } from './screens/Shop'
import { GuildScreen } from './screens/GuildScreen'
import { TabIcon } from './components/Icons'
import { Gold } from './components/ui'
import { Wordmark } from './components/Wordmark'
import { LevelUp } from './components/LevelUp'

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
    <div className="app">
      <header className="appbar">
        <button className="wordmark-btn" onClick={() => go('home')} aria-label="홈으로">
          <Wordmark />
        </button>
        <span className="gold-pill">
          <Gold value={g.gold} size={16} />
        </span>
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
      </nav>
      {g.cat.level > (g.levelSeen ?? 1) && <LevelUp cat={g.cat} />}
    </div>
  )
}
