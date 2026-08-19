import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type CardColor } from '../../engine/unoEngine'
import { soundManager } from '../../utils/soundManager'

interface WildColorModalProps {
  isOpen: boolean
  onChooseColor: (color: CardColor) => void
}

export const WildColorModal: React.FC<WildColorModalProps> = ({ isOpen, onChooseColor }) => {
  const colors: { name: CardColor; bg: string; border: string; glow: string }[] = [
    {
      name: 'Red',
      bg: 'bg-red-600 hover:bg-red-500',
      border: 'border-red-400',
      glow: 'shadow-[0_0_18px_rgba(239,68,68,0.8)]',
    },
    {
      name: 'Blue',
      bg: 'bg-blue-600 hover:bg-blue-500',
      border: 'border-cyan-300',
      glow: 'shadow-[0_0_18px_rgba(6,182,212,0.8)]',
    },
    {
      name: 'Green',
      bg: 'bg-emerald-600 hover:bg-emerald-500',
      border: 'border-emerald-300',
      glow: 'shadow-[0_0_18px_rgba(16,185,129,0.8)]',
    },
    {
      name: 'Yellow',
      bg: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
      border: 'border-amber-200',
      glow: 'shadow-[0_0_18px_rgba(245,158,11,0.8)]',
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-end p-4 sm:p-6"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md mx-auto bg-slate-900 border-t-2 border-cyan-400 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.5)]"
          >
            <h3 className="text-center font-black text-base sm:text-lg text-cyan-300 mb-2 uppercase tracking-wider glow-text-cyan">
              SELECT WILD COLOR
            </h3>
            <p className="text-center text-xs text-slate-300 mb-6 max-w-xs mx-auto font-medium">
              Choose the active color for the next play turn.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {colors.map((col) => (
                <button
                  key={col.name}
                  onClick={() => {
                    soundManager.play('click')
                    onChooseColor(col.name)
                  }}
                  className={`py-4 px-2 rounded-2xl text-xs sm:text-sm font-black border-2 text-white transition-all hover:scale-105 active:scale-95 shadow-xl ${col.bg} ${col.border} ${col.glow}`}
                >
                  {col.name.toUpperCase()}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
