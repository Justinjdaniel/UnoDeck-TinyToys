import { describe, it, expect, beforeEach } from 'vitest'
import { UnoEngine, type UnoCard } from '../unoEngine'
import { decideBotMove, getDominantColor, getNextPlayerIndex, getBotThinkingDelay } from '../botAI'

describe('Bot AI Unit Tests', () => {
  let engine: UnoEngine

  beforeEach(() => {
    engine = new UnoEngine([
      { name: 'You', isBot: false },
      { name: 'Bot 1', isBot: true },
      { name: 'Bot 2', isBot: true },
      { name: 'Bot 3', isBot: true },
    ])
    engine.startGame()
  })

  it('calculates dominant color correctly', () => {
    const hand: UnoCard[] = [
      { id: '1', color: 'Blue', value: '1' },
      { id: '2', color: 'Blue', value: '5' },
      { id: '3', color: 'Red', value: '3' },
      { id: '4', color: 'Wild', value: 'Wild' },
    ]
    expect(getDominantColor(hand)).toBe('Blue')
  })

  it('calculates next player index in both directions', () => {
    expect(getNextPlayerIndex(0, 4, 'clockwise')).toBe(1)
    expect(getNextPlayerIndex(3, 4, 'clockwise')).toBe(0)
    expect(getNextPlayerIndex(0, 4, 'counter-clockwise')).toBe(3)
    expect(getNextPlayerIndex(1, 4, 'counter-clockwise')).toBe(0)
  })

  it('generates thinking delay within min/max bounds', () => {
    for (let i = 0; i < 20; i++) {
      const delay = getBotThinkingDelay(800, 1200)
      expect(delay).toBeGreaterThanOrEqual(800)
      expect(delay).toBeLessThanOrEqual(1200)
    }
  })

  it('saves Wild cards for emergency when non-wild playable card exists', () => {
    engine.state.currentPlayerIndex = 1
    engine.state.activeDrawPenalty = 0
    engine.state.selectedWildCard = null
    engine.state.wildColorSelected = null
    engine.state.discardPile = [{ id: 'top', color: 'Red', value: '5' }]

    // Player 2 (next player after bot 1) has 5 cards (not in danger)
    engine.state.players[2].hand = new Array(5).fill({ id: 'c', color: 'Green', value: '1' })

    const botPlayer = engine.state.players[1]
    botPlayer.hand = [
      { id: 'red-card', color: 'Red', value: '9' },
      { id: 'wild-card', color: 'Wild', value: 'Wild' },
    ]

    const isValidMoveFn = (card: UnoCard) => engine.isValidMove(card)
    const canStackFn = (top: UnoCard, card: UnoCard) =>
      (top.value === 'Draw2' && card.value === 'Draw2') ||
      (top.value === 'WildDraw4' && card.value === 'WildDraw4')

    const decision = decideBotMove(engine.state, botPlayer, isValidMoveFn, canStackFn)

    expect(decision.action).toBe('play')
    expect(decision.cardId).toBe('red-card')
  })

  it('aggressively plays Draw2 / Skip when next opponent has <= 2 cards', () => {
    engine.state.currentPlayerIndex = 1
    engine.state.activeDrawPenalty = 0
    engine.state.selectedWildCard = null
    engine.state.wildColorSelected = null
    engine.state.discardPile = [{ id: 'top', color: 'Red', value: '5' }]

    // Player 2 (next player) has 2 cards (in danger position)
    engine.state.players[2].hand = [
      { id: 'p2-1', color: 'Blue', value: '1' },
      { id: 'p2-2', color: 'Blue', value: '2' },
    ]

    const botPlayer = engine.state.players[1]
    botPlayer.hand = [
      { id: 'red-9', color: 'Red', value: '9' },
      { id: 'red-draw2', color: 'Red', value: 'Draw2' },
    ]

    const isValidMoveFn = (card: UnoCard) => engine.isValidMove(card)
    const canStackFn = (top: UnoCard, card: UnoCard) =>
      (top.value === 'Draw2' && card.value === 'Draw2') ||
      (top.value === 'WildDraw4' && card.value === 'WildDraw4')

    const decision = decideBotMove(engine.state, botPlayer, isValidMoveFn, canStackFn)

    expect(decision.action).toBe('play')
    expect(decision.cardId).toBe('red-draw2')
  })

  it('auto-triggers shouldSayUno when bot plays card that leaves 1 card in hand', () => {
    engine.state.currentPlayerIndex = 1
    engine.state.activeDrawPenalty = 0
    engine.state.selectedWildCard = null
    engine.state.wildColorSelected = null
    engine.state.discardPile = [{ id: 'top', color: 'Red', value: '5' }]

    const botPlayer = engine.state.players[1]
    botPlayer.hand = [
      { id: 'play-card', color: 'Red', value: '1' },
      { id: 'hold-card', color: 'Blue', value: '8' },
    ]

    const isValidMoveFn = (card: UnoCard) => engine.isValidMove(card)
    const canStackFn = (top: UnoCard, card: UnoCard) =>
      (top.value === 'Draw2' && card.value === 'Draw2') ||
      (top.value === 'WildDraw4' && card.value === 'WildDraw4')

    const decision = decideBotMove(engine.state, botPlayer, isValidMoveFn, canStackFn)

    expect(decision.action).toBe('play')
    expect(decision.cardId).toBe('play-card')
    expect(decision.shouldSayUno).toBe(true)
  })
})
