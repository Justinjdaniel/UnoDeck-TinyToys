export type SoundEffect = 'shuffle' | 'draw' | 'place' | 'click' | 'uno' | 'win' | 'lose'

const MUTE_STORAGE_KEY = 'unodeck_sound_muted'
const VOLUME_STORAGE_KEY = 'unodeck_sound_volume'

export class SoundManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private muted: boolean = false
  private volume: number = 0.8

  constructor() {
    this.loadSettings()
  }

  private loadSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedMute = localStorage.getItem(MUTE_STORAGE_KEY)
        if (savedMute !== null) {
          this.muted = savedMute === 'true'
        }

        const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY)
        if (savedVolume !== null) {
          const parsed = parseFloat(savedVolume)
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.volume = parsed
          }
        }
      }
    } catch (e) {
      console.warn('Unable to load sound settings from localStorage', e)
    }
  }

  private saveSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted))
        localStorage.setItem(VOLUME_STORAGE_KEY, String(this.volume))
      }
    } catch (e) {
      console.warn('Unable to save sound settings to localStorage', e)
    }
  }

  /**
   * Preload / Initialize Web Audio API AudioContext.
   * Creates and retains master GainNode connected to AudioContext destination.
   * Resolves suspended state on user interaction for zero latency on touch interactions.
   */
  public init() {
    if (typeof window === 'undefined') return
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass()
        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
        this.masterGain.connect(this.ctx.destination)
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Ignored if user interaction requirement not met yet
      })
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted
    this.saveSettings()
  }

  public isMuted(): boolean {
    return this.muted
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted)
    return this.muted
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    this.saveSettings()
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
    }
  }

  public getVolume(): number {
    return this.volume
  }

  /**
   * Sound synthesis engine using Web Audio API for zero latency and crisp, zero-dependency sound FX.
   */
  public play(sound: SoundEffect) {
    if (this.muted || this.volume <= 0) return

    this.init()
    if (!this.ctx || !this.masterGain) return

    const now = this.ctx.currentTime

    switch (sound) {
      case 'shuffle':
        this.playShuffle(this.masterGain, now)
        break
      case 'draw':
        this.playDraw(this.masterGain, now)
        break
      case 'place':
        this.playPlace(this.masterGain, now)
        break
      case 'click':
        this.playClick(this.masterGain, now)
        break
      case 'uno':
        this.playUno(this.masterGain, now)
        break
      case 'win':
        this.playWin(this.masterGain, now)
        break
      case 'lose':
        this.playLose(this.masterGain, now)
        break
    }
  }

  /**
   * Card Shuffle (game start) - Rapid burst of friction swishes & noise pulses
   */
  private playShuffle(destination: GainNode, now: number) {
    if (!this.ctx) return
    const count = 7
    for (let i = 0; i < count; i++) {
      const startTime = now + i * 0.04
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(180 + Math.random() * 120, startTime)
      osc.frequency.exponentialRampToValueAtTime(80, startTime + 0.03)

      gain.gain.setValueAtTime(0.12, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03)

      osc.connect(gain)
      gain.connect(destination)

      osc.start(startTime)
      osc.stop(startTime + 0.03)
    }
  }

  /**
   * Card Draw (card sliding sound) - Smooth pitch slide upward with soft snap
   */
  private playDraw(destination: GainNode, now: number) {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.08)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    gain.connect(destination)

    osc.start(now)
    osc.stop(now + 0.08)
  }

  /**
   * Card Place / Slap (card landing on pile) - Crisp snap and quick decay slap
   */
  private playPlace(destination: GainNode, now: number) {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.07)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)

    osc.connect(gain)
    gain.connect(destination)

    osc.start(now)
    osc.stop(now + 0.07)
  }

  /**
   * Button Click / Card Select - Subtle tactile blip
   */
  private playClick(destination: GainNode, now: number) {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.03)

    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)

    osc.connect(gain)
    gain.connect(destination)

    osc.start(now)
    osc.stop(now + 0.03)
  }

  /**
   * "UNO!" Alert sound - Energetic 3-tone chime
   */
  private playUno(destination: GainNode, now: number) {
    if (!this.ctx) return
    const notes = [350, 700, 1050]
    notes.forEach((freq, index) => {
      if (!this.ctx) return
      const startTime = now + index * 0.07
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.2, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15)

      osc.connect(gain)
      gain.connect(destination)

      osc.start(startTime)
      osc.stop(startTime + 0.15)
    })
  }

  /**
   * Win Fanfare - Triumphant ascending major arpeggio
   */
  private playWin(destination: GainNode, now: number) {
    if (!this.ctx) return
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      if (!this.ctx) return
      const startTime = now + index * 0.09
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = index === notes.length - 1 ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.2, startTime)
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + (index === notes.length - 1 ? 0.5 : 0.2),
      )

      osc.connect(gain)
      gain.connect(destination)

      osc.start(startTime)
      osc.stop(startTime + (index === notes.length - 1 ? 0.5 : 0.2))
    })
  }

  /**
   * Lose Fanfare - Descending minor sound
   */
  private playLose(destination: GainNode, now: number) {
    if (!this.ctx) return
    const notes = [400, 350, 300, 250]
    notes.forEach((freq, index) => {
      if (!this.ctx) return
      const startTime = now + index * 0.12
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.12, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25)

      osc.connect(gain)
      gain.connect(destination)

      osc.start(startTime)
      osc.stop(startTime + 0.25)
    })
  }
}

export const soundManager = new SoundManager()
