import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startSync } from './sync'
import { loadPrices } from './data/market'
import { loadCompanies } from './data/companies'
import { notifyPrices } from './store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 서버 연결 (못 닿으면 혼자 쓰는 데모로)
startSync()

// 실제 종가와 대형주 실적 (못 받으면 그 부분만 빠진다). 받고 나면 화면을 다시 그린다.
Promise.all([loadPrices(), loadCompanies()]).then(([prices, companies]) => (prices || companies) && notifyPrices())
