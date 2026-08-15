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
      // Unknown values render raw value instead of Symbols.Number0
      return <span className={`text-base font-black italic select-none ${className}`}>{value}</span>
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

  // Dynamic theme styling with neon glows
  const getThemeClasses = () => {
    switch (normColor) {
      case 'red':
        return {
          bg: 'bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.7)] ring-1 ring-red-400/80',
          oval: 'bg-red-950/60 border-red-400/70 shadow-[inset_0_0_8px_rgba(239,68,68,0.5)]',
          text: 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]',
        }
      case 'blue':
        return {
          bg: 'bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 text-white border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.7)] ring-1 ring-cyan-400/80',
          oval: 'bg-blue-950/60 border-cyan-300/70 shadow-[inset_0_0_8px_rgba(6,182,212,0.5)]',
          text: 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]',
        }
      case 'green':
        return {
          bg: 'bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 text-white border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.7)] ring-1 ring-emerald-400/80',
          oval: 'bg-emerald-950/60 border-emerald-300/70 shadow-[inset_0_0_8px_rgba(16,185,129,0.5)]',
          text: 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]',
        }
      case 'yellow':
        return {
          bg: 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-slate-950 border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.7)] ring-1 ring-amber-300/80',
          oval: 'bg-amber-950/40 border-amber-300/70 shadow-[inset_0_0_8px_rgba(245,158,11,0.5)]',
          text: 'text-slate-950 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]',
        }
      case 'wild':
      default:
        return {
          bg: 'bg-gradient-to-br from-purple-700 via-indigo-600 to-pink-600 text-white border-pink-300 shadow-[0_0_18px_rgba(236,72,153,0.8)] ring-1 ring-pink-400/80',
          oval: 'bg-slate-950/70 border-purple-300/70 shadow-[inset_0_0_10px_rgba(236,72,153,0.6)]',
          text: 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]',
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
        className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-4 border-slate-800 bg-slate-900 flex flex-col items-center justify-center relative shadow-[0_0_15px_rgba(59,130,246,0.3)] flex-shrink-0 transition-all select-none ${className}`}
        style={style}
      >
        <div className="absolute inset-1.5 bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-900 rounded-lg flex items-center justify-center border border-cyan-400 overflow-hidden shadow-inner">
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,#fff_25%,transparent_25%,transparent_50%,#fff_50%,#fff_75%,transparent_75%,transparent)] bg-[length:12px_12px]" />
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-cyan-300 flex items-center justify-center font-black text-white italic text-lg sm:text-xl shadow-[0_0_12px_rgba(6,182,212,0.8)] rotate-[-15deg] transform bg-gradient-to-br from-cyan-500 to-blue-700">
            U
          </div>
        </div>
      </div>
    )
  }

  const interactiveProps =
    isPlayable && !disabled
      ? {
          role: 'button',
          tabIndex: 0,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick?.()
            }
          },
        }
      : {}

  return (
    <div
      onClick={!disabled && isPlayable ? onClick : undefined}
      {...interactiveProps}
      className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 flex flex-col items-center justify-center relative flex-shrink-0 select-none transition-all ${theme.bg} ${
        isPlayable && !disabled
          ? 'hover:-translate-y-3 hover:scale-105 active:scale-95 shadow-lg border-white cursor-pointer ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 focus:outline-none focus:ring-4 animate-pulse'
          : disabled || !isPlayable
            ? 'opacity-85'
            : ''
      } ${className}`}
      style={style}
    >
      {/* Top Left Mini Value */}
      <div className="absolute top-1 left-1.5 text-[10px] sm:text-xs font-black tracking-tighter leading-none drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">
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
      <div className="absolute bottom-1 right-1.5 text-[10px] sm:text-xs font-black tracking-tighter leading-none transform rotate-180 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">
        {formattedMiniValue}
      </div>
    </div>
  )
}
