// FLOCO 로고: 하늘색 타일 위로 고개를 내민 고양이 + 글자
import face from '../assets/logo-face.png'

export function Wordmark({ large = false }: { large?: boolean }) {
  return (
    <span className={`wordmark ${large ? 'lg' : ''}`}>
      <span className="wm-mark">
        <img src={face} alt="" draggable={false} />
      </span>
      <span className="wm-text">floco</span>
    </span>
  )
}
