// 길드 고양이 그림 (직접 그린 SVG). 디자인 외주가 나오면 이 컴포넌트만 교체.
import type { Cat } from '../types'

export function CatView({ cat, size = 220 }: { cat: Cat; size?: number }) {
  const eq = (id: string) => cat.equipped.includes(id)
  const happy = cat.mood >= 60
  const sad = cat.mood < 30
  const hungry = cat.hunger < 30

  return (
    <svg viewBox="0 0 240 220" width={size} height={size * (220 / 240)} className="cat-svg" role="img" aria-label={`${cat.name} 고양이`}>
      {/* 방 */}
      {eq('cushion') && <ellipse cx="120" cy="196" rx="86" ry="16" fill="#F5C84C" stroke="#1B1F2A" strokeWidth="2.5" />}
      {!eq('cushion') && <ellipse cx="120" cy="198" rx="70" ry="9" fill="#1B1F2A" opacity="0.08" />}
      {eq('plant') && (
        <g transform="translate(196 120)">
          <path d="M8 40 C0 20 -4 8 6 0 C12 14 14 26 12 40" fill="#5DAA68" stroke="#1B1F2A" strokeWidth="2" />
          <path d="M14 40 C20 22 30 14 36 16 C32 28 24 36 18 40" fill="#7CC489" stroke="#1B1F2A" strokeWidth="2" />
          <rect x="2" y="38" width="26" height="30" rx="4" fill="#D9714E" stroke="#1B1F2A" strokeWidth="2.5" />
        </g>
      )}

      <g className={sad ? 'cat-body cat-slow' : 'cat-body'}>
        {/* 꼬리 */}
        <path d="M172 170 C206 160 214 120 196 104" fill="none" stroke="#1B1F2A" strokeWidth="14" strokeLinecap="round" />
        <path d="M172 170 C206 160 214 120 196 104" fill="none" stroke="#F2A65A" strokeWidth="9" strokeLinecap="round" />
        {/* 몸 */}
        <ellipse cx="120" cy="158" rx="62" ry="40" fill="#F2A65A" stroke="#1B1F2A" strokeWidth="3" />
        <ellipse cx="120" cy="166" rx="34" ry="24" fill="#FFF6E6" />
        {/* 귀 */}
        <path d="M68 78 L76 30 L106 64 Z" fill="#F2A65A" stroke="#1B1F2A" strokeWidth="3" strokeLinejoin="round" />
        <path d="M172 78 L164 30 L134 64 Z" fill="#F2A65A" stroke="#1B1F2A" strokeWidth="3" strokeLinejoin="round" />
        <path d="M78 66 L81 44 L96 61 Z" fill="#F7B9A8" />
        <path d="M162 66 L159 44 L144 61 Z" fill="#F7B9A8" />
        {/* 머리 */}
        <ellipse cx="120" cy="98" rx="60" ry="50" fill="#F2A65A" stroke="#1B1F2A" strokeWidth="3" />
        <path d="M104 52 L110 70 M120 50 L120 70 M136 52 L130 70" stroke="#D9843C" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="120" cy="114" rx="30" ry="22" fill="#FFF6E6" />

        {/* 눈 */}
        {happy ? (
          <>
            <path d="M88 96 Q96 86 104 96" stroke="#1B1F2A" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M136 96 Q144 86 152 96" stroke="#1B1F2A" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : sad ? (
          <>
            <path d="M88 92 Q96 100 104 94" stroke="#1B1F2A" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M136 94 Q144 100 152 92" stroke="#1B1F2A" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="96" cy="94" rx="6" ry="8" fill="#1B1F2A" />
            <ellipse cx="144" cy="94" rx="6" ry="8" fill="#1B1F2A" />
          </>
        )}
        {eq('glasses') && (
          <g fill="none" stroke="#1B1F2A" strokeWidth="3">
            <circle cx="96" cy="94" r="15" />
            <circle cx="144" cy="94" r="15" />
            <path d="M111 94 L129 94" />
          </g>
        )}
        {/* 코·입 */}
        <path d="M114 108 L126 108 L120 115 Z" fill="#E86F6F" />
        <path d={sad ? 'M110 126 Q120 120 130 126' : 'M110 120 Q115 126 120 120 Q125 126 130 120'} stroke="#1B1F2A" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* 볼 */}
        {happy && (
          <>
            <ellipse cx="80" cy="114" rx="8" ry="5" fill="#F7B9A8" opacity="0.9" />
            <ellipse cx="160" cy="114" rx="8" ry="5" fill="#F7B9A8" opacity="0.9" />
          </>
        )}
        {/* 수염 */}
        <g stroke="#1B1F2A" strokeWidth="2" strokeLinecap="round">
          <path d="M70 110 L48 104 M70 118 L48 120" />
          <path d="M170 110 L192 104 M170 118 L192 120" />
        </g>

        {/* 앞발 */}
        <ellipse cx="98" cy="190" rx="14" ry="9" fill="#FFF6E6" stroke="#1B1F2A" strokeWidth="3" />
        <ellipse cx="142" cy="190" rx="14" ry="9" fill="#FFF6E6" stroke="#1B1F2A" strokeWidth="3" />

        {/* 꾸미기 */}
        {eq('scarf') && (
          <g>
            <path d="M74 136 Q120 156 166 136 L166 150 Q120 170 74 150 Z" fill="#2F6BFF" stroke="#1B1F2A" strokeWidth="3" strokeLinejoin="round" />
            <path d="M140 150 L146 182 L132 180 L130 154 Z" fill="#2F6BFF" stroke="#1B1F2A" strokeWidth="3" strokeLinejoin="round" />
          </g>
        )}
        {eq('ribbon') && (
          <g transform="translate(150 50)">
            <path d="M0 0 L-18 -12 L-18 12 Z M0 0 L18 -12 L18 12 Z" fill="#E5484D" stroke="#1B1F2A" strokeWidth="3" strokeLinejoin="round" />
            <circle r="6" fill="#E5484D" stroke="#1B1F2A" strokeWidth="3" />
          </g>
        )}
        {eq('beanie') && (
          <g>
            <path d="M70 66 Q120 6 170 66 Z" fill="#7B61FF" stroke="#1B1F2A" strokeWidth="3" strokeLinejoin="round" />
            <rect x="66" y="60" width="108" height="14" rx="7" fill="#A897FF" stroke="#1B1F2A" strokeWidth="3" />
            <circle cx="120" cy="20" r="10" fill="#FFF6E6" stroke="#1B1F2A" strokeWidth="3" />
          </g>
        )}
      </g>

      {hungry && (
        <g className="bubble">
          <rect x="164" y="20" width="62" height="32" rx="14" fill="#fff" stroke="#1B1F2A" strokeWidth="2.5" />
          <text x="195" y="42" textAnchor="middle" fontSize="16">🥣?</text>
        </g>
      )}
    </svg>
  )
}
