import { useState } from 'react'
import { me, mustRetro, useGame } from './store'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { MapScreen } from './screens/MapScreen'
import { Invest } from './screens/Invest'
import { Shop } from './screens/Shop'
import { GuildScreen } from './screens/GuildScreen'

export type Tab = 'home' | 'map' | 'invest' | 'shop' | 'guild'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'map', label: '지도', icon: '🗺' },
  { id: 'invest', label: '투자', icon: '🗳' },
  { id: 'shop', label: '상점', icon: '🛍' },
  { id: 'guild', label: '길드', icon: '👥' },
]

export default function App() {
  const s = useGame()
  const [tab, setTab] = useState<Tab>('home')

  if (!s.user || !s.guild) {
    return (
      <div className="app">
        <Onboarding />
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
    window.scrollTo(0, 0)
  }

  return (
    <div className="app">
      <main className="content">
        {tab === 'home' && <Home go={go} />}
        {tab === 'map' && <MapScreen />}
        {tab === 'invest' && <Invest go={go} />}
        {tab === 'shop' && <Shop />}
        {tab === 'guild' && <GuildScreen />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => go(t.id)}>
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
            {t.id === 'invest' && investBadge > 0 && <span className="tab-badge">{investBadge}</span>}
          </button>
        ))}
      </nav>
    </div>
  )
}
