// 플로월드에 들어갈 때마다 나오는 입장 화면: 구름이 걷히고, 마을이 솟아오르고, 고양이가 달려간다.
import { useEffect, useState } from 'react'
import { ART } from './CatView'

const TOWN = ['t_redroof', 't_bluehouse', 't_church', 't_cafe', 't_shop']

export function WorldIntro({ chapter, region, onDone }: { chapter: number; region: string; onDone: () => void }) {
  const [out, setOut] = useState(false)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t1 = setTimeout(() => setOut(true), reduce ? 500 : 2100)
    const t2 = setTimeout(onDone, reduce ? 800 : 2550)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])
  return (
    <div className={`wi ${out ? 'out' : ''}`} onClick={onDone}>
      <div className="wi-sun" />
      <img className="wi-cloud c1" src={ART.bg_cloud} alt="" />
      <img className="wi-cloud c2" src={ART.bg_cloud} alt="" />
      <img className="wi-cloud c3" src={ART.bg_cloud} alt="" />
      <div className="wi-title">
        <div className="wi-logo">
          {'플로월드'.split('').map((ch, i) => (
            <span key={i} style={{ animationDelay: `${0.25 + i * 0.09}s` }}>
              {ch}
            </span>
          ))}
        </div>
        <div className="wi-stage">
          CHAPTER {chapter} · {region}
        </div>
      </div>
      <div className="wi-town">
        {TOWN.map((t, i) => (
          <img key={t} src={ART[t]} alt="" style={{ animationDelay: `${0.7 + i * 0.12}s` }} />
        ))}
      </div>
      <div className="wi-ground" />
      <img className="wi-cat" src={ART.walk} alt="" />
      <div className="wi-load">
        <i />
      </div>
      <small className="wi-skip">눌러서 바로 들어가기</small>
    </div>
  )
}
