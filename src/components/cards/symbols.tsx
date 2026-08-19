import React from 'react'

interface SymbolProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
}

const createNumberSymbol = (digit: string, hasUnderline: boolean): React.FC<SymbolProps> => {
  return ({ size = '100%', ...props }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="currentColor" {...props}>
      <text
        x="50"
        y="54"
        fontSize="70"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle"
        dominantBaseline="middle"
        className="select-none font-black italic"
      >
        {digit}
      </text>
      {hasUnderline && <rect x="30" y="80" width="40" height="6" rx="3" />}
    </svg>
  )
}

export const Number0 = createNumberSymbol('0', false)
export const Number1 = createNumberSymbol('1', false)
export const Number2 = createNumberSymbol('2', false)
export const Number3 = createNumberSymbol('3', false)
export const Number4 = createNumberSymbol('4', false)
export const Number5 = createNumberSymbol('5', false)
export const Number6 = createNumberSymbol('6', true)
export const Number7 = createNumberSymbol('7', false)
export const Number8 = createNumberSymbol('8', false)
export const Number9 = createNumberSymbol('9', true)

export const SkipSymbol: React.FC<SymbolProps> = ({ size = '100%', ...props }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="12"
    {...props}
  >
    <circle cx="50" cy="50" r="36" />
    <line x1="24" y1="24" x2="76" y2="76" strokeLinecap="round" />
  </svg>
)

export const ReverseSymbol: React.FC<SymbolProps> = ({ size = '100%', ...props }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="10"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M 20,40 C 20,20 80,20 80,40" />
    <path d="M 12,32 L 20,40 L 28,32" fill="none" strokeWidth="10" />
    <path d="M 80,60 C 80,80 20,80 20,60" />
    <path d="M 88,68 L 80,60 L 72,68" fill="none" strokeWidth="10" />
  </svg>
)

export const Draw2Symbol: React.FC<SymbolProps> = ({ size = '100%', ...props }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} fill="currentColor" {...props}>
    <rect
      x="22"
      y="15"
      width="40"
      height="56"
      rx="6"
      fill="currentColor"
      stroke="white"
      strokeWidth="4"
    />
    <text
      x="42"
      y="52"
      fontSize="26"
      fontWeight="900"
      fill="white"
      textAnchor="middle"
      dominantBaseline="middle"
      className="font-sans italic"
    >
      +2
    </text>
    <rect
      x="38"
      y="29"
      width="40"
      height="56"
      rx="6"
      fill="currentColor"
      stroke="white"
      strokeWidth="4"
    />
    <text
      x="58"
      y="66"
      fontSize="26"
      fontWeight="900"
      fill="white"
      textAnchor="middle"
      dominantBaseline="middle"
      className="font-sans italic"
    >
      +2
    </text>
  </svg>
)

export const WildSymbol: React.FC<SymbolProps> = ({ size = '100%', ...props }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} {...props}>
    <g transform="translate(50, 50) rotate(-45)">
      <path
        d="M 0,0 L -35,-35 A 50,50 0 0,1 35,-35 Z"
        fill="#EF4444"
        stroke="white"
        strokeWidth="2"
      />
      <path
        d="M 0,0 L 35,-35 A 50,50 0 0,1 35,35 Z"
        fill="#3B82F6"
        stroke="white"
        strokeWidth="2"
      />
      <path
        d="M 0,0 L 35,35 A 50,50 0 0,1 -35,35 Z"
        fill="#F59E0B"
        stroke="white"
        strokeWidth="2"
      />
      <path
        d="M 0,0 L -35,35 A 50,50 0 0,1 -35,-35 Z"
        fill="#10B981"
        stroke="white"
        strokeWidth="2"
      />
    </g>
    <circle cx="50" cy="50" r="10" fill="white" />
  </svg>
)

export const WildDraw4Symbol: React.FC<SymbolProps> = ({ size = '100%', ...props }) => {
  const filterId = React.useId().replace(/:/g, '-')
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} {...props}>
      <rect
        x="15"
        y="15"
        width="34"
        height="48"
        rx="5"
        fill="#F59E0B"
        stroke="white"
        strokeWidth="3"
        transform="rotate(-15, 32, 39)"
      />
      <rect
        x="28"
        y="15"
        width="34"
        height="48"
        rx="5"
        fill="#EF4444"
        stroke="white"
        strokeWidth="3"
        transform="rotate(-5, 45, 39)"
      />
      <rect
        x="42"
        y="18"
        width="34"
        height="48"
        rx="5"
        fill="#10B981"
        stroke="white"
        strokeWidth="3"
        transform="rotate(5, 59, 42)"
      />
      <rect
        x="52"
        y="24"
        width="34"
        height="48"
        rx="5"
        fill="#3B82F6"
        stroke="white"
        strokeWidth="3"
        transform="rotate(15, 69, 48)"
      />
      <filter id={filterId}>
        <feDropShadow dx="2" dy="2" stdDeviation="1.5" floodOpacity="0.5" />
      </filter>
      <text
        x="50"
        y="76"
        fontSize="30"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="white"
        stroke="#1E293B"
        strokeWidth="2"
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-black italic select-none"
        filter={`url(#${filterId})`}
      >
        +4
      </text>
    </svg>
  )
}
