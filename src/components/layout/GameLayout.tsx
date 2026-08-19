import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, LogOut, RotateCcw, Bot, User, ShieldAlert, Zap } from 'lucide-react'
import { type UnoGameState, type UnoCard, type CardColor } from '../../engine/unoEngine'
import { UnoCardUI, type CardColorType } from '../cards/UnoCardUI'
import { SettingsModal } from '../modals/SettingsModal'
import { WildColorModal } from '../modals/WildColorModal'
import { soundManager } from '../../utils/soundManager'

interface GameLayoutProps {
  gameState: UnoGameState
  isMuted: boolean
  volume: number
  handleVolumeChange: (volume: number) => void
  toggleMute: () => void
  handlePlayCard: (cardId: string) => void
  handleDrawCard: () => void
  handleSayUno: () => void
  handleChallenge: (targetPlayerId: string) => void
  handleChooseColor: (color: CardColor) => void
  handleInitGame: () => void
  isValidPlay: (card: UnoCard) => boolean
  handleQuitMatch: () => void
}

export const GameLayout: React.FC<GameLayoutProps> = ({
  gameState,
  isMuted,
  volume,
  handleVolumeChange,
  toggleMute,
  handlePlayCard,
  handleDrawCard,
  handleSayUno,
  handleChallenge,
  handleChooseColor,
  handleInitGame,
  isValidPlay,
  handleQuitMatch,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false)
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

  const [passConfirmed, setPassConfirmed] = useState(false)
  const lastTurnIndexRef = useRef(gameState.currentPlayerIndex)
  const showPassOverlay = isPassAndPlay && !passConfirmed

  useEffect(() => {
    if (isPassAndPlay && gameState.currentPlayerIndex !== lastTurnIndexRef.current) {
      setPassConfirmed(false)
      lastTurnIndexRef.current = gameState.currentPlayerIndex
    }
  }, [gameState.currentPlayerIndex, isPassAndPlay])

  if (!myPlayer || !topCard) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
        <p className="text-sm font-semibold text-cyan-400 mb-4 animate-pulse">
          Initializing Game Table...
        </p>
        <button
          onClick={handleInitGame}
          className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-[0_0_15px_rgba(6,182,212,0.8)] uppercase"
        >
          Initialize Match
        </button>
      </div>
    )
  }

  return (
    <div className="w-full h-[100dvh] overflow-hidden flex flex-col justify-between p-2 select-none bg-slate-950 dark:bg-slate-950 light:bg-slate-200 text-slate-100 transition-colors relative">
      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isMuted={isMuted}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
      />

      {/* Wild Color Selection Modal */}
      <WildColorModal isOpen={isWildModalOpen} onChooseColor={handleChooseColor} />

      {/* TOP ZONE: Opponent Info & Action Bar */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100/90 border border-cyan-500/30 rounded-2xl shrink-0 shadow-lg z-20">
        {/* Opponent Avatar & Card Count */}
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 p-0.5 shadow-[0_0_12px_rgba(99,102,241,0.8)] ${
              gameState.currentPlayerIndex === gameState.players.indexOf(botPlayer)
                ? 'ring-2 ring-cyan-400 animate-pulse'
                : ''
            }`}
          >
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-cyan-300">
              {botPlayer.isBot ? <Bot size={18} /> : <User size={18} />}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-cyan-300 dark:text-cyan-300 light:text-cyan-800 tracking-wide">
                {botPlayer.name}
              </span>
              {botPlayer.isBot && (
                <span className="px-1 py-0.5 bg-cyan-950 border border-cyan-500/40 text-[8px] font-bold text-cyan-400 rounded">
                  AI
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {botPlayer.hand.length} card{botPlayer.hand.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Status Indicators / UNO Challenge */}
        <div className="flex items-center gap-2">
          {gameState.unoCalls[botPlayer.id] && (
            <span className="px-2 py-0.5 bg-red-600 text-[9px] font-black tracking-wider uppercase rounded text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]">
              UNO!
            </span>
          )}

          {botPlayer.hand.length === 1 && !gameState.unoCalls[botPlayer.id] && (
            <button
              onClick={() => {
                soundManager.play('click')
                handleChallenge(botPlayer.id)
              }}
              className="flex items-center gap-1 px-2 py-1 bg-red-600/30 hover:bg-red-600 border border-red-500 rounded text-[9px] font-extrabold uppercase text-red-200 transition-all animate-bounce"
              title="Challenge UNO"
            >
              <ShieldAlert size={12} />
              Challenge
            </button>
          )}

          {/* Icon Controls (Settings & Exit) */}
          <button
            onClick={() => {
              soundManager.play('click')
              setSettingsOpen(true)
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-400 hover:text-white transition-all border border-cyan-500/30"
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={() => {
              soundManager.play('click')
              handleQuitMatch()
            }}
            className="p-2 rounded-xl bg-red-900/40 hover:bg-red-700 text-red-300 hover:text-white transition-all border border-red-500/40"
            title="Exit Match"
            aria-label="Exit Match"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* CENTER ZONE: Dynamic Card Piles & Direction Indicator */}
      <div className="flex-1 flex flex-col justify-between items-center py-2 relative z-10">
        {/* Action Log / Toast */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-100 border border-cyan-500/40 rounded-full text-[10px] text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)] max-w-full">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="truncate">{gameState.lastActionDescription}</span>
        </div>

        {/* Turn Direction Circle */}
        <div className="flex flex-col items-center justify-center my-1">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-400/60 bg-slate-900/80 flex items-center justify-center relative shadow-[0_0_15px_rgba(6,182,212,0.6)]">
            <motion.div
              animate={{
                rotate: gameState.direction === 'clockwise' ? 360 : -360,
              }}
              transition={{
                repeat: Infinity,
                ease: 'linear',
                duration: 6,
              }}
              className="text-cyan-300"
            >
              <RotateCcw size={22} />
            </motion.div>
          </div>
        </div>

        {/* Card Piles (Discard & Draw Stack) */}
        <div className="flex items-center justify-center gap-6 my-auto">
          {/* Discard Pile */}
          <div className="flex flex-col items-center">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={topCard.id}
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 18 }}
              >
                <UnoCardUI
                  card={topCard as unknown as { id: string; color: CardColorType; value: string }}
                />
              </motion.div>
            </AnimatePresence>
            {gameState.wildColorSelected && (
              <span className="mt-1 px-2 py-0.5 bg-slate-900 border border-cyan-400 rounded text-[9px] font-black uppercase text-cyan-300">
                {gameState.wildColorSelected}
              </span>
            )}
            <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-wider mt-1">
              Discard
            </span>
          </div>

          {/* Draw Deck */}
          <div className="flex flex-col items-center">
            <motion.button
              onClick={() => {
                soundManager.play('draw')
                handleDrawCard()
              }}
              disabled={!isMyTurn || gameState.selectedWildCard !== null}
              whileHover={isMyTurn ? { scale: 1.05 } : {}}
              whileTap={isMyTurn ? { scale: 0.95 } : {}}
              className={`w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-xl border-2 border-cyan-400 bg-slate-900 flex flex-col items-center justify-center relative shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all ${
                isMyTurn && !gameState.selectedWildCard
                  ? 'ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-950 cursor-pointer animate-pulse'
                  : 'opacity-80'
              }`}
            >
              <div className="absolute inset-1 bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-900 rounded-lg flex items-center justify-center border border-cyan-300 overflow-hidden">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-cyan-300 flex items-center justify-center font-black text-white italic text-base sm:text-lg shadow-[0_0_10px_rgba(6,182,212,0.8)] rotate-[-15deg] transform bg-gradient-to-br from-cyan-500 to-blue-700">
                  U
                </div>
              </div>
              {gameState.activeDrawPenalty > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-600 border border-red-400 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-lg animate-bounce">
                  +{gameState.activeDrawPenalty}
                </div>
              )}
            </motion.button>
            <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-wider mt-1">
              Draw Deck
            </span>
          </div>
        </div>

        {/* Turn Prompt Banner */}
        <div className="text-center">
          {isMyTurn ? (
            <span className="text-xs font-black text-cyan-300 glow-text-cyan animate-pulse">
              YOUR TURN! PLAY MATCHING CARD OR DRAW.
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-400">
              {activePlayer.name} is playing...
            </span>
          )}
        </div>
      </div>

      {/* BOTTOM ZONE: Player Profile, UNO Button & Hand Fan */}
      <div className="bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-100/90 border border-cyan-500/40 rounded-2xl p-2 shrink-0 z-20 shadow-xl">
        <div className="flex items-center justify-between mb-2 px-1">
          {/* Player Badge */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-[0_0_10px_rgba(6,182,212,0.8)]">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-cyan-300">
                <User size={16} />
              </div>
            </div>
            <div>
              <span className="text-xs font-black text-cyan-300 dark:text-cyan-300 light:text-cyan-800">
                {myPlayer.name}
              </span>
              <span className="text-[10px] block font-extrabold text-slate-400">
                {myPlayer.hand.length} card{myPlayer.hand.length !== 1 ? 's' : ''} in hand
              </span>
            </div>
          </div>

          {/* UNO Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.play('uno')
                handleSayUno()
              }}
              disabled={myPlayer.hand.length !== 2}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg bg-gradient-to-r from-red-500 to-amber-500 border border-amber-300 ${
                myPlayer.hand.length === 2
                  ? 'animate-pulse cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              UNO!
            </button>
            {gameState.unoCalls[myPlayer.id] && (
              <span className="px-2 py-0.5 bg-red-600 border border-red-400 text-[9px] font-black uppercase rounded text-white animate-pulse">
                YELLED
              </span>
            )}
          </div>
        </div>

        {/* Player's Card Fan */}
        <div className="flex gap-1.5 overflow-x-auto py-1 px-1 no-scrollbar min-h-[100px] items-center justify-start sm:justify-center">
          <AnimatePresence mode="popLayout">
            {myPlayer.hand.map((card) => {
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
                  initial={{ scale: 0.8, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.6, y: -100, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 18 }}
                  drag={cardPlayable}
                  dragSnapToOrigin
                  dragElastic={0.4}
                  dragConstraints={{ left: 0, right: 0, top: -150, bottom: 30 }}
                  onDragStart={() => {
                    dragActiveRef.current = false
                  }}
                  onDragEnd={(_, info) => {
                    if (info.offset.y < -60) {
                      dragActiveRef.current = true
                      soundManager.play('place')
                      handlePlayCard(card.id)
                      setTimeout(() => {
                        dragActiveRef.current = false
                      }, 300)
                    }
                  }}
                  className="shrink-0 cursor-grab active:cursor-grabbing"
                >
                  <UnoCardUI
                    card={card as unknown as { id: string; color: CardColorType; value: string }}
                    isPlayable={cardPlayable}
                    onClick={() => {
                      if (dragActiveRef.current) {
                        dragActiveRef.current = false
                        return
                      }
                      soundManager.play('place')
                      handlePlayCard(card.id)
                    }}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* PASS & PLAY OVERLAY */}
      {showPassOverlay && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6"
        >
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 mb-4 animate-bounce">
            <User size={32} />
          </div>
          <h3 className="text-xl font-black text-cyan-300 uppercase tracking-tight mb-2">
            Pass Device to {activePlayer.name}
          </h3>
          <p className="text-xs text-slate-400 text-center max-w-xs mb-8">
            Keep your hand secret! Pass device before revealing.
          </p>
          <button
            onClick={() => {
              soundManager.play('click')
              setPassConfirmed(true)
            }}
            className="w-full max-w-xs py-3.5 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-2xl shadow-lg text-center text-sm uppercase tracking-wider"
          >
            Reveal Hand
          </button>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState.status === 'GAME_OVER' && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center text-white mb-4 animate-bounce shadow-[0_0_25px_rgba(6,182,212,0.8)]">
            <Zap size={36} />
          </div>
          <h3 className="text-2xl font-black text-cyan-300 uppercase mb-2 glow-text-cyan">
            {gameState.winnerId === 'player-0' || isPassAndPlay ? 'VICTORY!' : 'MATCH OVER!'}
          </h3>
          <p className="text-xs text-slate-300 max-w-xs mb-6">
            {gameState.players.find((p) => p.id === gameState.winnerId)?.name} wins the match!
          </p>
          <button
            onClick={() => {
              soundManager.play('click')
              handleInitGame()
            }}
            className="w-full max-w-xs py-3.5 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-2xl shadow-[0_0_18px_rgba(6,182,212,0.8)] transition-all uppercase tracking-wider text-xs"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}
