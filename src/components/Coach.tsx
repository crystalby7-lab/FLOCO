// 초보 가이드: 화면 위 요소를 하나씩 밝게 비추고, 고양이가 말풍선으로 설명해준다 (토스 모의투자 안내처럼).
// 처음 들어오면 자동으로 한 번, 그 뒤에는 '초보 가이드' 버튼으로 다시 볼 수 있다.
import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ART } from './CatView'

export type CoachStep = { sel: string; title: string; body: string; cat?: string }

export const ACCOUNT_GUIDE: CoachStep[] = [
  { sel: '.mkt-row', title: '시장이 열렸는지 봐요', body: '한국 시장(KOSPI)과 미국 시장(NASDAQ)이 지금 열렸는지, 오늘 얼마나 움직였는지예요. 빨강은 오름, 파랑은 내림이에요.', cat: 't_wave' },
  { sel: '.go-market-top', title: '여기서 종목을 골라요', body: '학습용 종목 25개가 묶음별로 있어요. 마음에 드는 종목은 ☆를 눌러 관심에 모아요.', cat: 't_happy' },
  { sel: '.acct-card', title: '내 모의투자 계좌', body: '1,000만원 연습용 돈으로 시작해요. 총 자산은 현금과 가진 종목을 더한 거예요. 진짜 돈은 아니니 마음껏 연습해요.' },
  { sel: '.acct-split', title: '살 수 있는 돈과 투자한 돈', body: '주문가능금액은 지금 바로 쓸 수 있는 현금, 투자중 금액은 이미 산 종목의 지금 값이에요.' },
  { sel: '.acct-sum', title: '얼마나 벌었나', body: '평가금, 수익금, 수익률이에요. 모르는 말 옆 ⓘ를 누르면 고양이가 뜻을 알려줘요.', cat: 't_think' },
  { sel: '.acct-tip-btn', title: '막히면 투자팁', body: '처음 투자할 때 알아두면 좋은 기본기를 모아뒀어요. 이 가이드는 오른쪽 위 \'가이드\'로 다시 볼 수 있어요.', cat: 't_sprout' },
]

export const ORDER_GUIDE: CoachStep[] = [
  { sel: '.tk-head', title: '지금 가격', body: '가장 최근 거래일의 마지막 가격(종가)이에요. 아래 칩은 하루, 5일, 20일 동안 얼마나 움직였는지예요.', cat: 't_wave' },
  { sel: '.ob-row.ask', title: '파란 칸은 팔려는 사람', body: '매도호가예요. 이 가격에 팔겠다는 사람들이 기다리고 있어요. 맨 아래 파란 칸이 지금 가장 싸게 살 수 있는 값이에요.' },
  { sel: '.ob-now', title: '가운데는 종가', body: '파란 칸과 빨간 칸 사이의 기준 가격이에요. 오른쪽 숫자는 그 가격에 몇 주가 기다리는지(잔량)예요.' },
  { sel: '.ob-row.bid', title: '빨간 칸은 사려는 사람', body: '매수호가예요. 이 가격에 사겠다는 사람들이에요. 내가 팔 때는 맨 위 빨간 칸 값에 팔 수 있어요.' },
  { sel: '.ob-type', title: '지정가와 시장가', body: '지정가는 내가 정한 값에만, 시장가는 지금 가장 좋은 값에 바로 사고팔아요. 호가 칸을 누르면 그 가격으로 지정가가 정해져요.', cat: 't_think' },
  { sel: '.ob-sum', title: '얼마를 쓰는지 확인', body: '수량을 정하면 주문금액이 계산돼요. 처음엔 계좌의 10%처럼 조금만 사보는 걸 추천해요.' },
  { sel: '.ob-go', title: '근거를 쓰고 주문해요', body: '누르면 왜 사는지 근거 3칸을 써요. 고양이가 확인하고, 길드 친구들이 확인하면 체결돼요.', cat: 't_happy' },
]

type Rect = { x: number; y: number; w: number; h: number }

export function Coach({ steps, onDone }: { steps: CoachStep[]; onDone: () => void }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const step = steps[i]

  useEffect(() => {
    setHost(document.querySelector('.app') as HTMLElement | null)
  }, [])

  useLayoutEffect(() => {
    if (!host) return
    const el = document.querySelectorAll(step.sel)
    const target = (step.sel === '.ob-row.ask' ? el[el.length - 1] : el[0]) as HTMLElement | undefined
    if (!target) {
      setRect(null)
      return
    }
    target.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const measure = () => {
      const a = host.getBoundingClientRect()
      const r = target.getBoundingClientRect()
      setRect({ x: r.left - a.left - 6, y: r.top - a.top - 6, w: r.width + 12, h: r.height + 12 })
    }
    const t = window.setTimeout(measure, 380)
    measure()
    return () => window.clearTimeout(t)
  }, [i, host, step.sel])

  if (!host) return null
  const hostH = host.clientHeight
  const below = !rect || rect.y + rect.h < hostH * 0.55
  const last = i === steps.length - 1

  return createPortal(
    <div className="coach" onClick={(e) => e.stopPropagation()}>
      {rect ? <div className="coach-hole" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} /> : <div className="coach-dim" />}
      <div className={`coach-bubble ${below ? 'below' : 'above'}`} style={rect ? (below ? { top: Math.min(rect.y + rect.h + 12, hostH - 220) } : { bottom: hostH - rect.y + 12 }) : { top: '35%' }}>
        <img className="coach-cat" src={ART[step.cat ?? 'sit']} alt="" />
        <div className="coach-text">
          <small>
            {i + 1} / {steps.length}
          </small>
          <b>{step.title}</b>
          <p>{step.body}</p>
        </div>
        <div className="coach-nav">
          <button className="coach-skip" onClick={onDone}>
            건너뛰기
          </button>
          <span className="grow" />
          {i > 0 && (
            <button className="coach-prev" onClick={() => setI(i - 1)}>
              이전
            </button>
          )}
          <button className="coach-next" onClick={() => (last ? onDone() : setI(i + 1))}>
            {last ? '시작하기' : '다음'}
          </button>
        </div>
      </div>
    </div>,
    host,
  )
}
