import { useState, useEffect, useRef } from 'react'
import { Play, Users, Volume2, VolumeX, Sparkles, CheckCircle2, Info, Zap } from 'lucide-react'
import confetti from 'canvas-confetti'
import { UnoEngine, type CardColor, type UnoCard } from './engine/unoEngine'
import { getBotThinkingDelay, type GameMode } from './engine/botAI'
import { Board } from './components/Board'
import { soundManager } from './utils/soundManager'

export default function App() {
  const [selectedMode, setSelectedMode] = useState<GameMode>('VS_BOT')
  const [engine, setEngine] = useState<UnoEngine | null>(null)
  const [gameState, setGameState] = useState<ReturnType<UnoEngine['getState']> | null>(null)
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted())
  const [volume, setVolume] = useState(() => soundManager.getVolume())
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const botTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Preload sound context on first user interaction or mount
    const handleFirstTouch = () => {
      soundManager.init()
    }
    window.addEventListener('pointerdown', handleFirstTouch, { once: true })
    return () => {
      window.removeEventListener('pointerdown', handleFirstTouch)
    }
  }, [])

  const handleQuitMatch = () => {
    soundManager.play('click')
    setEngine(null)
    setGameState(null)
  }

  const handleInitGame = (modeOverride?: GameMode) => {
    soundManager.init()
    soundManager.play('shuffle')
    const mode = modeOverride || selectedMode

    const playersSetup =
      mode === 'VS_BOT'
        ? [
            { name: 'PixelPilot', isBot: false },
            { name: 'AstroBot v2', isBot: true },
          ]
        : [
            { name: 'PixelPilot', isBot: false },
            { name: 'Player 2', isBot: false },
          ]

    const newEngine = new UnoEngine(playersSetup, mode)
    newEngine.startGame()
    setEngine(newEngine)
    setGameState({ ...newEngine.getState() })
  }

  // Trigger win or lose audio & win confetti on game over
  useEffect(() => {
    if (gameState?.status === 'GAME_OVER') {
      const activeWinner = gameState.players.find((p) => p.id === gameState.winnerId)
      if (gameState.mode === 'VS_BOT') {
        if (gameState.winnerId === 'player-0') {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
          })
          soundManager.play('win')
        } else {
          soundManager.play('lose')
        }
      } else {
        // Local pass & play mode win
        if (activeWinner) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
          })
          soundManager.play('win')
        }
      }
    }
  }, [gameState?.status, gameState?.winnerId, gameState?.mode, gameState?.players])

  // Automate bot turn execution inside React useEffect listening to turn transitions in VS Bot mode
  useEffect(() => {
    if (!engine || !gameState || gameState.status !== 'PLAYING') return

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.isBot) {
      if (botTimerRef.current) clearTimeout(botTimerRef.current)
      const thinkingDelay = getBotThinkingDelay(800, 1200)

      botTimerRef.current = setTimeout(() => {
        engine.makeBotDecision()
        const nextState = { ...engine.getState() }
        setGameState(nextState)

        // Play appropriate sounds for bots
        const lastAction = nextState.lastActionDescription
        if (lastAction.includes('UNO')) {
          soundManager.play('uno')
        } else if (lastAction.includes('played')) {
          soundManager.play('place')
        } else if (lastAction.includes('drew')) {
          soundManager.play('draw')
        }
      }, thinkingDelay)
    }

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current)
    }
  }, [engine, gameState, gameState?.currentPlayerIndex, gameState?.status])

  const toggleMute = () => {
    const nextMuted = soundManager.toggleMute()
    setIsMuted(nextMuted)
    if (!nextMuted) {
      soundManager.play('click')
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    soundManager.setVolume(newVolume)
    setVolume(newVolume)
    if (newVolume === 0) {
      soundManager.setMuted(true)
      setIsMuted(true)
    } else if (isMuted && newVolume > 0) {
      soundManager.setMuted(false)
      setIsMuted(false)
    }
  }

  const handlePlayCard = (cardId: string) => {
    if (!engine || !gameState) return
    const activePlayer = gameState.players[gameState.currentPlayerIndex]

    try {
      const card = activePlayer.hand.find((c) => c.id === cardId)
      if (!card) return

      engine.playCard(activePlayer.id, cardId)
      const nextState = { ...engine.getState() }
      setGameState(nextState)
      soundManager.play('place')
    } catch (err: unknown) {
      alert((err as Error).message)
    }
  }

  const handleDrawCard = () => {
    if (!engine || !gameState) return
    const activePlayer = gameState.players[gameState.currentPlayerIndex]

    try {
      engine.drawCard(activePlayer.id)
      setGameState({ ...engine.getState() })
      soundManager.play('draw')
    } catch (err: unknown) {
      alert((err as Error).message)
    }
  }

  const handleSayUno = () => {
    if (!engine || !gameState) return
    const activePlayer = gameState.players[gameState.currentPlayerIndex]
    engine.sayUno(activePlayer.id)
    setGameState({ ...engine.getState() })
    soundManager.play('uno')
  }

  const handleChallenge = (targetPlayerId: string) => {
    if (!engine || !gameState) return
    const activePlayer = gameState.players[gameState.currentPlayerIndex]
    engine.challengeUno(activePlayer.id, targetPlayerId)
    setGameState({ ...engine.getState() })
    soundManager.play('click')
  }

  const handleChooseColor = (color: CardColor) => {
    if (!engine || !gameState) return
    const activePlayer = gameState.players[gameState.currentPlayerIndex]
    try {
      engine.chooseWildColor(activePlayer.id, color)
      setGameState({ ...engine.getState() })
      soundManager.play('click')
    } catch (err: unknown) {
      alert((err as Error).message)
    }
  }

  const isValidPlay = (card: UnoCard) => {
    if (!engine) return false
    return engine.isValidMove(card)
  }

  if (!engine || !gameState) {
    // STARTING / LANDING SCREEN with MODE SWITCHER
    return (
      <div className="mobile-viewport select-none flex flex-col justify-between">
        {/* Top Navbar with Volume Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm italic shadow-[0_0_12px_rgba(6,182,212,0.8)]">
              U
            </div>
            <h1 className="text-lg font-black tracking-tight text-cyan-300 uppercase m-0 leading-none glow-text-cyan">
              UnoDeck Neon
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title="Volume"
              aria-label="Volume"
            />
            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-slate-800 text-cyan-300 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative">
          <div className="relative mb-6">
            {/* Stacked 3D cards visual */}
            <div className="w-24 h-36 bg-red-600 rounded-xl border-2 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.8)] rotate-[-15deg] absolute -left-8 -top-4 flex items-center justify-center font-black text-4xl text-white italic">
              7
            </div>
            <div className="w-24 h-36 bg-blue-600 rounded-xl border-2 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.8)] rotate-[10deg] absolute -right-8 -top-2 flex items-center justify-center font-black text-4xl text-white italic">
              ⇄
            </div>
            <div className="w-24 h-36 bg-purple-700 rounded-xl border-2 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.8)] rotate-[-2deg] flex items-center justify-center font-black text-3xl text-white italic relative z-10">
              <span className="bg-gradient-to-r from-red-400 via-yellow-300 to-cyan-300 bg-clip-text text-transparent">
                +4
              </span>
            </div>
          </div>

          <h2 className="text-3xl font-black text-cyan-300 tracking-tight leading-tight mb-2 uppercase glow-text-cyan">
            Neon Arena Uno
          </h2>
          <p className="text-slate-300 text-xs max-w-xs mb-6 font-semibold">
            Experience hyper-gamified neon UNO with PixelPilot vs AstroBot v2 in Arena 3.
          </p>

          {/* Game Mode Switcher Control */}
          <div className="w-full max-w-xs bg-slate-900/90 border border-cyan-500/40 p-1.5 rounded-2xl flex gap-1 mb-5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <button
              onClick={() => {
                soundManager.play('click')
                setSelectedMode('VS_BOT')
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 uppercase ${
                selectedMode === 'VS_BOT'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Play fill={selectedMode === 'VS_BOT' ? 'black' : 'none'} size={14} />
              VS Bot (AI)
            </button>
            <button
              onClick={() => {
                soundManager.play('click')
                setSelectedMode('LOCAL_PASS_PLAY')
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 uppercase ${
                selectedMode === 'LOCAL_PASS_PLAY'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users size={14} />
              Pass & Play
            </button>
          </div>

          <button
            onClick={() => handleInitGame(selectedMode)}
            className="w-full max-w-xs py-4 px-8 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:opacity-95 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 text-base uppercase tracking-wider"
          >
            {selectedMode === 'VS_BOT' ? (
              <>
                <Play fill="white" size={20} />
                Enter Arena 3 Match
              </>
            ) : (
              <>
                <Users size={20} />
                Start Pass & Play
              </>
            )}
          </button>
        </div>

        {/* Bottom Specs Info */}
        <div className="px-6 py-5 border-t border-cyan-500/30 bg-slate-950 text-center flex flex-col items-center gap-2">
          <div className="flex gap-4 text-xs text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-cyan-400" />
              React 19
            </span>
            <span className="flex items-center gap-1">
              <Zap size={12} className="text-purple-400" />
              Web Audio API
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-400" />
              Vitest Certified
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold">
            Hyper-Gamified Mobile-First Uno UI
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <Board
        gameState={gameState}
        handleQuitMatch={handleQuitMatch}
        isMuted={isMuted}
        volume={volume}
        handleVolumeChange={handleVolumeChange}
        toggleMute={toggleMute}
        ruleModalOpen={ruleModalOpen}
        setRuleModalOpen={setRuleModalOpen}
        handlePlayCard={handlePlayCard}
        handleDrawCard={handleDrawCard}
        handleSayUno={handleSayUno}
        handleChallenge={handleChallenge}
        handleChooseColor={handleChooseColor}
        handleInitGame={() => handleInitGame(gameState.mode)}
        isValidPlay={isValidPlay}
      />

      {/* Instructions / Rules Modal */}
      {ruleModalOpen && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-6 z-50">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-2 mb-4">
              <Info size={24} className="text-cyan-400" />
              <h3 className="text-xl font-black text-cyan-300 tracking-tight leading-none uppercase glow-text-cyan">
                Uno Rules & Manual
              </h3>
            </div>

            <div className="space-y-4 text-xs text-slate-300 font-medium">
              <div>
                <h4 className="font-extrabold text-cyan-300 uppercase text-[10px] tracking-wider mb-1">
                  Classic Play Rules
                </h4>
                <p>
                  Match card colors or numbers to play. Choose Red, Blue, Green, or Yellow colors
                  using wild cards.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-cyan-300 uppercase text-[10px] tracking-wider mb-1">
                  Card Stacking Penalty
                </h4>
                <p>
                  You can stack multiple Draw 2 or Wild Draw 4 cards directly on each other to
                  increase the penalty! If a Draw 2 is played on you, you can play your own Draw 2
                  to pass a total of 4 cards to the next player.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-cyan-300 uppercase text-[10px] tracking-wider mb-1">
                  Calling UNO
                </h4>
                <p>
                  Yell UNO when you have exactly 2 cards in hand and are about to play one. If you
                  have only 1 card left and have not yelled UNO, other players can challenge you to
                  make you draw 2 penalty cards!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.play('click')
              setRuleModalOpen(false)
            }}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-xl text-center text-xs transition-colors mt-4 uppercase tracking-wider"
          >
            Back to Match
          </button>
        </div>
      )}
    </div>
  )
}
