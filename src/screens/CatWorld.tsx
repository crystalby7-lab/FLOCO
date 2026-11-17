// 고양이 월드: 홈에서 '들어가기'를 누르면 화면 전체가 게임 화면이 된다.
// 위: 나가기·장소 이름·코인 / 가운데: 고양이가 사는 장면(장소는 좌우 화살표로 이동) / 아래: 돌보기 + 드레스룸.
// 장소를 옮기거나 드레스룸에 들어갈 때마다 GameLoader 전환 화면이 끼어든다.
import { useEffect, useRef, useState } from 'react'
import { actions, catNow, RULES, today, useGame } from '../store'
import { ART } from '../components/CatView'
import { Backdrop, Playground, timeOfDay, type PlayEvent } from '../components/Playground'
import { GameLoader, type Hop } from '../components/GameLoader'
import { Gold } from '../components/ui'
import { Lock } from '../components/Icons'
import { itemOf, OUTFIT_OPEN, PLACES, SHOP } from '../data/shop'
import { pickAsk, type Ask } from '../data/catTalk'
import { CARE, CatAsk } from './Home'

export function CatWorld({ start = 0, dress = false, onExit }: { start?: number; dress?: boolean; onExit: () => void }) {
  const s = useGame()
  const g = s.guild!
  const cat = catNow(g.cat)
  const tod = timeOfDay()
  const [place, setPlace] = useState(start)
  const [inDress, setInDress] = useState(false)
  const [hop, setHop] = useState<Hop | null>({ label: `${cat.name}네 집으로 가는 중`, sub: PLACES[start].name, key: 1 })
  const [pending, setPending] = useState<(() => void) | null>(() => (dress ? () => setInDress(true) : null))
  const [ev, setEv] = useState<PlayEvent>(null)
  const [toast, setToast] = useState('')
  const [asking, setAsking] = useState<Ask | null>(null)
  const [buying, setBuying] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(560)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setH(el.clientHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const owns = (id: string) => id === 'room' || g.ownedItems.includes(id)
  const pl = PLACES[place]
  const d = s.daily.date === today() ? s.daily : { talks: 0 }
  const talks = d.talks ?? 0
  const hasAsk = talks < RULES.talksPerDay

  const travel = (label: string, sub: string | undefined, then: () => void) => {
    setPending(() => then)
    setHop({ label, sub, key: Date.now() })
  }
  // 장소 이동은 로딩 없이 살짝 미끄러지듯
  const [slideDir, setSlideDir] = useState<'l' | 'r' | null>(null)
  const goPlace = (i: number) => {
    setSlideDir(i > place ? 'r' : 'l')
    setPlace(i)
  }
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 1600)
  }
  const give = (c: (typeof CARE)[number]) => {
    if (!owns(pl.id)) return flash('잠긴 곳에선 줄 수 없어요')
    const err = actions.giveItem(c.id)
    if (err) return flash((g.inventory[c.id] ?? 0) > 0 ? err : `${itemOf(c.id)!.name}이(가) 없어요 · 상점에서 사 와요`)
    flash(c.msg)
    setEv({ type: c.id, key: Date.now() })
  }

  return (
    <div className="cw">
      {!inDress ? (
        <>
          <div className="cw-stage" ref={box}>
            <div className={`cw-slide ${slideDir ? `slide-${slideDir}` : ''}`} key={`stage-${place}`}>
            {owns(pl.id) ? (
              <Playground
                key={pl.id}
                cat={cat}
                event={ev}
                lines={[]}
                height={h}
                catHeight={Math.round(Math.min(190, h * 0.26))}
                place={pl.id}
                ask={hasAsk}
                onTapCat={() => {
                  if (!hasAsk) return false
                  setAsking(pickAsk(s, talks))
                  return true
                }}
              />
            ) : (
              <div className={`room tod-${tod} place-${pl.id} locked`} style={{ height: h }}>
                <Backdrop place={pl.id} tod={tod} />
                <div className="lock-veil">
                  <span className="lock-ico">
                    <Lock size={18} />
                  </span>
                  <b>{pl.name}</b>
                  <small>{itemOf(pl.id)?.desc}</small>
                  <button className="btn btn-primary btn-sm" onClick={() => setBuying(true)}>
                    잠금 해제 · {itemOf(pl.id)!.price.toLocaleString()}G
                  </button>
                </div>
              </div>
            )}
            </div>
            {asking && <CatAsk cat={cat} ask={asking} onClose={() => setAsking(null)} />}
          </div>

          <header className="cw-hud">
            <button className="cw-round" onClick={() => travel('홈으로 돌아가는 중', undefined, onExit)} aria-label="나가기">
              <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.5 4 L6.5 10 L12.5 16" />
              </svg>
            </button>
            <span className="cw-place">
              <small>
                {place + 1}/{PLACES.length}
              </small>
              {pl.name}
            </span>
            <span className="cw-coin">
              <Gold value={g.gold} size={16} />
            </span>
          </header>

          {place > 0 && (
            <button className="cw-arrow l" onClick={() => goPlace(place - 1)} aria-label={PLACES[place - 1].name}>
              ‹<small>{PLACES[place - 1].name}</small>
            </button>
          )}
          {place < PLACES.length - 1 && (
            <button className="cw-arrow r" onClick={() => goPlace(place + 1)} aria-label={PLACES[place + 1].name}>
              <small>{PLACES[place + 1].name}</small>›
            </button>
          )}

          <footer className="cw-dock">
            {CARE.map((c) => (
              <button key={c.id} className={`cw-item ${(g.inventory[c.id] ?? 0) ? '' : 'empty'}`} onClick={() => give(c)}>
                <img src={ART[c.art]} alt="" />
                <b>{c.label}</b>
                <em>{g.inventory[c.id] ?? 0}</em>
              </button>
            ))}
            <span className="cw-sep" />
            <button className="cw-item dress" onClick={() => travel('드레스룸으로 들어가는 중', undefined, () => setInDress(true))}>
              <img src={ART.hoodie ?? ART.sit} alt="" />
              <b>드레스룸</b>
            </button>
          </footer>
        </>
      ) : (
        <DressRoom onBack={() => travel(`${pl.name}(으)로 돌아가는 중`, undefined, () => setInDress(false))} />
      )}

      {toast && <div className="cw-toast">{toast}</div>}
      {buying && (
        <div className="cw-confirm" onClick={() => setBuying(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <b>{pl.name} 테마를 열까요?</b>
            <small>길드 코인 {itemOf(pl.id)!.price.toLocaleString()}G를 써요</small>
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setBuying(false)}>
                다음에
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const err = actions.buyItem(pl.id)
                  setBuying(false)
                  flash(err ?? `${pl.name} 테마가 열렸어요!`)
                }}
              >
                열기
              </button>
            </div>
          </div>
        </div>
      )}
      {hop && (
        <GameLoader
          hop={hop}
          onSwap={() => {
            pending?.()
            setPending(null)
          }}
          onDone={() => setHop(null)}
        />
      )}
    </div>
  )
}

// 드레스룸: 거울 앞에서 옷을 입어 본다. 옷 판매가 닫혀 있는 동안은 '입어 보기'만.
function DressRoom({ onBack }: { onBack: () => void }) {
  const s = useGame()
  const g = s.guild!
  const outfits = SHOP.filter((i) => i.slot === 'outfit')
  const worn = g.cat.equipped.find((id) => itemOf(id)?.slot === 'outfit') ?? null
  const [tryOn, setTryOn] = useState<string | null>(worn)
  const it = tryOn ? itemOf(tryOn) : null
  const owned = tryOn ? g.ownedItems.includes(tryOn) : true
  return (
    <div className="dr">
      <header className="cw-hud">
        <button className="cw-round" onClick={onBack} aria-label="나가기">
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 4 L6.5 10 L12.5 16" />
          </svg>
        </button>
        <span className="cw-place">드레스룸</span>
        <span className="cw-coin">
          <Gold value={g.gold} size={16} />
        </span>
      </header>
      <div className="dr-stage">
        <div className="dr-mirror">
          <div className="dr-glass">
            <img key={tryOn ?? 'base'} className="dr-cat" src={ART[tryOn ?? 'sit']} alt="" />
          </div>
        </div>
        <div className="dr-tag">
          <b>{it ? it.name : '기본 모습'}</b>
          <small>
            {!it ? '아무것도 안 입었어요' : !OUTFIT_OPEN ? '입어 보기만 할 수 있어요 · 옷 판매 준비 중' : owned ? '내 옷이에요' : `${it.price.toLocaleString()}G`}
          </small>
        </div>
      </div>
      <div className="dr-sheet">
        <div className="dr-grid">
          <button className={!tryOn ? 'on' : ''} onClick={() => setTryOn(null)}>
            <img src={ART.sit} alt="" />
            <small>기본</small>
          </button>
          {outfits.map((o) => (
            <button key={o.id} className={tryOn === o.id ? 'on' : ''} onClick={() => setTryOn(o.id)}>
              <img src={ART[o.id]} alt="" />
              <small>{o.name}</small>
            </button>
          ))}
        </div>
        {OUTFIT_OPEN && tryOn && owned && tryOn !== worn && (
          <button className="btn btn-primary btn-block" onClick={() => actions.toggleEquip(tryOn)}>
            이 옷 입기
          </button>
        )}
      </div>
    </div>
  )
}
