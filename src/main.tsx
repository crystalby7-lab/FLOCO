import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startSync } from './sync'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 서버 연결 (못 닿으면 혼자 쓰는 데모로)
startSync()

// 서버 연결 (못 닿으면 혼자 쓰는 데모로)
startSync()
