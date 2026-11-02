// 플로코 고양이 (오리지널 디자인: 줄무늬 이마 + 둥근 몸)
import type { Cat } from '../types'

const INK = '#5B4636'

export function CatView({ cat, size = 220 }: { cat: Cat; size?: number }) {
  const eq = (id: string) => cat.equipped.includes(id)
  const happy = cat.mood >= 60
  const sad = cat.mood < 30
  const hungry = cat.hunger < 30
  const st = { stroke: INK, strokeWidth: 2.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

  return (
    <svg viewBox="0 0 240 220" width={size} height={size * (220 / 240)} className="cat-svg" role="img" aria-label={`${cat.name || '고양이'}`}>
      {eq('cushion') ? (
        <g>
          <ellipse cx="120" cy="198" rx="84" ry="15" fill="#F6D27A" {...st} />
          <ellipse cx="120" cy="194" rx="58" ry="7" fill="#FBE4A6" />
        </g>
      ) : (
        <ellipse cx="120" cy="200" rx="66" ry="8" fill={INK} opacity="0.12" />
      )}
      {eq('plant') && (
        <g transform="translate(192 130)">
          <path d="M14 30 C4 24 2 10 10 6 C16 12 18 22 14 30 Z" fill="#9BCB7E" {...st} />
          <path d="M20 30 C26 20 38 18 36 26 C32 31 26 32 20 30 Z" fill="#B5DB98" {...st} />
          <path d="M6 30 h24 l-3 26 h-18 Z" fill="#E5A07E" {...st} />
        </g>
      )}

      <g className={sad ? 'cat-body cat-slow' : 'cat-body'}>
        {/* 꼬리 */}
        <path d="M168 176 C200 172 214 140 200 118 C196 112 188 114 190 122 C198 140 186 160 166 162" fill="#F6C08F" {...st} />
        {/* 몸 */}
        <path d="M66 190 C58 150 76 124 120 124 C164 124 182 150 174 190 Z" fill="#F6C08F" {...st} />
        <path d="M94 190 C92 166 102 152 120 152 C138 152 148 166 146 190 Z" fill="#FFF4E4" />
        {/* 앞발 */}
        <path d="M86 192 C86 182 104 182 104 192" fill="#FFF4E4" {...st} />
        <path d="M136 192 C136 182 154 182 154 192" fill="#FFF4E4" {...st} />

        {/* 머리 */}
        <path
          d="M64 98 C60 80 62 58 70 40 C80 46 90 54 98 60 C112 56 128 56 142 60 C150 54 160 46 170 40 C178 58 180 80 176 98 C172 126 150 140 120 140 C90 140 68 126 64 98 Z"
          fill="#F6C08F"
          {...st}
        />
        <path d="M74 52 C80 56 84 60 88 64 L78 72 Z" fill="#F4A9A0" opacity="0.7" />
        <path d="M166 52 C160 56 156 60 152 64 L162 72 Z" fill="#F4A9A0" opacity="0.7" />
        {/* 이마 줄무늬 */}
        <path d="M108 64 L111 76 M120 62 L120 76 M132 64 L129 76" stroke="#D99662" strokeWidth="4" strokeLinecap="round" />
        {/* 주둥이 */}
        <ellipse cx="120" cy="112" rx="24" ry="17" fill="#FFF4E4" />

        {/* 눈 */}
        {happy ? (
          <>
            <path d="M88 98 Q95 90 102 98" fill="none" {...st} strokeWidth="3.2" />
            <path d="M138 98 Q145 90 152 98" fill="none" {...st} strokeWidth="3.2" />
          </>
        ) : sad ? (
          <>
            <path d="M88 96 Q95 102 102 97" fill="none" {...st} strokeWidth="3.2" />
            <path d="M138 97 Q145 102 152 96" fill="none" {...st} strokeWidth="3.2" />
          </>
        ) : (
          <>
            <ellipse cx="95" cy="96" rx="4.5" ry="6" fill={INK} />
            <ellipse cx="145" cy="96" rx="4.5" ry="6" fill={INK} />
            <circle cx="96.5" cy="93.5" r="1.5" fill="#fff" />
            <circle cx="146.5" cy="93.5" r="1.5" fill="#fff" />
          </>
        )}
        {eq('glasses') && (
          <g fill="#EAF3FB" fillOpacity="0.35" {...st}>
            <circle cx="95" cy="96" r="14" />
            <circle cx="145" cy="96" r="14" />
            <path d="M109 96 h22" fill="none" />
          </g>
        )}
        {/* 볼 */}
        <ellipse cx="80" cy="112" rx="8" ry="5" fill="#F4A9A0" opacity={sad ? 0.3 : 0.75} />
        <ellipse cx="160" cy="112" rx="8" ry="5" fill="#F4A9A0" opacity={sad ? 0.3 : 0.75} />
        {/* 코·입 */}
        <path d="M116 106 h8 l-4 4 Z" fill="#E98A86" />
        <path d={sad ? 'M113 121 Q120 116 127 121' : 'M113 116 Q116.5 121 120 116 Q123.5 121 127 116'} fill="none" {...st} strokeWidth="2.2" />

        {/* 꾸미기 */}
        {eq('scarf') && (
          <g>
            <path d="M78 134 Q120 152 162 134 L164 146 Q120 166 76 146 Z" fill="#8FB3F5" {...st} />
            <path d="M134 150 L140 176 L128 175 L124 154 Z" fill="#8FB3F5" {...st} />
          </g>
        )}
        {eq('ribbon') && (
          <g transform="translate(152 56) rotate(15)">
            <path d="M0 0 L-15 -10 L-15 10 Z M0 0 L15 -10 L15 10 Z" fill="#F08A8A" {...st} />
            <circle r="5" fill="#F08A8A" {...st} />
          </g>
        )}
        {eq('beanie') && (
          <g>
            <path d="M72 66 C76 26 164 26 168 66 Z" fill="#B9A7F0" {...st} />
            <rect x="68" y="60" width="104" height="13" rx="6.5" fill="#D9CFF8" {...st} />
            <circle cx="120" cy="26" r="9" fill="#FFF7EA" {...st} />
          </g>
        )}
      </g>

      {hungry && (
        <g className="bubble">
          <path d="M168 16 h52 a12 12 0 0 1 12 12 v6 a12 12 0 0 1 -12 12 h-34 l-8 8 l-1 -8 h-9 a12 12 0 0 1 -12 -12 v-6 a12 12 0 0 1 12 -12 Z" fill="#FFFDF7" {...st} strokeWidth="2" />
          <text x="194" y="37" textAnchor="middle" fontSize="13" fill={INK} fontFamily="Jua, sans-serif">배고파</text>
        </g>
      )}
    </svg>
  )
}
