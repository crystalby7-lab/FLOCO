import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startSync } from './sync'
import { loadPrices } from './data/market'
import { notifyPrices } from './store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 서버 연결 (못 닿으면 혼자 쓰는 데모로)
startSync()

// 실제 종가 (못 받으면 가짜 시세로 돈다). 받고 나면 화면을 다시 그린다.
loadPrices().then((ok) => ok && notifyPrices())
