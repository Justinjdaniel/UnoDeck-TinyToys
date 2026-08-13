import React from 'react'
import * as Symbols from './symbols'

export type CardColorType =
  'Red' | 'Blue' | 'Green' | 'Yellow' | 'Wild' | 'red' | 'blue' | 'green' | 'yellow' | 'wild'

export interface UnoCardUIData {
  id: string
  color: CardColorType
  value: string
}

interface UnoCardUIProps {
  card: UnoCardUIData
  isPlayable?: boolean
  onClick?: () => void
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  isFaceDown?: boolean
}

const renderSymbol = (value: string, className: string) => {
  const norm = value.toLowerCase()
  switch (norm) {
    case '0':
      return <Symbols.Number0 size="100%" className={className} />
    case '1':
      return <Symbols.Number1 size="100%" className={className} />
    case '2':
      return <Symbols.Number2 size="100%" className={className} />
    case '3':
      return <Symbols.Number3 size="100%" className={className} />
    case '4':
      return <Symbols.Number4 size="100%" className={className} />
    case '5':
      return <Symbols.Number5 size="100%" className={className} />
    case '6':
      return <Symbols.Number6 size="100%" className={className} />
    case '7':
      return <Symbols.Number7 size="100%" className={className} />
    case '8':
      return <Symbols.Number8 size="100%" className={className} />
    case '9':
      return <Symbols.Number9 size="100%" className={className} />
    case 'skip':
      return <Symbols.SkipSymbol size="100%" className={className} />
    case 'reverse':
      return <Symbols.ReverseSymbol size="100%" className={className} />
    case 'draw2':
      return <Symbols.Draw2Symbol size="100%" className={className} />
    case 'wild':
      return <Symbols.WildSymbol size="100%" className={className} />
    case 'wilddraw4':
      return <Symbols.WildDraw4Symbol size="100%" className={className} />
    default:
      return <Symbols.Number0 size="100%" className={className} />
  }
}

export const UnoCardUI: React.FC<UnoCardUIProps> = ({
  card,
  isPlayable = false,
  onClick,
  disabled = false,
  className = '',
  style,
  isFaceDown = false,
}) => {
  const normColor = card.color.toLowerCase() as 'red' | 'blue' | 'green' | 'yellow' | 'wild'
  const normValue = card.value.toLowerCase()

  // Dynamic theme styling
  const getThemeClasses = () => {
    switch (normColor) {
      case 'red':
        return {
          bg: 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20 text-white border-red-400',
          oval: 'bg-red-700/40 border-red-400/50',
          text: 'text-white',
        }
      case 'blue':
        return {
          bg: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20 text-white border-blue-400',
          oval: 'bg-blue-700/40 border-blue-400/50',
          text: 'text-white',
        }
      case 'green':
        return {
          bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20 text-white border-emerald-400',
          oval: 'bg-emerald-700/40 border-emerald-400/50',
          text: 'text-white',
        }
      case 'yellow':
        return {
          bg: 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/20 text-slate-900 border-amber-300',
          oval: 'bg-amber-600/30 border-amber-300/50',
          text: 'text-slate-900',
        }
      case 'wild':
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-800 to-slate-950 shadow-slate-950/40 text-white border-slate-700',
          oval: 'bg-slate-800 border-slate-700/50',
          text: 'text-white',
        }
    }
  }

  const theme = getThemeClasses()

  const formattedMiniValue = (() => {
    if (normValue === 'wilddraw4') return '+4'
    if (normValue === 'wild') return 'W'
    if (normValue === 'draw2') return '+2'
    if (normValue === 'skip') return 'Ø'
    if (normValue === 'reverse') return '⇄'
    return card.value
  })()

  // Tactile design: Realistic 3D card back
  if (isFaceDown) {
    return (
      <div
        className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-4 border-slate-800 bg-slate-900 flex flex-col items-center justify-center relative shadow-lg flex-shrink-0 transition-all select-none ${className}`}
        style={style}
      >
        <div className="absolute inset-1.5 bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-lg flex items-center justify-center border border-red-500 overflow-hidden shadow-inner">
          {/* Decorative pattern lines */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#fff_25%,transparent_25%,transparent_50%,#fff_50%,#fff_75%,transparent_75%,transparent)] bg-[length:12px_12px]" />
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white flex items-center justify-center font-black text-white italic text-lg sm:text-xl shadow-lg rotate-[-15deg] transform bg-gradient-to-br from-red-500 to-red-700">
            U
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={!disabled && isPlayable ? onClick : undefined}
      className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-4 flex flex-col items-center justify-center relative flex-shrink-0 select-none transition-all ${theme.bg} ${
        isPlayable && !disabled
          ? 'hover:-translate-y-3 hover:scale-105 active:scale-95 shadow-md border-white cursor-pointer ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950'
          : disabled || !isPlayable
            ? 'opacity-60 grayscale-[10%]'
            : ''
      } ${className}`}
      style={style}
    >
      {/* Top Left Mini Value */}
      <div className="absolute top-1 left-1.5 text-[10px] sm:text-xs font-black tracking-tighter leading-none">
        {formattedMiniValue}
      </div>

      {/* Realistic Inner Colored Oval Background */}
      <div
        className={`w-11 h-16 sm:w-14 sm:h-20 rounded-[50%] border flex items-center justify-center transform rotate-[-12deg] shadow-inner ${theme.oval}`}
      >
        <div className="transform rotate-[12deg] w-7 h-7 sm:w-10 sm:h-10 text-center flex items-center justify-center drop-shadow-md">
          {renderSymbol(card.value, theme.text)}
        </div>
      </div>

      {/* Bottom Right Mini Value (Rotated) */}
      <div className="absolute bottom-1 right-1.5 text-[10px] sm:text-xs font-black tracking-tighter leading-none transform rotate-180">
        {formattedMiniValue}
      </div>
    </div>
  )
}
