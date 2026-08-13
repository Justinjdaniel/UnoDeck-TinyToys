import { describe, it, expect, beforeEach } from 'vitest'
import { UnoEngine, type UnoCard } from '../unoEngine'

describe('UnoEngine Class Tests', () => {
  let engine: UnoEngine

  beforeEach(() => {
    engine = new UnoEngine([
      { name: 'Alice', isBot: false },
      { name: 'Bob', isBot: true },
      { name: 'Charlie', isBot: true },
    ])
  })

  it('initializes the game state correctly', () => {
    const state = engine.getState()
    expect(state.players).toHaveLength(3)
    expect(state.players[0].name).toBe('Alice')
    expect(state.players[0].isBot).toBe(false)
    expect(state.players[1].name).toBe('Bob')
    expect(state.players[1].isBot).toBe(true)
    expect(state.status).toBe('WAITING')
    expect(state.currentPlayerIndex).toBe(0)
  })

  it('generates a full standard 108 card deck', () => {
    const deck = engine.generateDeck()
    expect(deck).toHaveLength(108)

    const wildCards = deck.filter((c) => c.color === 'Wild')
    expect(wildCards).toHaveLength(8)

    const redCards = deck.filter((c) => c.color === 'Red')
    expect(redCards).toHaveLength(25)
  })

  it('starts game and deals cards', () => {
    engine.startGame()
    const state = engine.getState()

    expect(state.status).toBe('PLAYING')
    expect(state.discardPile).toHaveLength(1)
    expect(state.players[0].hand).toHaveLength(7)
    expect(state.players[1].hand).toHaveLength(7)
    expect(state.players[2].hand).toHaveLength(7)

    expect(state.deck.length).toBe(108 - 21 - 1)
  })

  it('validates card match rules correctly', () => {
    engine.startGame()
    const state = engine.state // use actual state instead of clone

    // Mock starting card on discard pile
    const mockTopCard: UnoCard = { id: 'top', color: 'Red', value: '5' }
    state.discardPile = [mockTopCard]
    engine.state.wildColorSelected = null

    // Valid plays
    const matchingColor: UnoCard = { id: 'c1', color: 'Red', value: '9' }
    const matchingValue: UnoCard = { id: 'c2', color: 'Blue', value: '5' }
    const wildCard: UnoCard = { id: 'c3', color: 'Wild', value: 'Wild' }

    // Invalid play
    const nonMatching: UnoCard = { id: 'c4', color: 'Blue', value: '7' }

    // Valid checks
    expect(engine.isValidMove(matchingColor)).toBe(true)
    expect(engine.isValidMove(matchingValue)).toBe(true)
    expect(engine.isValidMove(wildCard)).toBe(true)
    expect(engine.isValidMove(nonMatching)).toBe(false)
  })

  it('manages clockwise turn progression', () => {
    engine.startGame()

    // Explicitly reset any starting penalty/wild state that could block standard plays
    engine.state.currentPlayerIndex = 0
    engine.state.activeDrawPenalty = 0
    engine.state.selectedWildCard = null
    engine.state.wildColorSelected = null
    engine.state.direction = 'clockwise'
    engine.state.discardPile = [{ id: 'starter', color: 'Red', value: '5' }]

    // Give Alice multiple cards so playing one does not trigger win condition
    const card1: UnoCard = { id: 'test-play', color: 'Red', value: '1' }
    const card2: UnoCard = { id: 'other', color: 'Blue', value: '2' }
    engine.state.players[0].hand = [card1, card2]

    engine.playCard('player-0', 'test-play')

    const newState = engine.getState()
    expect(newState.currentPlayerIndex).toBe(1) // Should be Bob's turn next
  })

  it('reverses game direction when Reverse card is played', () => {
    engine.startGame()

    engine.state.currentPlayerIndex = 0
    engine.state.activeDrawPenalty = 0
    engine.state.selectedWildCard = null
    engine.state.wildColorSelected = null
    engine.state.direction = 'clockwise'
    engine.state.discardPile = [{ id: 'starter', color: 'Red', value: '5' }]

    const reverseCard: UnoCard = { id: 'rev-card', color: 'Red', value: 'Reverse' }
    const card2: UnoCard = { id: 'other', color: 'Blue', value: '2' }
    engine.state.players[0].hand = [reverseCard, card2]

    engine.playCard('player-0', 'rev-card')

    const newState = engine.getState()
    expect(newState.direction).toBe('counter-clockwise')
    expect(newState.currentPlayerIndex).toBe(2) // Goes to player 2 (Charlie) in 3-player counter-clockwise
  })

  it('skips next player when Skip card is played', () => {
    engine.startGame()

    engine.state.currentPlayerIndex = 0
    engine.state.activeDrawPenalty = 0
    engine.state.selectedWildCard = null
    engine.state.wildColorSelected = null
    engine.state.direction = 'clockwise'
    engine.state.discardPile = [{ id: 'starter', color: 'Red', value: '5' }]

    const skipCard: UnoCard = { id: 'skip-card', color: 'Red', value: 'Skip' }
    const card2: UnoCard = { id: 'other', color: 'Blue', value: '2' }
    engine.state.players[0].hand = [skipCard, card2]

    engine.playCard('player-0', 'skip-card')

    const newState = engine.getState()
    expect(newState.currentPlayerIndex).toBe(2) // Skip Bob (1), goes to Charlie (2)
  })

  it('stacks Draw2 card penalty correctly', () => {
    engine.startGame()

    engine.state.currentPlayerIndex = 0
    engine.state.activeDrawPenalty = 0
    engine.state.selectedWildCard = null
    engine.state.wildColorSelected = null
    engine.state.direction = 'clockwise'
    engine.state.discardPile = [{ id: 'starter', color: 'Red', value: '5' }]

    // Alice plays Draw2 (needs more than 1 card to not win)
    engine.state.players[0].hand = [
      { id: 'd2-p1', color: 'Red', value: 'Draw2' },
      { id: 'other1', color: 'Blue', value: '2' },
    ]
    engine.playCard('player-0', 'd2-p1')

    const tempState = engine.getState()
    expect(tempState.activeDrawPenalty).toBe(2)
    expect(tempState.currentPlayerIndex).toBe(1)

    // Bob plays Draw2
    engine.state.players[1].hand = [
      { id: 'd2-p2', color: 'Red', value: 'Draw2' },
      { id: 'other2', color: 'Blue', value: '2' },
    ]
    engine.playCard('player-1', 'd2-p2')

    const nextState = engine.getState()
    expect(nextState.activeDrawPenalty).toBe(4)
    expect(nextState.currentPlayerIndex).toBe(2)

    // Charlie has to draw penalty cards
    engine.state.players[2].hand = [{ id: 'normal-card', color: 'Green', value: '9' }]
    engine.drawCard('player-2')

    const finalState = engine.getState()
    expect(finalState.activeDrawPenalty).toBe(0)
    expect(finalState.players[2].hand.length).toBe(1 + 4)
    expect(finalState.currentPlayerIndex).toBe(0)
  })

  it('handles win conditions properly', () => {
    engine.startGame()

    engine.state.currentPlayerIndex = 0
    engine.state.activeDrawPenalty = 0
    engine.state.selectedWildCard = null
    engine.state.wildColorSelected = null
    engine.state.discardPile = [{ id: 'starter', color: 'Red', value: '5' }]

    const winningCard: UnoCard = { id: 'win-card', color: 'Red', value: '9' }
    engine.state.players[0].hand = [winningCard]

    engine.playCard('player-0', 'win-card')

    const finalState = engine.getState()
    expect(finalState.status).toBe('GAME_OVER')
    expect(finalState.winnerId).toBe('player-0')
  })

  it('validates wild card play and color selection', () => {
    engine.startGame()

    engine.state.currentPlayerIndex = 0
    engine.state.activeDrawPenalty = 0
    engine.state.selectedWildCard = null
    engine.state.wildColorSelected = null
    engine.state.direction = 'clockwise'
    engine.state.discardPile = [{ id: 'starter', color: 'Red', value: '5' }]

    const wildCard: UnoCard = { id: 'wild-card', color: 'Wild', value: 'Wild' }
    const card2: UnoCard = { id: 'other', color: 'Blue', value: '2' }
    engine.state.players[0].hand = [wildCard, card2]

    engine.playCard('player-0', 'wild-card')

    const midState = engine.getState()
    expect(midState.selectedWildCard).not.toBeNull()
    expect(midState.currentPlayerIndex).toBe(0)

    engine.chooseWildColor('player-0', 'Blue')

    const finalState = engine.getState()
    expect(finalState.wildColorSelected).toBe('Blue')
    expect(finalState.selectedWildCard).toBeNull()
    expect(finalState.currentPlayerIndex).toBe(1)
  })

  it('handles UNO calling rules and challenging', () => {
    engine.startGame()
    const state = engine.state // use actual state instead of clone

    const alice = state.players[0]
    const bob = state.players[1]

    alice.hand = [{ id: 'one-left', color: 'Red', value: '5' }]

    engine.challengeUno(bob.id, alice.id)

    const tempState = engine.getState()
    expect(tempState.players[0].hand).toHaveLength(3)

    alice.hand = [{ id: 'one-left-again', color: 'Red', value: '5' }]
    engine.state.unoCalls[alice.id] = false

    engine.sayUno(alice.id)
    engine.challengeUno(bob.id, alice.id)

    const finalState = engine.getState()
    expect(finalState.players[0].hand).toHaveLength(1)
  })

  it('calls makeBotDecision, bot declares UNO when reduced to 1 card', () => {
    engine.startGame()

    // Setup: It is Bob's turn (player-1), Bob is a Bot.
    engine.state.currentPlayerIndex = 1
    engine.state.activeDrawPenalty = 0
    engine.state.selectedWildCard = null
    engine.state.wildColorSelected = null
    engine.state.direction = 'clockwise'
    engine.state.discardPile = [{ id: 'starter', color: 'Red', value: '5' }]

    // Give Bob exactly 2 cards, one of which is playable Red 1
    const card1: UnoCard = { id: 'playable-bot-card', color: 'Red', value: '1' }
    const card2: UnoCard = { id: 'unplayable-bot-card', color: 'Blue', value: '9' }
    engine.state.players[1].hand = [card1, card2]

    // Initially Bob has not declared UNO
    expect(engine.state.unoCalls['player-1']).toBeFalsy()

    // Trigger bot turn decision
    engine.makeBotDecision()

    // Bob plays playable-bot-card, reducing his hand to 1 card.
    // He must yell UNO!
    expect(engine.state.unoCalls['player-1']).toBe(true)
    expect(engine.state.players[1].hand).toHaveLength(1)
  })
})
