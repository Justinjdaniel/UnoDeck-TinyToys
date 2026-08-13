import { useState, useEffect, useRef } from 'react'
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  User,
  Bot,
  Sparkles,
  Award,
  Zap,
  CheckCircle2,
  Info,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { UnoEngine, type CardColor } from './engine/unoEngine'

// Sound FX Helpers using simple Web Audio API synthesis (No external assets required!)
class SoundFX {
  private ctx: AudioContext | null = null
  private muted: boolean = false

  constructor() {
    // Lazy initialized
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )()
    }
  }

  public setMute(muted: boolean) {
    this.muted = muted
  }

  public isMuted() {
    return this.muted
  }

  public playCardSound() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(300, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.15)

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.15)
    } catch {
      // Ignored
    }
  }

  public playDrawSound() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(200, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.1)

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.1)
    } catch {
      // Ignored
    }
  }

  public playSpecialSound() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc1.type = 'sawtooth'
      osc1.frequency.setValueAtTime(440, this.ctx.currentTime)
      osc1.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.25)

      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(330, this.ctx.currentTime)
      osc2.frequency.linearRampToValueAtTime(660, this.ctx.currentTime + 0.25)

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(this.ctx.destination)

      osc1.start()
      osc2.start()
      osc1.stop(this.ctx.currentTime + 0.25)
      osc2.stop(this.ctx.currentTime + 0.25)
    } catch {
      // Ignored
    }
  }

  public playUnoSound() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(300, this.ctx.currentTime)
      osc.frequency.setValueAtTime(600, this.ctx.currentTime + 0.08)
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime + 0.16)

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.35)
    } catch {
      // Ignored
    }
  }

  public playWinSound() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(523.25, this.ctx.currentTime) // C5
      osc1.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1) // E5
      osc1.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2) // G5
      osc1.frequency.setValueAtTime(1046.5, this.ctx.currentTime + 0.3) // C6

      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(261.63, this.ctx.currentTime) // C4
      osc2.frequency.setValueAtTime(329.63, this.ctx.currentTime + 0.1) // E4
      osc2.frequency.setValueAtTime(392.0, this.ctx.currentTime + 0.2) // G4
      osc2.frequency.setValueAtTime(523.25, this.ctx.currentTime + 0.3) // C5

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(this.ctx.destination)

      osc1.start()
      osc2.start()
      osc1.stop(this.ctx.currentTime + 0.6)
      osc2.stop(this.ctx.currentTime + 0.6)
    } catch {
      // Ignored
    }
  }
}

const sfx = new SoundFX()

export default function App() {
  const [engine, setEngine] = useState<UnoEngine | null>(null)
  const [gameState, setGameState] = useState<ReturnType<UnoEngine['getState']> | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const botTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize standard mobile game with User vs 3 Bots
  const handleInitGame = () => {
    const newEngine = new UnoEngine([
      { name: 'You', isBot: false },
      { name: 'Slick Bot', isBot: true },
      { name: 'Chippy Bot', isBot: true },
      { name: 'Smarty Bot', isBot: true },
    ])
    newEngine.startGame()
    setEngine(newEngine)
    setGameState({ ...newEngine.getState() })
    sfx.playSpecialSound()
  }

  // Trigger win confetti
  useEffect(() => {
    if (gameState?.status === 'GAME_OVER' && gameState.winnerId === 'player-0') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      })
      sfx.playWinSound()
    }
  }, [gameState?.status, gameState?.winnerId])

  // Bot play logic interval
  useEffect(() => {
    if (!engine || !gameState || gameState.status !== 'PLAYING') return

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.isBot) {
      if (botTimerRef.current) clearTimeout(botTimerRef.current)
      botTimerRef.current = setTimeout(() => {
        engine.makeBotDecision()
        const nextState = { ...engine.getState() }
        setGameState(nextState)

        // Play appropriate sounds for bots
        const lastAction = nextState.lastActionDescription
        if (lastAction.includes('played')) {
          const isSpecial =
            lastAction.includes('Skip') ||
            lastAction.includes('Reverse') ||
            lastAction.includes('Draw') ||
            lastAction.includes('Wild')
          if (isSpecial) sfx.playSpecialSound()
          else sfx.playCardSound()
        } else if (lastAction.includes('drew')) {
          sfx.playDrawSound()
        } else if (lastAction.includes('UNO')) {
          sfx.playUnoSound()
        }
      }, 1500)
    }

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current)
    }
  }, [engine, gameState, gameState?.currentPlayerIndex, gameState?.status])

  const toggleMute = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    sfx.setMute(nextMuted)
  }

  const handlePlayCard = (cardId: string) => {
    if (!engine || !gameState) return
    const activePlayer = gameState.players[gameState.currentPlayerIndex]
    if (activePlayer.id !== 'player-0') return

    try {
      const card = activePlayer.hand.find((c) => c.id === cardId)
      if (!card) return

      engine.playCard('player-0', cardId)
      const nextState = { ...engine.getState() }
      setGameState(nextState)

      const isSpecial =
        card.color === 'Wild' ||
        card.value === 'Skip' ||
        card.value === 'Reverse' ||
        card.value === 'Draw2'
      if (isSpecial) {
        sfx.playSpecialSound()
      } else {
        sfx.playCardSound()
      }
    } catch (err: unknown) {
      alert((err as Error).message)
    }
  }

  const handleDrawCard = () => {
    if (!engine || !gameState) return
    const activePlayer = gameState.players[gameState.currentPlayerIndex]
    if (activePlayer.id !== 'player-0') return

    try {
      engine.drawCard('player-0')
      setGameState({ ...engine.getState() })
      sfx.playDrawSound()
    } catch (err: unknown) {
      alert((err as Error).message)
    }
  }

  const handleSayUno = () => {
    if (!engine || !gameState) return
    engine.sayUno('player-0')
    setGameState({ ...engine.getState() })
    sfx.playUnoSound()
  }

  const handleChallenge = (targetPlayerId: string) => {
    if (!engine || !gameState) return
    engine.challengeUno('player-0', targetPlayerId)
    setGameState({ ...engine.getState() })
    sfx.playSpecialSound()
  }

  const handleChooseColor = (color: CardColor) => {
    if (!engine || !gameState) return
    try {
      engine.chooseWildColor('player-0', color)
      setGameState({ ...engine.getState() })
      sfx.playSpecialSound()
    } catch (err: unknown) {
      alert((err as Error).message)
    }
  }

  // Card background and theme mapping helper
  const getCardStyle = (color: CardColor) => {
    switch (color) {
      case 'Red':
        return 'bg-gradient-to-br from-red-500 to-red-600 border-red-400 text-white shadow-red-500/20'
      case 'Blue':
        return 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white shadow-blue-500/20'
      case 'Green':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 text-white shadow-emerald-500/20'
      case 'Yellow':
        return 'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-300 text-slate-900 shadow-amber-500/20'
      case 'Wild':
        return 'bg-gradient-to-br from-slate-800 to-slate-950 border-slate-700 text-white shadow-slate-950/40'
    }
  }

  const getWildLabelStyle = (color: CardColor) => {
    switch (color) {
      case 'Red':
        return 'bg-red-500 border-red-300 shadow-red-500/20'
      case 'Blue':
        return 'bg-blue-500 border-blue-300 shadow-blue-500/20'
      case 'Green':
        return 'bg-emerald-500 border-emerald-300 shadow-emerald-500/20'
      case 'Yellow':
        return 'bg-amber-400 border-amber-300 text-slate-900 shadow-amber-400/20'
      default:
        return ''
    }
  }

  // Custom icon inside Card helper
  const renderCardValue = (value: string) => {
    switch (value) {
      case 'Skip':
        return <span className="text-xl font-black italic tracking-tighter">Ø</span>
      case 'Reverse':
        return <span className="text-xl font-black italic tracking-tighter">⇄</span>
      case 'Draw2':
        return <span className="text-base font-black italic">+2</span>
      case 'WildDraw4':
        return (
          <span className="text-xs font-black italic bg-gradient-to-r from-red-400 via-yellow-400 to-emerald-400 bg-clip-text text-transparent">
            +4
          </span>
        )
      case 'Wild':
        return (
          <span className="flex gap-0.5 text-xs font-black">
            <span className="text-red-500">W</span>
            <span className="text-blue-500">I</span>
            <span className="text-emerald-500">L</span>
            <span className="text-yellow-400">D</span>
          </span>
        )
      default:
        return <span className="text-2xl font-extrabold font-mono">{value}</span>
    }
  }

  if (!engine || !gameState) {
    // STARTING / LANDING SCREEN
    return (
      <div className="mobile-viewport select-none">
        {/* Top Navbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-red-500 via-yellow-500 to-blue-500 flex items-center justify-center font-black text-slate-950 text-sm italic shadow-lg">
              U
            </div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase m-0 leading-none">
              UnoDeck
            </h1>
          </div>
          <button
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="relative mb-8">
            {/* Fancy stacked 3D cards visual */}
            <div className="w-24 h-36 bg-red-500 rounded-xl border-4 border-white shadow-2xl rotate-[-15deg] absolute -left-8 -top-4 flex items-center justify-center font-black text-4xl text-white italic">
              0
            </div>
            <div className="w-24 h-36 bg-blue-500 rounded-xl border-4 border-white shadow-2xl rotate-[10deg] absolute -right-8 -top-2 flex items-center justify-center font-black text-4xl text-white italic">
              ⇄
            </div>
            <div className="w-24 h-36 bg-slate-950 rounded-xl border-4 border-white shadow-2xl rotate-[-2deg] flex items-center justify-center font-black text-3xl text-white italic relative z-10">
              <span className="bg-gradient-to-r from-red-400 via-yellow-400 to-emerald-400 bg-clip-text text-transparent">
                +4
              </span>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-2">
            Mobile-First Uno Play
          </h2>
          <p className="text-slate-400 text-sm max-w-xs mb-8">
            Experience the ultimate, tactile, and fast-paced UNO game built optimized for your
            phone. Smart AI, audio, and fluid mechanics.
          </p>

          <button
            onClick={handleInitGame}
            className="w-full max-w-xs py-4 px-8 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 text-lg"
          >
            <Play fill="white" size={20} />
            Quick Match vs Bots
          </button>
        </div>

        {/* Bottom Specs Info */}
        <div className="px-6 py-6 border-t border-slate-800 bg-slate-950/80 text-center flex flex-col items-center gap-2">
          <div className="flex gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" />
              React 19
            </span>
            <span className="flex items-center gap-1">
              <Zap size={12} className="text-indigo-500" />
              Web Audio API
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" />
              Vitest Certified
            </span>
          </div>
          <p className="text-[10px] text-slate-600">Built for high performance offline play.</p>
        </div>
      </div>
    )
  }

  // ACTIVE GAMEPLAY SCREEN
  const myPlayer = gameState.players[0]
  const slickBot = gameState.players[1]
  const chippyBot = gameState.players[2]
  const smartyBot = gameState.players[3]
  const isMyTurn = gameState.currentPlayerIndex === 0
  const topCard = gameState.discardPile[gameState.discardPile.length - 1]

  return (
    <div className="mobile-viewport select-none flex flex-col justify-between bg-slate-950 text-white">
      {/* 1. Navbar / Score Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to quit the current match?')) {
              setEngine(null)
              setGameState(null)
            }
          }}
          className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
        >
          Quit Match
        </button>

        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Match Active
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRuleModalOpen(true)}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <Info size={18} />
          </button>
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* 2. Top Opponent (Bot 2 - Chippy) */}
      <div className="flex justify-center py-2 bg-slate-900/30 border-b border-slate-900/80 shrink-0 relative">
        <div
          className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border transition-all ${
            gameState.currentPlayerIndex === 2
              ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/5 scale-105'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow">
            <Bot size={14} />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold">{chippyBot.name}</span>
              {gameState.unoCalls[chippyBot.id] && (
                <span className="px-1 py-0.5 bg-red-600 text-[8px] font-black tracking-tighter uppercase rounded text-white animate-pulse">
                  UNO!
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-semibold">
                {chippyBot.hand.length} cards
              </span>
              {chippyBot.hand.length === 1 && !gameState.unoCalls[chippyBot.id] && (
                <button
                  onClick={() => handleChallenge(chippyBot.id)}
                  className="px-1.5 py-0.5 bg-red-500/20 hover:bg-red-500 border border-red-500 text-[8px] font-bold uppercase rounded text-red-200 hover:text-white transition-all ml-1.5"
                >
                  Challenge
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Direction Indicator Widget */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-md">
          <RotateCcw
            size={10}
            className={`text-slate-400 ${gameState.direction === 'counter-clockwise' ? 'rotate-180 text-amber-500' : 'text-emerald-500'}`}
          />
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
            {gameState.direction === 'clockwise' ? 'Clockwise' : 'Counter'}
          </span>
        </div>
      </div>

      {/* 3. Center Board Area (Draw Pile + Discard Pile + Last Log Action) */}
      <div className="flex-1 flex flex-col justify-between p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Left Opponent (Bot 1 - Slick) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <div
            className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all ${
              gameState.currentPlayerIndex === 1
                ? 'bg-amber-500/10 border-amber-500 shadow-lg scale-105'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow mb-1">
              <Bot size={16} />
            </div>
            <span className="text-[10px] font-bold max-w-[60px] truncate text-center">
              {slickBot.name}
            </span>
            <span className="text-xs font-black text-slate-400">{slickBot.hand.length} C</span>
            {gameState.unoCalls[slickBot.id] && (
              <span className="px-1 py-0.5 bg-red-600 text-[8px] font-black uppercase rounded mt-1 animate-pulse">
                UNO!
              </span>
            )}
            {slickBot.hand.length === 1 && !gameState.unoCalls[slickBot.id] && (
              <button
                onClick={() => handleChallenge(slickBot.id)}
                className="px-1.5 py-0.5 bg-red-500/20 hover:bg-red-500 border border-red-500 text-[8px] font-bold uppercase rounded text-red-200 hover:text-white transition-all mt-1.5"
              >
                Call out
              </button>
            )}
          </div>
        </div>

        {/* Right Opponent (Bot 3 - Smarty) */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
          <div
            className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all ${
              gameState.currentPlayerIndex === 3
                ? 'bg-amber-500/10 border-amber-500 shadow-lg scale-105'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm shadow mb-1">
              <Bot size={16} />
            </div>
            <span className="text-[10px] font-bold max-w-[60px] truncate text-center">
              {smartyBot.name}
            </span>
            <span className="text-xs font-black text-slate-400">{smartyBot.hand.length} C</span>
            {gameState.unoCalls[smartyBot.id] && (
              <span className="px-1 py-0.5 bg-red-600 text-[8px] font-black uppercase rounded mt-1 animate-pulse">
                UNO!
              </span>
            )}
            {smartyBot.hand.length === 1 && !gameState.unoCalls[smartyBot.id] && (
              <button
                onClick={() => handleChallenge(smartyBot.id)}
                className="px-1.5 py-0.5 bg-red-500/20 hover:bg-red-500 border border-red-500 text-[8px] font-bold uppercase rounded text-red-200 hover:text-white transition-all mt-1.5"
              >
                Call out
              </button>
            )}
          </div>
        </div>

        {/* Action Text Banner */}
        <div className="text-center px-8 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-full text-[10px] text-slate-300 font-semibold shadow-inner max-w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            <span className="truncate">{gameState.lastActionDescription}</span>
          </div>
        </div>

        {/* Card Piles Interaction */}
        <div className="flex items-center justify-center gap-8 my-auto z-10">
          {/* Draw Pile Card Back (Clickable if user turn) */}
          <button
            onClick={handleDrawCard}
            disabled={!isMyTurn || gameState.selectedWildCard !== null}
            className={`w-20 h-28 rounded-xl border-4 border-slate-800 bg-slate-900 flex flex-col items-center justify-center relative shadow-2xl transition-all ${
              isMyTurn && gameState.selectedWildCard === null
                ? 'hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-950'
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
          </button>

          {/* Discard Pile Card Face */}
          <div className="relative">
            <div
              className={`w-20 h-28 rounded-xl border-4 border-white flex flex-col items-center justify-center relative shadow-2xl overflow-hidden ${getCardStyle(
                topCard.color,
              )}`}
            >
              {/* Corner Value Label */}
              <div className="absolute top-1 left-1.5 text-xs font-black">
                {topCard.value === 'WildDraw4'
                  ? '+4'
                  : topCard.value === 'Wild'
                    ? 'W'
                    : topCard.value}
              </div>

              {/* Center Large Value */}
              <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center shadow-inner transform rotate-[-10deg]">
                {renderCardValue(topCard.value)}
              </div>

              {/* Bottom Mini Corner Value */}
              <div className="absolute bottom-1 right-1.5 text-xs font-black transform rotate-180">
                {topCard.value === 'WildDraw4'
                  ? '+4'
                  : topCard.value === 'Wild'
                    ? 'W'
                    : topCard.value}
              </div>
            </div>

            {/* Active Color selected label indicators */}
            {gameState.wildColorSelected && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase">
                <span
                  className={`w-2 h-2 rounded-full border border-white/20 ${getWildLabelStyle(
                    gameState.wildColorSelected,
                  )}`}
                ></span>
                <span>{gameState.wildColorSelected}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Suggestion helper banner */}
        <div className="text-center pb-2 z-10">
          {isMyTurn ? (
            gameState.selectedWildCard ? (
              <span className="text-xs font-bold text-amber-400">Choose a wild color below!</span>
            ) : (
              <span className="text-xs font-bold text-emerald-400 font-semibold">
                Your turn! Play a matching card or draw.
              </span>
            )
          ) : (
            <span className="text-xs font-medium text-slate-500">
              Wait for opponents to make a move...
            </span>
          )}
        </div>
      </div>

      {/* 4. Wild Color Selection Panel overlay */}
      {gameState.selectedWildCard && isMyTurn && (
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 shrink-0 z-20">
          <p className="text-xs text-center font-bold text-slate-300 mb-2">Select active color:</p>
          <div className="grid grid-cols-4 gap-2">
            {(['Red', 'Blue', 'Green', 'Yellow'] as CardColor[]).map((col) => (
              <button
                key={col}
                onClick={() => handleChooseColor(col)}
                className={`py-2 px-1 rounded-xl text-xs font-extrabold border-2 border-slate-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                  col === 'Red'
                    ? 'bg-red-500 hover:bg-red-600'
                    : col === 'Blue'
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : col === 'Green'
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-300'
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Player Controls & Hand area */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 shrink-0 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">
              <User size={12} />
            </div>
            <span className="text-xs font-bold text-slate-200">Your Hand</span>
            <span className="text-[10px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 font-extrabold">
              {myPlayer.hand.length} cards
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Call Uno button */}
            <button
              onClick={handleSayUno}
              disabled={myPlayer.hand.length !== 2}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                myPlayer.hand.length === 2
                  ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Yell UNO!
            </button>
            {gameState.unoCalls[myPlayer.id] && (
              <span className="px-2 py-0.5 bg-red-600 border border-red-500 text-[9px] font-black uppercase rounded text-white animate-pulse">
                Yelled
              </span>
            )}
          </div>
        </div>

        {/* Scrollable hand of cards */}
        <div className="flex gap-2.5 overflow-x-auto py-2 px-1 no-scrollbar min-h-[120px] scroll-smooth items-center">
          {myPlayer.hand.map((card) => {
            const isValid = engine.isValidMove(card) && isMyTurn && !gameState.selectedWildCard
            const canPlayPenalty =
              gameState.activeDrawPenalty > 0 &&
              ((topCard.value === 'Draw2' && card.value === 'Draw2') ||
                (topCard.value === 'WildDraw4' && card.value === 'WildDraw4'))

            const isBlockedByPenalty = gameState.activeDrawPenalty > 0 && !canPlayPenalty
            const cardPlayable = isValid && !isBlockedByPenalty

            return (
              <button
                key={card.id}
                onClick={() => handlePlayCard(card.id)}
                disabled={!cardPlayable}
                className={`w-16 h-24 rounded-lg border-2 flex flex-col items-center justify-center relative flex-shrink-0 transition-all ${getCardStyle(
                  card.color,
                )} ${
                  cardPlayable
                    ? 'hover:-translate-y-3 hover:scale-105 active:scale-95 shadow-md border-white cursor-pointer ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900'
                    : 'opacity-30 cursor-not-allowed grayscale-[40%]'
                }`}
              >
                {/* Top Corner Badge Mini Value */}
                <div className="absolute top-0.5 left-1 text-[10px] font-black">
                  {card.value === 'WildDraw4' ? '+4' : card.value === 'Wild' ? 'W' : card.value}
                </div>

                {/* Center graphic inside hand card */}
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center shadow-inner transform rotate-[-10deg]">
                  {renderCardValue(card.value)}
                </div>

                {/* Bottom Corner Mini Value */}
                <div className="absolute bottom-0.5 right-1 text-[10px] font-black transform rotate-180">
                  {card.value === 'WildDraw4' ? '+4' : card.value === 'Wild' ? 'W' : card.value}
                </div>
              </button>
            )
          })}

          {myPlayer.hand.length === 0 && (
            <div className="w-full text-center text-slate-500 py-6 font-medium text-xs">
              No cards in hand. Play is complete.
            </div>
          )}
        </div>
      </div>

      {/* 6. Game Over Overlay (Winner Announcement Screen) */}
      {gameState.status === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 z-50 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-2xl mb-4 transform scale-110 animate-bounce">
            <Award size={44} />
          </div>

          <h3 className="text-3xl font-black text-center text-white tracking-tight uppercase leading-none mb-1">
            Victory!
          </h3>
          <p className="text-slate-400 text-sm text-center max-w-xs mb-8">
            {gameState.winnerId === 'player-0'
              ? 'Incredible! You defeated Slick, Chippy, and Smarty Bot in this match.'
              : `Match Over. ${gameState.players.find((p) => p.id === gameState.winnerId)?.name} wins the match.`}
          </p>

          <button
            onClick={handleInitGame}
            className="w-full max-w-xs py-3.5 px-6 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 text-white font-bold rounded-2xl shadow-xl hover:opacity-90 transform active:scale-95 transition-all text-center"
          >
            Play Again
          </button>
        </div>
      )}

      {/* 7. Instructions / Rules Modal */}
      {ruleModalOpen && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col justify-between p-6 z-40">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-2 mb-4">
              <Info size={24} className="text-amber-500" />
              <h3 className="text-xl font-extrabold text-white tracking-tight leading-none uppercase">
                Uno Rules & Manual
              </h3>
            </div>

            <div className="space-y-4 text-xs text-slate-300 font-medium">
              <div>
                <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider mb-1">
                  Classic Play Rules
                </h4>
                <p>
                  Match card colors or numbers to play. Choose Red, Blue, Green, or Yellow colors
                  using wild cards.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider mb-1">
                  Card Stacking Penalty
                </h4>
                <p>
                  You can stack multiple Draw 2 or Wild Draw 4 cards directly on each other to
                  increase the penalty! If a Draw 2 is played on you, you can play your own Draw 2
                  to pass a total of 4 cards to the next player.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider mb-1">
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
            onClick={() => setRuleModalOpen(false)}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-xs transition-colors mt-4"
          >
            Back to Match
          </button>
        </div>
      )}
    </div>
  )
}
