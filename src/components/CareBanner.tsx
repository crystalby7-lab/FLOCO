// '고양이 돌보러 가기' 가로 배너 — 홈 맨 위와 길드 맨 위에 똑같이 (길드가 같이 키우는 고양이 한 마리).
// 배고픔·기분·청결이 40 아래면 고양이 옆에 아이콘이 통통 뜨고, 고양이는 우는 얼굴.
import { catNow, useGame } from '../store'
import { ART } from './CatView'
import { timeOfDay } from './Playground'

export function CareBanner({ onOpen, label }: { onOpen: () => void; label?: string }) {
  const s = useGame()
  const cat = catNow(s.guild!.cat)
  const tod = timeOfDay()
  const low = [
    { id: 'hunger', label: '배고파요', art: 'i_bowl', v: cat.hunger },
    { id: 'mood', label: '심심해요', art: 'i_yarn', v: cat.mood },
    { id: 'clean', label: '씻고 싶어요', art: 'i_duck', v: cat.clean ?? 80 },
  ].filter((n) => n.v < 40)
  return (
    <button className={`care-banner tod-${tod}`} onClick={onOpen} aria-label={`${cat.name} 돌보러 가기`}>
      <img className="cb-bg" src={ART.sc_home_house} alt="" />
      <span className="cb-shade" />
      <span className="cb-text">
        <small>{label ?? `${cat.name}네 집`}</small>
        <b>고양이 돌보러 가기 ›</b>
      </span>
      <span className="cb-cat">
        <img src={ART[low.length ? 'face_sad' : 'sit']} alt="" />
        {low.length > 0 && (
          <span className="cb-needs">
            {low.map((n) => (
              <span key={n.id} className="cb-need" title={n.label}>
                <img src={ART[n.art]} alt={n.label} />
              </span>
            ))}
          </span>
        )}
      </span>
    </button>
  )
}
