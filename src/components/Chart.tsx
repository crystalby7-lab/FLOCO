// 가격 흐름 그래프 (선 + 옅은 면 + 끝점, 산 가격 기준선)
export function PriceChart({
  data,
  height = 120,
  base,
  compact = false,
}: {
  data: number[]
  height?: number
  base?: number // 산 가격 (점선)
  compact?: boolean
}) {
  const W = 300
  const H = height
  const pad = compact ? 3 : 10
  const all = base ? [...data, base] : data
  const min = Math.min(...all)
  const max = Math.max(...all)
  const span = max - min || 1
  const x = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2)
  const y = (v: number) => pad + (1 - (v - min) / span) * (H - pad * 2)
  const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1)} ${H} L${x(0)} ${H} Z`
  const up = data[data.length - 1] >= (base ?? data[0])
  const tone = up ? 'up' : 'down'
  return (
    <svg className={`chart ${tone} ${compact ? 'compact' : ''}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      {!compact && [0.25, 0.5, 0.75].map((f) => <line key={f} className="grid" x1="0" x2={W} y1={H * f} y2={H * f} />)}
      <path className="area" d={area} />
      {base && <line className="base" x1="0" x2={W} y1={y(base)} y2={y(base)} />}
      <path className="line" d={line} vectorEffect="non-scaling-stroke" />
      {!compact && <circle className="dot" cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="4" />}
    </svg>
  )
}
