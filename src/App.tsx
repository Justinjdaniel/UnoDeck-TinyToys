import { useState, useEffect, useRef } from 'react'
import { Play, Volume2, VolumeX, Sparkles, CheckCircle2, Info, Zap } from 'lucide-react'
import confetti from 'canvas-confetti'
import { UnoEngine, type CardColor, type UnoCard } from './engine/unoEngine'
import { Board } from './components/Board'

// Sound FX Helpers using simple Web Audio API synthesis
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

  const isValidPlay = (card: UnoCard) => {
    if (!engine) return false
    return engine.isValidMove(card)
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

  return (
    <div className="relative w-full h-full">
      <Board
        gameState={gameState}
        isMuted={isMuted}
        toggleMute={toggleMute}
        ruleModalOpen={ruleModalOpen}
        setRuleModalOpen={setRuleModalOpen}
        handlePlayCard={handlePlayCard}
        handleDrawCard={handleDrawCard}
        handleSayUno={handleSayUno}
        handleChallenge={handleChallenge}
        handleChooseColor={handleChooseColor}
        handleInitGame={handleInitGame}
        isValidPlay={isValidPlay}
      />

      {/* 7. Instructions / Rules Modal */}
      {ruleModalOpen && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col justify-between p-6 z-45">
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
