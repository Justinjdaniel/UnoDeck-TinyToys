import React, { useState } from 'react'
import { X, Volume2, VolumeX, Moon, Sun, BookOpen, Settings, Check } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { soundManager } from '../../utils/soundManager'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  isMuted: boolean
  volume: number
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  volume,
  onVolumeChange,
  onToggleMute,
}) => {
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'settings' | 'rules'>('settings')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-slate-950/50">
          <div className="flex gap-2">
            <button
              onClick={() => {
                soundManager.play('click')
                setActiveTab('settings')
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeTab === 'settings'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings size={14} />
              Settings
            </button>
            <button
              onClick={() => {
                soundManager.play('click')
                setActiveTab('rules')
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeTab === 'rules'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen size={14} />
              Rules
            </button>
          </div>
          <button
            onClick={() => {
              soundManager.play('click')
              onClose()
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Settings"
            aria-label="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-slate-200">
          {activeTab === 'settings' ? (
            <>
              {/* Sound Settings */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Volume2 size={16} />
                  Audio & Sound Effects
                </h4>
                <div className="flex items-center justify-between gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={onToggleMute}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                  <span className="text-xs font-bold text-cyan-300 w-10 text-right">
                    {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
              </div>

              {/* Theme Settings */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  Appearance Mode
                </h4>
                <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">
                    Current Theme:{' '}
                    <span className="font-black text-cyan-300 uppercase">{theme} Mode</span>
                  </span>
                  <button
                    onClick={() => {
                      soundManager.play('click')
                      toggleTheme()
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-black border border-cyan-500/30 transition-all"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun size={14} className="text-amber-400" /> Switch to Light
                      </>
                    ) : (
                      <>
                        <Moon size={14} className="text-indigo-400" /> Switch to Dark
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Deck Style Selector */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">
                  Deck Style
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border-2 border-cyan-400 flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-cyan-300">Neon Classic</span>
                    <Check size={16} className="text-cyan-400" />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between opacity-50 cursor-not-allowed">
                    <span className="text-xs font-bold text-slate-500">Cyberpunk (Locked)</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Rules Section */
            <div className="space-y-4 text-xs font-medium text-slate-300">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <h5 className="font-extrabold text-cyan-300 uppercase mb-1 text-[11px]">
                  Matching Play
                </h5>
                <p className="leading-relaxed">
                  Match cards by color or symbol/number. Wild cards can be played on any turn to
                  choose a new active color.
                </p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <h5 className="font-extrabold text-cyan-300 uppercase mb-1 text-[11px]">
                  Card Stacking
                </h5>
                <p className="leading-relaxed">
                  Draw +2 and Wild Draw +4 cards stack! Playing a +2 on an existing +2 passes +4
                  total cards to the next player.
                </p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <h5 className="font-extrabold text-cyan-300 uppercase mb-1 text-[11px]">
                  UNO Call & Challenge
                </h5>
                <p className="leading-relaxed">
                  Yell UNO when you have 2 cards remaining and play 1. If you forget, opponents can
                  challenge you to make you draw 2 penalty cards.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-cyan-500/20 bg-slate-950/50 flex justify-end">
          <button
            onClick={() => {
              soundManager.play('click')
              onClose()
            }}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(6,182,212,0.6)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
