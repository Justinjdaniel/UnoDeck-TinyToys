import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Bot, User, Award, Volume2, VolumeX, Info, ArrowRight } from 'lucide-react'
import { UnoCardUI, type CardColorType } from './UnoCardUI'
import { type UnoGameState, type UnoCard, type CardColor, type Player } from '../engine/unoEngine'
import { soundManager } from '../utils/soundManager'

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

// Reusable OpponentPanel component
interface OpponentPanelProps {
  player: Player
  avatarColor: string
  isActive: boolean
  isUnoCalled: boolean
  onChallenge: (playerId: string) => void
  className?: string
  layoutType?: 'row' | 'col'
}

const OpponentPanel: React.FC<OpponentPanelProps> = ({
  player,
  avatarColor,
  isActive,
  isUnoCalled,
  onChallenge,
  className = '',
  layoutType = 'col',
}) => {
  const containerClasses = `flex rounded-2xl border transition-all duration-300 p-2.5 items-center ${
    isActive
      ? 'bg-amber-500/20 border-amber-500 shadow-lg scale-105 ring-2 ring-amber-500/30'
      : 'bg-slate-900/60 border-slate-800'
  } ${className} ${layoutType === 'col' ? 'flex-col' : 'gap-2.5'}`

  return (
    <div className={containerClasses}>
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow`}
      >
        {player.isBot ? <Bot size={14} /> : <User size={14} />}
      </div>
      <div className={layoutType === 'col' ? 'text-center' : ''}>
        <div className="flex items-center gap-1 justify-center">
          <span className="text-[10px] sm:text-xs font-bold max-w-[65px] truncate">
            {player.name}
          </span>
          {isUnoCalled && (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-1 py-0.5 bg-red-600 text-[8px] font-black tracking-tighter uppercase rounded text-white animate-pulse"
            >
              UNO!
            </motion.span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-1 justify-center mt-0.5">
          <span className="text-[10px] text-slate-400 font-semibold">
            {player.hand.length} card{player.hand.length !== 1 ? 's' : ''}
          </span>
          {player.hand.length === 1 && !isUnoCalled && (
            <button
              onClick={() => {
                triggerHaptic('medium')
                onChallenge(player.id)
              }}
              className="px-1.5 py-0.5 bg-red-500/20 hover:bg-red-500 border border-red-500 text-[8px] font-bold uppercase rounded text-red-200 hover:text-white transition-all sm:ml-1.5 animate-bounce mt-1 sm:mt-0"
            >
              Challenge
            </button>
          )}
        </div>
      </div>
    </div>
  )
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

  // In pass and play, active player is activePlayer; in VS_BOT, "myPlayer" is always player-0
  const myPlayer = isPassAndPlay
    ? activePlayer
    : gameState.players.find((p) => p.id === 'player-0') || gameState.players[0]

  const opponentPlayers = gameState.players.filter((p) => p.id !== myPlayer.id)

  const topOpponent = opponentPlayers[1] || opponentPlayers[0]
  const leftOpponent = opponentPlayers[0]
  const rightOpponent = opponentPlayers[2] || opponentPlayers[1] || opponentPlayers[0]

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

  useEffect(() => {
    if (isPassAndPlay && gameState.currentPlayerIndex !== lastTurnIndexRef.current) {
      setPassConfirmed(false)
      lastTurnIndexRef.current = gameState.currentPlayerIndex
    }
  }, [gameState.currentPlayerIndex, isPassAndPlay])

  // Derive hasDealt during render or update via timer callback
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
        <p className="text-sm font-semibold text-slate-400 mb-4">Setting up game board...</p>
        <button
          onClick={handleInitGame}
          className="py-2.5 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors"
        >
          Initialize Match
        </button>
      </div>
    )
  }

  if (!topCard) {
    return (
      <div className="mobile-viewport flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
        <p className="text-sm font-semibold text-slate-400 mb-4">No cards in discard pile.</p>
        <button
          onClick={handleInitGame}
          className="py-2.5 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors"
        >
          Restart Match
        </button>
      </div>
    )
  }

  return (
    <div className="mobile-viewport select-none flex flex-col justify-between bg-slate-950 text-white overflow-hidden relative">
      {/* 1. Header Navbar with Global Mute / Volume Control */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0 z-20">
        <button
          onClick={() => {
            if (handleQuitMatch) {
              handleQuitMatch()
            } else {
              window.location.reload()
            }
          }}
          className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
        >
          Quit Match
        </button>

        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {isPassAndPlay ? 'Pass & Play' : 'VS Bot'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-14 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            title="Volume"
            aria-label="Volume"
          />
          <button
            onClick={() => {
              soundManager.play('click')
              setRuleModalOpen(!ruleModalOpen)
            }}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Rules"
          >
            <Info size={18} />
          </button>
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* 2. Top Opponent */}
      <div className="flex justify-center py-2 bg-slate-900/30 border-b border-slate-900/80 shrink-0 relative z-20">
        {topOpponent && (
          <OpponentPanel
            player={topOpponent}
            avatarColor="bg-indigo-600"
            isActive={gameState.currentPlayerIndex === gameState.players.indexOf(topOpponent)}
            isUnoCalled={!!gameState.unoCalls[topOpponent.id]}
            onChallenge={handleChallenge}
            layoutType="row"
          />
        )}

        {/* Direction Indicator Widget */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-md">
          <motion.div
            animate={{
              rotate: gameState.direction === 'clockwise' ? 360 : -360,
            }}
            transition={{
              repeat: Infinity,
              ease: 'linear',
              duration: 6,
            }}
          >
            <RotateCcw size={11} className="text-emerald-400" />
          </motion.div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            {gameState.direction === 'clockwise' ? 'Clockwise' : 'Counter'}
          </span>
        </div>
      </div>

      {/* 3. Center Board Area */}
      <div className="flex-1 flex flex-col justify-between p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Left Opponent */}
        {leftOpponent && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
            <OpponentPanel
              player={leftOpponent}
              avatarColor="bg-emerald-600"
              isActive={gameState.currentPlayerIndex === gameState.players.indexOf(leftOpponent)}
              isUnoCalled={!!gameState.unoCalls[leftOpponent.id]}
              onChallenge={handleChallenge}
              layoutType="col"
            />
          </div>
        )}

        {/* Right Opponent */}
        {rightOpponent && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
            <OpponentPanel
              player={rightOpponent}
              avatarColor="bg-purple-600"
              isActive={gameState.currentPlayerIndex === gameState.players.indexOf(rightOpponent)}
              isUnoCalled={!!gameState.unoCalls[rightOpponent.id]}
              onChallenge={handleChallenge}
              layoutType="col"
            />
          </div>
        )}

        {/* Action Log Announcement Banner */}
        <div className="text-center px-8 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-full text-[10px] text-slate-300 font-semibold shadow-inner max-w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            <span className="truncate">{gameState.lastActionDescription}</span>
          </div>
        </div>

        {/* Card Piles Interaction Section */}
        <div className="flex items-center justify-center gap-8 my-auto z-10">
          {/* Draw Pile with Sound Trigger on Tap */}
          <motion.button
            onClick={() => {
              triggerHaptic('light')
              handleDrawCard()
            }}
            disabled={!isMyTurn || gameState.selectedWildCard !== null}
            whileHover={isMyTurn && gameState.selectedWildCard === null ? { scale: 1.05 } : {}}
            whileTap={isMyTurn && gameState.selectedWildCard === null ? { scale: 0.95 } : {}}
            className={`w-20 h-28 rounded-xl border-4 border-slate-800 bg-slate-900 flex flex-col items-center justify-center relative shadow-2xl transition-all ${
              isMyTurn && gameState.selectedWildCard === null
                ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-950 cursor-pointer'
                : 'opacity-80'
            }`}
          >
            <div className="absolute inset-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center border border-red-500 overflow-hidden">
              <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center font-black text-white italic text-lg shadow-lg rotate-[-15deg] transform">
                U
              </div>
            </div>
            {gameState.activeDrawPenalty > 0 && (
              <div className="absolute -top-3 -right-3 bg-red-600 border border-red-400 text-white font-extrabold text-xs px-2 py-1 rounded-full shadow-lg animate-bounce">
                +{gameState.activeDrawPenalty}
              </div>
            )}
          </motion.button>

          {/* Discard Pile */}
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
                  rotate: [-15, 5, -5][parseInt(topCard.id.split('-')[1]) % 3] || -4,
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 160,
                  damping: 18,
                }}
                className="relative"
              >
                <UnoCardUI
                  card={topCard as unknown as { id: string; color: CardColorType; value: string }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Chosen wild color label indicator */}
            {gameState.wildColorSelected && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shadow-md z-10"
              >
                <span
                  className={`w-2 h-2 rounded-full border border-white/20 ${
                    gameState.wildColorSelected === 'Red'
                      ? 'bg-red-500 shadow-red-500/20'
                      : gameState.wildColorSelected === 'Blue'
                        ? 'bg-blue-500 shadow-blue-500/20'
                        : gameState.wildColorSelected === 'Green'
                          ? 'bg-emerald-500 shadow-emerald-500/20'
                          : 'bg-amber-400 text-slate-900 shadow-amber-400/20'
                  }`}
                ></span>
                <span>{gameState.wildColorSelected}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Action helper text banner */}
        <div className="text-center pb-2 z-10">
          {isMyTurn ? (
            gameState.selectedWildCard ? (
              <span className="text-xs font-bold text-amber-400">Choose a wild color below!</span>
            ) : (
              <span className="text-xs font-bold text-emerald-400">
                {isPassAndPlay ? `${activePlayer.name}'s turn!` : 'Your turn!'} Play a matching card
                or draw.
              </span>
            )
          ) : (
            <span className="text-xs font-medium text-slate-500">
              Wait for opponents to make a move...
            </span>
          )}
        </div>
      </div>

      {/* 4. Color Picker Modal overlay */}
      <AnimatePresence>
        {isWildModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end z-50"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 shadow-2xl"
            >
              <h3 className="text-center font-black text-lg text-white mb-4 uppercase tracking-wider">
                Select Active Color
              </h3>
              <p className="text-center text-xs text-slate-400 mb-6 max-w-xs mx-auto">
                Make your selection. High contrast buttons guarantee clear selection.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(['Red', 'Blue', 'Green', 'Yellow'] as CardColor[]).map((col) => (
                  <button
                    key={col}
                    onClick={() => {
                      triggerHaptic('success')
                      handleChooseColor(col)
                    }}
                    className={`py-4 px-2 rounded-2xl text-sm font-black border-2 border-slate-700 text-white shadow-xl transition-all hover:scale-105 active:scale-95 ${
                      col === 'Red'
                        ? 'bg-red-500 hover:bg-red-600 border-red-400'
                        : col === 'Blue'
                          ? 'bg-blue-500 hover:bg-blue-600 border-blue-400'
                          : col === 'Green'
                            ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-400'
                            : 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-300'
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

      {/* 5. Pass & Play Interstitial Hand Overlay */}
      {isPassAndPlay && !passConfirmed && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 z-40">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
            <User size={32} />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
            Pass Phone to {activePlayer.name}
          </h3>
          <p className="text-xs text-slate-400 text-center max-w-xs mb-8">
            Keep your hand secret! Hand device to {activePlayer.name} before revealing cards.
          </p>
          <button
            onClick={() => {
              soundManager.play('click')
              setPassConfirmed(true)
            }}
            className="w-full max-w-xs py-3.5 px-6 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 text-white font-bold rounded-2xl shadow-xl hover:opacity-90 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
          >
            I am {activePlayer.name} - Reveal Hand
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* 6. Player Controls & Hand Panel */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 shrink-0 relative z-20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">
              <User size={12} />
            </div>
            <span className="text-xs font-bold text-slate-200">
              {isPassAndPlay ? `${myPlayer.name}'s Hand` : 'Your Hand'}
            </span>
            <span className="text-[10px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 font-extrabold">
              {myPlayer.hand.length} cards
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('medium')
                handleSayUno()
              }}
              disabled={myPlayer.hand.length !== 2}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                myPlayer.hand.length === 2
                  ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white animate-pulse shadow-md shadow-red-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Yell UNO!
            </button>
            {gameState.unoCalls[myPlayer.id] && (
              <span className="px-2 py-0.5 bg-red-600 border border-red-500 text-[9px] font-black uppercase rounded text-white animate-pulse shadow-md shadow-red-500/30">
                Yelled
              </span>
            )}
          </div>
        </div>

        {/* Scrollable hand with Deal, Selection, and Drag-and-Play animation */}
        <div className="flex gap-2.5 overflow-x-auto py-2 px-1 no-scrollbar min-h-[120px] scroll-smooth items-center">
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
                      : { x: 100, y: 0, opacity: 0 }
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
                    stiffness: 140,
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
            <div className="w-full text-center text-slate-500 py-6 font-medium text-xs">
              No cards in hand. Play is complete.
            </div>
          )}
        </div>
      </div>

      {/* 7. Game Over Overlay Screen */}
      {gameState.status === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 z-50 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-2xl mb-4 transform scale-110 animate-bounce">
            <Award size={44} />
          </div>

          <h3 className="text-3xl font-black text-center text-white tracking-tight uppercase leading-none mb-1">
            {gameState.winnerId === 'player-0' || isPassAndPlay ? 'Victory!' : 'Defeat!'}
          </h3>
          <p className="text-slate-400 text-sm text-center max-w-xs mb-8">
            {gameState.winnerId === 'player-0' && !isPassAndPlay
              ? 'Incredible! You defeated the AI Bots in this match.'
              : `Match Over. ${gameState.players.find((p) => p.id === gameState.winnerId)?.name} wins the match!`}
          </p>

          <button
            onClick={() => {
              triggerHaptic('medium')
              handleInitGame()
            }}
            className="w-full max-w-xs py-3.5 px-6 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 text-white font-bold rounded-2xl shadow-xl hover:opacity-90 transform active:scale-95 transition-all text-center"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}
