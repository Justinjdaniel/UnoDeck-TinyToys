import { decideBotMove, getDominantColor, type GameMode } from './botAI'

export type CardColor = 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Wild'

export type CardValue =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'Skip'
  | 'Reverse'
  | 'Draw2'
  | 'Wild'
  | 'WildDraw4'

export interface UnoCard {
  id: string
  color: CardColor
  value: CardValue
}

export interface Player {
  id: string
  name: string
  hand: UnoCard[]
  isBot: boolean
}

export type GameStatus = 'WAITING' | 'PLAYING' | 'GAME_OVER'

export interface UnoGameState {
  players: Player[]
  currentPlayerIndex: number
  deck: UnoCard[]
  discardPile: UnoCard[]
  direction: 'clockwise' | 'counter-clockwise'
  status: GameStatus
  winnerId: string | null
  unoCalls: { [playerId: string]: boolean } // Tracks who called UNO on current single-card status
  activeDrawPenalty: number // Accumulated cards to be drawn (e.g. Draw2, WildDraw4 stacking)
  wildColorSelected: CardColor | null // Holds chosen color for wild cards
  selectedWildCard: UnoCard | null // Holds wild card that was played and is awaiting color selection
  lastActionDescription: string
  hasDrawnThisTurn: boolean // Track if current player has drawn a card this turn
  isWildFromPlay: boolean // Track if the pending wild card was played from hand (versus starter card)
  mode: GameMode
}

export class UnoEngine {
  public state: UnoGameState

  constructor(playerNames: { name: string; isBot: boolean }[], mode: GameMode = 'VS_BOT') {
    if (playerNames.length < 2 || playerNames.length > 10) {
      throw new Error('UNO requires between 2 and 10 players.')
    }

    const players: Player[] = playerNames.map((p, idx) => ({
      id: `player-${idx}`,
      name: p.name,
      hand: [],
      isBot: p.isBot,
    }))

    this.state = {
      players,
      currentPlayerIndex: 0,
      deck: [],
      discardPile: [],
      direction: 'clockwise',
      status: 'WAITING',
      winnerId: null,
      unoCalls: {},
      activeDrawPenalty: 0,
      wildColorSelected: null,
      selectedWildCard: null,
      lastActionDescription: 'Game initialized. Waiting to start.',
      hasDrawnThisTurn: false,
      isWildFromPlay: false,
      mode,
    }
  }

  // Returns a deep clone structural snapshot
  public getState(): UnoGameState {
    return {
      ...this.state,
      players: this.state.players.map((p) => ({
        ...p,
        hand: p.hand.map((c) => ({ ...c })),
      })),
      deck: this.state.deck.map((c) => ({ ...c })),
      discardPile: this.state.discardPile.map((c) => ({ ...c })),
      unoCalls: { ...this.state.unoCalls },
    }
  }

  // Generates 108 card standard deck
  public generateDeck(): UnoCard[] {
    const deck: UnoCard[] = []
    const colors: ('Red' | 'Blue' | 'Green' | 'Yellow')[] = ['Red', 'Blue', 'Green', 'Yellow']

    let idCounter = 0
    const createCard = (color: CardColor, value: CardValue): UnoCard => ({
      id: `card-${idCounter++}`,
      color,
      value,
    })

    for (const color of colors) {
      // One '0' card for each color
      deck.push(createCard(color, '0'))

      // Two of each '1'-'9', 'Skip', 'Reverse', 'Draw2' for each color
      const values: CardValue[] = [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        'Skip',
        'Reverse',
        'Draw2',
      ]
      for (const value of values) {
        deck.push(createCard(color, value))
        deck.push(createCard(color, value))
      }
    }

    // 4 Wild and 4 WildDraw4
    for (let i = 0; i < 4; i++) {
      deck.push(createCard('Wild', 'Wild'))
      deck.push(createCard('Wild', 'WildDraw4'))
    }

    return deck
  }

  public shuffleDeck(deck: UnoCard[]): UnoCard[] {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  public startGame(): void {
    let rawDeck = this.generateDeck()
    rawDeck = this.shuffleDeck(rawDeck)

    // Deal 7 cards to each player
    const players = this.state.players.map((p) => ({ ...p, hand: [] as UnoCard[] }))
    for (let i = 0; i < 7; i++) {
      for (const player of players) {
        const card = rawDeck.pop()
        if (card) {
          player.hand.push(card)
        }
      }
    }

    // Flip top card to start discard pile. Must not be WildDraw4.
    let starterCard = rawDeck.pop()
    while (starterCard && starterCard.value === 'WildDraw4') {
      rawDeck.unshift(starterCard)
      rawDeck = this.shuffleDeck(rawDeck)
      starterCard = rawDeck.pop()
    }

    if (!starterCard) {
      throw new Error('Failed to draw a valid starting card.')
    }

    const discardPile = [starterCard]

    this.state = {
      ...this.state,
      players,
      deck: rawDeck,
      discardPile,
      status: 'PLAYING',
      currentPlayerIndex: 0,
      direction: 'clockwise',
      winnerId: null,
      unoCalls: {},
      activeDrawPenalty: 0,
      wildColorSelected: null,
      selectedWildCard: null,
      lastActionDescription: `Game started! Starting card is ${starterCard.color} ${starterCard.value}.`,
      hasDrawnThisTurn: false,
      isWildFromPlay: false,
    }

    // Apply first card action effects if it's special
    this.handleStartingCardAction(starterCard)
  }

  private handleStartingCardAction(card: UnoCard): void {
    const activePlayer = this.state.players[this.state.currentPlayerIndex]

    if (card.value === 'Skip') {
      this.state.lastActionDescription += ` Skip card skipped ${activePlayer.name}'s turn.`
      this.moveToNextPlayer()
    } else if (card.value === 'Reverse') {
      if (this.state.players.length === 2) {
        this.state.lastActionDescription += ` Reverse card behaves like Skip in 2-player game. ${activePlayer.name}'s turn is skipped.`
        this.moveToNextPlayer()
      } else {
        this.state.direction =
          this.state.direction === 'clockwise' ? 'counter-clockwise' : 'clockwise'
        this.state.lastActionDescription += ` Direction reversed!`
        this.state.currentPlayerIndex = this.state.players.length - 1
      }
    } else if (card.value === 'Draw2') {
      this.state.activeDrawPenalty = 2
      this.state.lastActionDescription += ` Draw 2 starts an active penalty of 2 cards.`
    } else if (card.value === 'Wild') {
      this.state.selectedWildCard = card
      this.state.isWildFromPlay = false
      this.state.lastActionDescription += ` Wild card start. Awaiting color selection.`
    }
  }

  public isValidMove(card: UnoCard): boolean {
    if (card.color === 'Wild') {
      return true
    }

    const topCard = this.state.discardPile[this.state.discardPile.length - 1]
    const activeColor = this.state.wildColorSelected || topCard.color

    return card.color === activeColor || card.value === topCard.value
  }

  // Stacking validation helper
  private canStackOnPenalty(topCard: UnoCard, card: UnoCard): boolean {
    return (
      (topCard.value === 'Draw2' && card.value === 'Draw2') ||
      (topCard.value === 'WildDraw4' && card.value === 'WildDraw4')
    )
  }

  public playCard(playerId: string, cardId: string): void {
    if (this.state.status !== 'PLAYING') {
      throw new Error('Game is not currently active.')
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex]
    if (currentPlayer.id !== playerId) {
      throw new Error("It is not this player's turn.")
    }

    const cardIndex = currentPlayer.hand.findIndex((c) => c.id === cardId)
    if (cardIndex === -1) {
      throw new Error('Card not found in player hand.')
    }

    const card = currentPlayer.hand[cardIndex]

    if (this.state.activeDrawPenalty > 0) {
      const topCard = this.state.discardPile[this.state.discardPile.length - 1]
      if (!this.canStackOnPenalty(topCard, card)) {
        throw new Error('You must draw cards to satisfy the active penalty.')
      }
    }

    if (!this.isValidMove(card)) {
      throw new Error('Invalid move. Card does not match the active color or value.')
    }

    // Play card
    currentPlayer.hand.splice(cardIndex, 1)
    this.state.discardPile.push(card)

    // Reset wild color selection unless it's another wild card
    if (card.color !== 'Wild') {
      this.state.wildColorSelected = null
    }

    this.state.lastActionDescription = `${currentPlayer.name} played ${card.color} ${card.value}.`

    // Win condition detection
    if (currentPlayer.hand.length === 0) {
      this.state.status = 'GAME_OVER'
      this.state.winnerId = currentPlayer.id
      this.state.lastActionDescription = `${currentPlayer.name} wins the game!`
      return
    }

    // Handle card action
    if (card.value === 'Skip') {
      this.state.lastActionDescription += ` Skipping the next player.`
      this.moveToNextPlayer()
      this.moveToNextPlayer()
    } else if (card.value === 'Reverse') {
      if (this.state.players.length === 2) {
        this.state.lastActionDescription += ` Reversing direction acts as a skip in a 2-player game.`
        this.moveToNextPlayer()
        this.moveToNextPlayer()
      } else {
        this.state.direction =
          this.state.direction === 'clockwise' ? 'counter-clockwise' : 'clockwise'
        this.state.lastActionDescription += ` Play direction reversed!`
        this.moveToNextPlayer()
      }
    } else if (card.value === 'Draw2') {
      this.state.activeDrawPenalty += 2
      this.moveToNextPlayer()
    } else if (card.value === 'WildDraw4') {
      this.state.activeDrawPenalty += 4
      this.state.selectedWildCard = card
      this.state.isWildFromPlay = true
    } else if (card.value === 'Wild') {
      this.state.selectedWildCard = card
      this.state.isWildFromPlay = true
    } else {
      this.moveToNextPlayer()
    }
  }

  public chooseWildColor(playerId: string, color: CardColor): void {
    if (this.state.status !== 'PLAYING') {
      throw new Error('Game is not currently active.')
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex]
    if (currentPlayer.id !== playerId) {
      throw new Error("It is not this player's turn to choose wild color.")
    }

    if (!this.state.selectedWildCard) {
      throw new Error('No wild card is awaiting color selection.')
    }

    if (color === 'Wild') {
      throw new Error('Selected wild color must be Red, Blue, Green, or Yellow.')
    }

    this.state.wildColorSelected = color
    this.state.selectedWildCard = null

    this.state.lastActionDescription = `${currentPlayer.name} chose ${color} as the wild color.`

    // Run moveToNextPlayer ONLY if it was played from hand
    if (this.state.isWildFromPlay) {
      this.moveToNextPlayer()
    }
  }

  public drawCard(playerId: string): void {
    if (this.state.status !== 'PLAYING') {
      throw new Error('Game is not active.')
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex]
    if (currentPlayer.id !== playerId) {
      throw new Error("It is not this player's turn.")
    }

    if (this.state.hasDrawnThisTurn) {
      throw new Error('You have already drawn a card this turn.')
    }

    if (this.state.deck.length <= this.state.activeDrawPenalty + 2) {
      this.refillDeck()
    }

    if (this.state.activeDrawPenalty > 0) {
      const drawnCards: UnoCard[] = []
      for (let i = 0; i < this.state.activeDrawPenalty; i++) {
        const card = this.state.deck.pop()
        if (card) {
          drawnCards.push(card)
        }
      }
      currentPlayer.hand.push(...drawnCards)
      this.state.lastActionDescription = `${currentPlayer.name} drew ${this.state.activeDrawPenalty} penalty cards.`
      this.state.activeDrawPenalty = 0

      if (currentPlayer.hand.length > 1) {
        this.state.unoCalls[currentPlayer.id] = false
      }

      this.moveToNextPlayer()
      return
    }

    const card = this.state.deck.pop()
    if (!card) {
      throw new Error('No cards left to draw.')
    }

    currentPlayer.hand.push(card)
    this.state.lastActionDescription = `${currentPlayer.name} drew a card.`
    this.state.hasDrawnThisTurn = true

    if (currentPlayer.hand.length > 1) {
      this.state.unoCalls[currentPlayer.id] = false
    }

    if (!this.isValidMove(card)) {
      this.moveToNextPlayer()
    }
  }

  // End turn when they decline to play drawn card
  public pass(playerId: string): void {
    if (this.state.status !== 'PLAYING') {
      throw new Error('Game is not active.')
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex]
    if (currentPlayer.id !== playerId) {
      throw new Error("It is not this player's turn to pass.")
    }

    if (!this.state.hasDrawnThisTurn) {
      throw new Error('You must draw a card before passing.')
    }

    this.state.lastActionDescription = `${currentPlayer.name} passed.`
    this.moveToNextPlayer()
  }

  public sayUno(playerId: string): void {
    if (this.state.status !== 'PLAYING') {
      return
    }

    const player = this.state.players.find((p) => p.id === playerId)
    if (!player) {
      return
    }

    if (player.hand.length === 1) {
      this.state.unoCalls[playerId] = true
      this.state.lastActionDescription = `${player.name} yelled UNO!`
    }
  }

  public challengeUno(challengerId: string, targetPlayerId: string): void {
    if (this.state.status !== 'PLAYING') {
      return
    }

    const challenger = this.state.players.find((p) => p.id === challengerId)
    const target = this.state.players.find((p) => p.id === targetPlayerId)

    if (!challenger || !target) {
      return
    }

    if (target.hand.length === 1 && !this.state.unoCalls[target.id]) {
      if (this.state.deck.length < 2) {
        this.refillDeck()
      }
      const penaltyCards: UnoCard[] = []
      for (let i = 0; i < 2; i++) {
        const card = this.state.deck.pop()
        if (card) penaltyCards.push(card)
      }
      target.hand.push(...penaltyCards)
      this.state.lastActionDescription = `${challenger.name} successfully challenged ${target.name}! ${target.name} draws 2 penalty cards.`
    }
  }

  public moveToNextPlayer(): void {
    this.state.hasDrawnThisTurn = false
    const totalPlayers = this.state.players.length
    if (this.state.direction === 'clockwise') {
      this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % totalPlayers
    } else {
      this.state.currentPlayerIndex =
        (this.state.currentPlayerIndex - 1 + totalPlayers) % totalPlayers
    }
  }

  public refillDeck(): void {
    const topCard = this.state.discardPile.pop()
    if (!topCard) {
      return
    }

    const discarded = this.state.discardPile
    this.state.discardPile = [topCard]

    const shuffled = this.shuffleDeck(discarded)
    this.state.deck = [...shuffled, ...this.state.deck]
  }

  // AI bot pick color selection helper
  public pickBestColor(hand: UnoCard[]): CardColor {
    return getDominantColor(hand)
  }

  public makeBotDecision(): void {
    const activePlayer = this.state.players[this.state.currentPlayerIndex]
    if (!activePlayer || !activePlayer.isBot || this.state.status !== 'PLAYING') {
      return
    }

    const decision = decideBotMove(
      this.state,
      activePlayer,
      (card) => this.isValidMove(card),
      (topCard, card) => this.canStackOnPenalty(topCard, card),
    )

    if (decision.action === 'chooseColor' && decision.chosenColor) {
      this.chooseWildColor(activePlayer.id, decision.chosenColor)
      return
    }

    if (decision.action === 'play' && decision.cardId) {
      this.playCard(activePlayer.id, decision.cardId)

      if (decision.shouldSayUno) {
        this.sayUno(activePlayer.id)
      }

      if (this.state.selectedWildCard) {
        const bestColor = this.pickBestColor(activePlayer.hand)
        this.chooseWildColor(activePlayer.id, bestColor)
      }
    } else if (decision.action === 'draw') {
      this.drawCard(activePlayer.id)

      // Re-evaluate if drawn card is playable
      const currentActive = this.state.players[this.state.currentPlayerIndex]
      if (currentActive.id === activePlayer.id) {
        const secondDecision = decideBotMove(
          this.state,
          activePlayer,
          (card) => this.isValidMove(card),
          (topCard, card) => this.canStackOnPenalty(topCard, card),
        )

        if (secondDecision.action === 'play' && secondDecision.cardId) {
          this.playCard(activePlayer.id, secondDecision.cardId)
          if (secondDecision.shouldSayUno) {
            this.sayUno(activePlayer.id)
          }
          if (this.state.selectedWildCard) {
            const bestColor = this.pickBestColor(activePlayer.hand)
            this.chooseWildColor(activePlayer.id, bestColor)
          }
        } else {
          this.pass(activePlayer.id)
        }
      }
    } else if (decision.action === 'pass') {
      this.pass(activePlayer.id)
    }
  }
}
