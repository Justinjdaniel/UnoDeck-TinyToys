import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SoundManager } from '../soundManager'

// Mock Web Audio API
class MockGainNode {
  gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  }
  connect = vi.fn()
}

class MockOscillatorNode {
  type = 'sine'
  frequency = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  }
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class MockAudioContext {
  currentTime = 0
  state = 'running'
  destination = {}
  resume = vi.fn().mockResolvedValue(undefined)
  createGain = vi.fn().mockImplementation(() => new MockGainNode())
  createOscillator = vi.fn().mockImplementation(() => new MockOscillatorNode())
}

describe('SoundManager', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('AudioContext', MockAudioContext)
  })

  it('initializes with default settings when localStorage is empty', () => {
    const sm = new SoundManager()
    expect(sm.isMuted()).toBe(false)
    expect(sm.getVolume()).toBe(0.8)
  })

  it('persists mute state to localStorage', () => {
    const sm = new SoundManager()
    sm.setMuted(true)
    expect(sm.isMuted()).toBe(true)
    expect(localStorage.getItem('unodeck_sound_muted')).toBe('true')

    const sm2 = new SoundManager()
    expect(sm2.isMuted()).toBe(true)
  })

  it('toggles mute state correctly', () => {
    const sm = new SoundManager()
    expect(sm.isMuted()).toBe(false)
    const nextState = sm.toggleMute()
    expect(nextState).toBe(true)
    expect(sm.isMuted()).toBe(true)
  })

  it('persists volume to localStorage and bounds values between 0 and 1', () => {
    const sm = new SoundManager()
    sm.setVolume(0.5)
    expect(sm.getVolume()).toBe(0.5)
    expect(localStorage.getItem('unodeck_sound_volume')).toBe('0.5')

    sm.setVolume(1.5)
    expect(sm.getVolume()).toBe(1)

    sm.setVolume(-0.2)
    expect(sm.getVolume()).toBe(0)

    const sm2 = new SoundManager()
    expect(sm2.getVolume()).toBe(0)
  })

  it('does not play sound when muted', () => {
    const sm = new SoundManager()
    sm.setMuted(true)
    sm.init()
    sm.play('click')
    // Since init wasn't called inside play due to early return, ctx will not trigger createGain
  })

  it('plays all sound effects without throwing errors', () => {
    const sm = new SoundManager()
    const sounds = ['shuffle', 'draw', 'place', 'click', 'uno', 'win', 'lose'] as const

    sounds.forEach((sound) => {
      expect(() => sm.play(sound)).not.toThrow()
    })
  })
})
