export function Wordmark({ large = false }: { large?: boolean }) {
  return (
    <span className={`wordmark ${large ? 'lg' : ''}`}>
      <span className="wm-mark">
        <i />
      </span>
      <span className="wm-text">floco</span>
    </span>
  )
}
