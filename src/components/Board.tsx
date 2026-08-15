import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCcw,
  Bot,
  User,
  Award,
  Volume2,
  VolumeX,
  Info,
  ArrowRight,
  Coins,
  Gem,
  Rocket,
  ShieldAlert,
} from 'lucide-react'
import { UnoCardUI, type CardColorType } from './UnoCardUI'
import { type UnoGameState, type UnoCard, type CardColor, type Player } from '../engine/unoEngine'
import { soundManager } from '../utils/soundManager'
import { ParticleBackground } from './ParticleBackground'

interface BoardProps {
  gameState: UnoGameState
  isMuted: boolean
  volume: number
  handleVolumeChange: (volume: number) => void
  toggleMute: () => void
  ruleModalOpen: boolean
  setRuleModalOpen: (open: boolean) => void
  handlePlayCard: (cardId: string) => void
  handleDrawCard: () => void
  handleSayUno: () => void
  handleChallenge: (targetPlayerId: string) => void
  handleChooseColor: (color: CardColor) => void
  handleInitGame: () => void
  isValidPlay: (card: UnoCard) => boolean
  handleQuitMatch?: () => void
}

// Mobile haptic feedback helper
const triggerHaptic = (type: 'light' | 'medium' | 'success') => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    if (type === 'light') window.navigator.vibrate(10)
    else if (type === 'medium') window.navigator.vibrate(30)
    else if (type === 'success') window.navigator.vibrate([40, 30, 40])
  }
}

export const Board: React.FC<BoardProps> = ({
  gameState,
  isMuted,
  volume,
  handleVolumeChange,
  toggleMute,
  ruleModalOpen,
  setRuleModalOpen,
  handlePlayCard,
  handleDrawCard,
  handleSayUno,
  handleChallenge,
  handleChooseColor,
  handleInitGame,
  isValidPlay,
  handleQuitMatch,
}) => {
  const isPassAndPlay = gameState.mode === 'LOCAL_PASS_PLAY'
  const activePlayer = gameState.players[gameState.currentPlayerIndex]

  const myPlayer = isPassAndPlay
    ? activePlayer
    : gameState.players.find((p) => p.id === 'player-0') || gameState.players[0]

  const opponentPlayers = gameState.players.filter((p) => p.id !== myPlayer.id)
  const botPlayer = opponentPlayers[0] || {
    id: 'bot-1',
    name: 'AstroBot v2',
    isBot: true,
    hand: [],
  }

  const isMyTurn = gameState.currentPlayerIndex === gameState.players.indexOf(myPlayer)
  const topCard =
    gameState.discardPile.length > 0
      ? gameState.discardPile[gameState.discardPile.length - 1]
      : null

  const dragActiveRef = useRef(false)
  const isWildModalOpen = !!(gameState.selectedWildCard && isMyTurn)

  // Pass & Play transition state
  const [passConfirmed, setPassConfirmed] = useState(false)
  const lastTurnIndexRef = useRef(gameState.currentPlayerIndex)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const modalContainerRef = useRef<HTMLDivElement>(null)

  const showPassOverlay = isPassAndPlay && !passConfirmed

  useEffect(() => {
    if (isPassAndPlay && gameState.currentPlayerIndex !== lastTurnIndexRef.current) {
      setPassConfirmed(false)
      lastTurnIndexRef.current = gameState.currentPlayerIndex
    }
  }, [gameState.currentPlayerIndex, isPassAndPlay])

  // Move focus into pass confirmation modal & trap focus when modal is shown
  useEffect(() => {
    if (showPassOverlay) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus()
      }, 50)

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab' && modalContainerRef.current) {
          const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          )
          if (focusable.length > 0) {
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault()
              last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault()
              first.focus()
            }
          }
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [showPassOverlay])

  const [hasDealt, setHasDealt] = useState(false)
  const isPlaying = gameState.status === 'PLAYING'

  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        setHasDealt(true)
      }, 1200)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setHasDealt(false)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isPlaying])

  if (!myPlayer || opponentPlayers.length < 1) {
    return (
      <div className="mobile-viewport flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
        <p className="text-sm font-semibold text-cyan-400 mb-4 animate-pulse">
          Setting up game board...
        </p>
        <button
          onClick={handleInitGame}
          className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-[0_0_15px_rgba(6,182,212,0.8)]"
        >
          Initialize Match
        </button>
      </div>
    )
  }

  if (!topCard) {
    return (
      <div className="mobile-viewport flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
        <p className="text-sm font-semibold text-cyan-400 mb-4">No cards in discard pile.</p>
        <button
          onClick={handleInitGame}
          className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-[0_0_15px_rgba(6,182,212,0.8)]"
        >
          Restart Match
        </button>
      </div>
    )
  }

  return (
    <div className="mobile-viewport select-none flex flex-col justify-between text-white overflow-hidden relative">
      {/* Dynamic Particle Canvas */}
      <ParticleBackground />

      {/* Main Container Wrapper with Neon Geometric Frame */}
      <div
        aria-hidden={showPassOverlay}
        inert={showPassOverlay ? true : undefined}
        className="w-full h-full flex flex-col justify-between relative z-10 neon-frame"
      >
        {/* 1. TOP HEADER: Metallic Blue Bar with Lv. 14, 5000 Coins, 50 Gems & Title "VS BOT (AI) - Arena 3" */}
        <div className="metallic-header px-3 py-2.5 shrink-0 z-30 flex flex-col gap-1.5 shadow-xl">
          <div className="flex items-center justify-between">
            {/* Level & Resource Counters */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-400 rounded-md text-[10px] font-black text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                Lv. 14
              </span>

              <div className="flex items-center gap-1 bg-slate-950/80 border border-amber-400/60 px-2 py-0.5 rounded-md shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                <Coins size={12} className="text-amber-400" />
                <span className="text-[11px] font-extrabold text-amber-300">5000</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-950/80 border border-purple-400/60 px-2 py-0.5 rounded-md shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                <Gem size={12} className="text-purple-400" />
                <span className="text-[11px] font-extrabold text-purple-300">50</span>
              </div>
            </div>

            {/* Header Audio & Info Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  soundManager.play('click')
                  setRuleModalOpen(!ruleModalOpen)
                }}
                className="p-1 rounded-lg bg-blue-900/60 border border-cyan-400/40 text-cyan-300 hover:text-white transition-colors"
                title="Rules"
              >
                <Info size={16} />
              </button>
              <button
                onClick={toggleMute}
                className="p-1 rounded-lg bg-blue-900/60 border border-cyan-400/40 text-cyan-300 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button
                onClick={() => {
                  if (handleQuitMatch) handleQuitMatch()
                  else window.location.reload()
                }}
                className="text-[10px] font-black px-2 py-1 bg-red-900/60 border border-red-500/60 text-red-200 rounded-md hover:bg-red-700 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Arena Title */}
          <div className="text-center">
            <h2 className="text-xs font-black uppercase tracking-widest text-cyan-200 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]">
              VS BOT (AI) - Arena 3
            </h2>
          </div>
        </div>

        {/* 2. BOT PROFILE HEADER (AstroBot v2) */}
        <div className="flex justify-between items-center px-4 py-2 bg-slate-950/60 border-b border-cyan-500/20 shrink-0 relative z-20">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 p-0.5 shadow-[0_0_12px_rgba(99,102,241,0.8)] ${
                gameState.currentPlayerIndex === gameState.players.indexOf(botPlayer)
                  ? 'ring-2 ring-cyan-400 animate-pulse'
                  : ''
              }`}
            >
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-cyan-300">
                <Bot size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-cyan-300 tracking-wide">
                  AstroBot v2
                </span>
                <span className="px-1 py-0.2 bg-cyan-950 border border-cyan-500/40 text-[8px] font-bold text-cyan-400 rounded">
                  AI
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {botPlayer.hand.length} card{botPlayer.hand.length !== 1 ? 's' : ''} left
              </span>
            </div>
          </div>

          {gameState.unoCalls[botPlayer.id] && (
            <span className="px-2 py-0.5 bg-red-600 text-[9px] font-black tracking-wider uppercase rounded text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]">
              UNO!
            </span>
          )}

          {botPlayer.hand.length === 1 && !gameState.unoCalls[botPlayer.id] && (
            <button
              onClick={() => {
                triggerHaptic('medium')
                handleChallenge(botPlayer.id)
              }}
              className="flex items-center gap-1 px-2 py-1 bg-red-600/30 hover:bg-red-600 border border-red-500 rounded text-[9px] font-extrabold uppercase text-red-200 transition-all animate-bounce"
            >
              <ShieldAlert size={12} />
              Challenge
            </button>
          )}
        </div>

        {/* 3. CENTER BOARD AREA */}
        <div className="flex-1 flex flex-col justify-between p-3 relative overflow-hidden">
          {/* Action Log / Status Banner */}
          <div className="text-center z-10 my-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 border border-cyan-500/40 rounded-full text-[10px] text-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)] max-w-full">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="truncate">{gameState.lastActionDescription}</span>
            </div>
          </div>

          {/* Floating Neon Turn Direction Indicator */}
          <div className="flex flex-col items-center justify-center z-10 my-1">
            <div className="w-14 h-14 rounded-full neon-turn-circle flex items-center justify-center relative shadow-[0_0_20px_rgba(6,182,212,0.8)]">
              <motion.div
                animate={{
                  rotate: gameState.direction === 'clockwise' ? 360 : -360,
                }}
                transition={{
                  repeat: Infinity,
                  ease: 'linear',
                  duration: 5,
                }}
                className="text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]"
              >
                <RotateCcw size={28} />
              </motion.div>
            </div>
            <span className="text-[9px] font-black text-cyan-300 uppercase tracking-widest mt-1.5 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]">
              TURN DIRECTION: {gameState.direction === 'clockwise' ? 'CLOCKWISE' : 'COUNTER-CLOCKWISE'}
            </span>
          </div>

          {/* Card Piles Interaction Section (Left: Discard Blue 7 / Top card, Right: Draw Pile) */}
          <div className="flex items-center justify-center gap-6 my-auto z-10 relative">
            {/* Left Discard Pile */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={topCard.id}
                    initial={
                      hasDealt
                        ? {
                            y: 120,
                            x: -40,
                            rotate: -45,
                            opacity: 0,
                            scale: 0.8,
                          }
                        : { scale: 1, opacity: 1, rotate: 0 }
                    }
                    animate={{
                      y: 0,
                      x: 0,
                      rotate: [-12, 4, -4][parseInt(topCard.id.split('-')[1] || '0') % 3] || -4,
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 170,
                      damping: 18,
                    }}
                    className="relative"
                  >
                    <UnoCardUI
                      card={
                        topCard as unknown as { id: string; color: CardColorType; value: string }
                      }
                    />
                  </motion.div>
                </AnimatePresence>

                {gameState.wildColorSelected && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-950 border border-cyan-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase shadow-[0_0_10px_rgba(6,182,212,0.6)] z-10 text-cyan-200"
                  >
                    <span>COLOR: {gameState.wildColorSelected}</span>
                  </motion.div>
                )}
              </div>
              <span className="text-[9px] font-extrabold text-cyan-300 tracking-wider uppercase mt-2">
                Discard Pile
              </span>
            </div>

            {/* Right Draw Stack with Sound Cues [SWOOSH] & [WHOOSH] */}
            <div className="flex flex-col items-center relative">
              {/* Permanent / Animated Sound Text Cues: [SWOOSH] and [WHOOSH] */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none whitespace-nowrap z-20">
                <span className="sound-text-cue text-[10px] tracking-widest">[SWOOSH]</span>
                <span className="sound-text-cue text-[10px] tracking-widest">[WHOOSH]</span>
              </div>

              <motion.button
                onClick={() => {
                  triggerHaptic('light')
                  handleDrawCard()
                }}
                disabled={!isMyTurn || gameState.selectedWildCard !== null}
                whileHover={
                  isMyTurn && gameState.selectedWildCard === null ? { scale: 1.05 } : {}
                }
                whileTap={isMyTurn && gameState.selectedWildCard === null ? { scale: 0.95 } : {}}
                className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 border-cyan-400 bg-slate-900 flex flex-col items-center justify-center relative shadow-[0_0_18px_rgba(6,182,212,0.5)] transition-all ${
                  isMyTurn && gameState.selectedWildCard === null
                    ? 'ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-950 cursor-pointer animate-pulse'
                    : 'opacity-80'
                }`}
              >
                <div className="absolute inset-1.5 bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-900 rounded-lg flex items-center justify-center border border-cyan-300 overflow-hidden">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-cyan-300 flex items-center justify-center font-black text-white italic text-lg sm:text-xl shadow-[0_0_10px_rgba(6,182,212,0.8)] rotate-[-15deg] transform bg-gradient-to-br from-cyan-500 to-blue-700">
                    U
                  </div>
                </div>
                {gameState.activeDrawPenalty > 0 && (
                  <div className="absolute -top-3 -right-3 bg-red-600 border border-red-400 text-white font-extrabold text-xs px-2 py-1 rounded-full shadow-lg animate-bounce">
                    +{gameState.activeDrawPenalty}
                  </div>
                )}
              </motion.button>

              <span className="text-[9px] font-extrabold text-cyan-300 tracking-wider uppercase mt-2">
                Draw Deck
              </span>
            </div>
          </div>

          {/* Turn status prompt banner */}
          <div className="text-center pb-1 z-10">
            {isMyTurn ? (
              gameState.selectedWildCard ? (
                <span className="text-xs font-black text-amber-300 glow-text-yellow">
                  CHOOSE A WILD COLOR BELOW!
                </span>
              ) : (
                <span className="text-xs font-black text-cyan-300 glow-text-cyan">
                  YOUR TURN! PLAY A MATCHING CARD OR DRAW.
                </span>
              )
            ) : (
              <span className="text-xs font-bold text-slate-400">
                AstroBot v2 is thinking...
              </span>
            )}
          </div>
        </div>

        {/* 4. COLOR PICKER OVERLAY MODAL */}
        <AnimatePresence>
          {isWildModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col justify-end z-50"
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-slate-900 border-t-2 border-cyan-400 rounded-t-3xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.5)]"
              >
                <h3 className="text-center font-black text-lg text-cyan-300 mb-2 uppercase tracking-wider glow-text-cyan">
                  SELECT ACTIVE NEON COLOR
                </h3>
                <p className="text-center text-xs text-slate-300 mb-6 max-w-xs mx-auto">
                  Choose the color for the next play turn.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {(['Red', 'Blue', 'Green', 'Yellow'] as CardColor[]).map((col) => (
                    <button
                      key={col}
                      onClick={() => {
                        triggerHaptic('success')
                        handleChooseColor(col)
                      }}
                      className={`py-4 px-2 rounded-2xl text-sm font-black border-2 text-white shadow-xl transition-all hover:scale-105 active:scale-95 ${
                        col === 'Red'
                          ? 'bg-red-600 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.7)]'
                          : col === 'Blue'
                            ? 'bg-blue-600 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.7)]'
                            : col === 'Green'
                              ? 'bg-emerald-600 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.7)]'
                              : 'bg-amber-400 border-amber-200 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.7)]'
                      }`}
                    >
                      {col.toUpperCase()}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. BOTTOM PLAYER PROFILE & FAN HAND PANEL (PixelPilot) */}
        <div className="bg-slate-950/90 border-t-2 border-cyan-500/40 p-3 shrink-0 relative z-20">
          {/* Player Profile & UNO Button Section */}
          <div className="flex items-center justify-between mb-2">
            {/* PixelPilot Player Profile with Rocket Icon */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-cyan-300">
                  <Rocket size={16} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-cyan-300 tracking-wide">
                    PixelPilot
                  </span>
                  <span className="px-1 py-0.2 bg-indigo-950 border border-indigo-400/40 text-[8px] font-bold text-indigo-300 rounded">
                    YOU
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-slate-400">
                  {myPlayer.hand.length} card{myPlayer.hand.length !== 1 ? 's' : ''} in hand
                </span>
              </div>
            </div>

            {/* Rounded Rectangle [UNO!] Button matching Reference Design */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  triggerHaptic('medium')
                  handleSayUno()
                }}
                disabled={myPlayer.hand.length !== 2}
                className={`neon-uno-btn px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg ${
                  myPlayer.hand.length === 2
                    ? 'animate-pulse cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                UNO!
              </button>
              {gameState.unoCalls[myPlayer.id] && (
                <span className="px-2 py-0.5 bg-red-600 border border-red-400 text-[9px] font-black uppercase rounded-lg text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                  YELLED
                </span>
              )}
            </div>
          </div>

          {/* Permanent / Animated Sound Text Cue: [TAP] near player hand */}
          <div className="flex justify-start items-center mb-1 pl-1">
            <span className="sound-text-cue text-[10px] tracking-widest">[TAP]</span>
            <span className="text-[9px] text-slate-400 font-semibold ml-2">
              Tap or drag card upward to play
            </span>
          </div>

          {/* Player's Fanned Hand with glowing color outlines */}
          <div className="flex gap-2 overflow-x-auto py-2 px-1 no-scrollbar min-h-[115px] items-center">
            <AnimatePresence mode="popLayout">
              {myPlayer.hand.map((card, index) => {
                const isValid = isValidPlay(card) && isMyTurn && !gameState.selectedWildCard
                const canPlayPenalty =
                  gameState.activeDrawPenalty > 0 &&
                  ((topCard.value === 'Draw2' && card.value === 'Draw2') ||
                    (topCard.value === 'WildDraw4' && card.value === 'WildDraw4'))

                const isBlockedByPenalty = gameState.activeDrawPenalty > 0 && !canPlayPenalty
                const cardPlayable = isValid && !isBlockedByPenalty

                return (
                  <motion.div
                    key={card.id}
                    layout
                    initial={
                      !hasDealt
                        ? {
                            x: -150 - index * 10,
                            y: -300,
                            rotate: -40,
                            scale: 0.5,
                            opacity: 0,
                          }
                        : { x: 80, y: 0, opacity: 0 }
                    }
                    animate={{
                      x: 0,
                      y: 0,
                      rotate: 0,
                      scale: 1,
                      opacity: 1,
                    }}
                    exit={{
                      scale: 0.6,
                      y: -150,
                      opacity: 0,
                      rotate: 15,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 150,
                      damping: 18,
                      delay: !hasDealt ? index * 0.08 : 0,
                    }}
                    drag={cardPlayable}
                    dragSnapToOrigin
                    dragElastic={0.4}
                    dragConstraints={{ left: 0, right: 0, top: -200, bottom: 50 }}
                    onDragStart={() => {
                      dragActiveRef.current = false
                      soundManager.play('click')
                      triggerHaptic('light')
                    }}
                    onDragEnd={(_, info) => {
                      if (info.offset.y < -80) {
                        dragActiveRef.current = true
                        triggerHaptic('success')
                        handlePlayCard(card.id)
                        setTimeout(() => {
                          dragActiveRef.current = false
                        }, 300)
                      }
                    }}
                    className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                  >
                    <UnoCardUI
                      card={card as unknown as { id: string; color: CardColorType; value: string }}
                      isPlayable={cardPlayable}
                      onClick={() => {
                        if (dragActiveRef.current) {
                          dragActiveRef.current = false
                          return
                        }
                        soundManager.play('click')
                        triggerHaptic('success')
                        handlePlayCard(card.id)
                      }}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {myPlayer.hand.length === 0 && (
              <div className="w-full text-center text-cyan-400 py-6 font-bold text-xs">
                No cards in hand. Match complete!
              </div>
            )}
          </div>
        </div>

        {/* 6. GAME OVER OVERLAY SCREEN */}
        {gameState.status === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(6,182,212,0.8)] mb-4 animate-bounce">
              <Award size={44} />
            </div>

            <h3 className="text-3xl font-black text-center text-cyan-300 tracking-tight uppercase leading-none mb-2 glow-text-cyan">
              {gameState.winnerId === 'player-0' || isPassAndPlay ? 'VICTORY!' : 'DEFEAT!'}
            </h3>
            <p className="text-slate-300 text-xs text-center max-w-xs mb-8 font-semibold">
              {gameState.winnerId === 'player-0' && !isPassAndPlay
                ? 'Fantastic victory! PixelPilot defeated AstroBot v2 in Arena 3.'
                : `Match Over. ${gameState.players.find((p) => p.id === gameState.winnerId)?.name} wins the match!`}
            </p>

            <button
              onClick={() => {
                triggerHaptic('medium')
                handleInitGame()
              }}
              className="w-full max-w-xs py-3.5 px-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:opacity-90 active:scale-95 transition-all text-center uppercase tracking-wider text-sm"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* PASS & PLAY OVERLAY */}
      {showPassOverlay && (
        <div
          ref={modalContainerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pass-play-dialog-title"
          className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 z-40"
        >
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 mb-4 animate-bounce shadow-[0_0_20px_rgba(6,182,212,0.6)]">
            <User size={32} />
          </div>
          <h3
            id="pass-play-dialog-title"
            className="text-2xl font-black text-cyan-300 uppercase tracking-tight mb-2 glow-text-cyan"
          >
            Pass Phone to {activePlayer.name}
          </h3>
          <p className="text-xs text-slate-400 text-center max-w-xs mb-8 font-medium">
            Keep your hand secret! Hand device to {activePlayer.name} before revealing cards.
          </p>
          <button
            ref={confirmButtonRef}
            onClick={() => {
              soundManager.play('click')
              setPassConfirmed(true)
            }}
            className="w-full max-w-xs py-3.5 px-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:opacity-90 active:scale-95 transition-all text-center flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
          >
            Reveal Hand
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
