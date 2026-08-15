import { type UnoGameState, type UnoCard, type CardColor, type Player } from './unoEngine'

export type GameMode = 'VS_BOT' | 'LOCAL_PASS_PLAY'

export interface BotDecision {
  action: 'play' | 'draw' | 'pass' | 'chooseColor'
  cardId?: string
  chosenColor?: CardColor
  shouldSayUno?: boolean
}

/**
 * Calculates the dominant color in a player's hand (excluding Wild cards).
 * Returns the color with the maximum count, defaulting to 'Red' if hand is empty or has only Wilds.
 */
export function getDominantColor(hand: UnoCard[]): CardColor {
  const colors: ('Red' | 'Blue' | 'Green' | 'Yellow')[] = ['Red', 'Blue', 'Green', 'Yellow']
  const counts: Record<CardColor, number> = {
    Red: 0,
    Blue: 0,
    Green: 0,
    Yellow: 0,
    Wild: 0,
  }

  for (const card of hand) {
    if (card.color !== 'Wild') {
      counts[card.color]++
    }
  }

  let maxCount = -1
  let dominantColor: CardColor = 'Red'

  for (const color of colors) {
    if (counts[color] > maxCount) {
      maxCount = counts[color]
      dominantColor = color
    }
  }

  return dominantColor
}

/**
 * Calculates next player index in turn order based on direction and player count.
 */
export function getNextPlayerIndex(
  currentIndex: number,
  totalPlayers: number,
  direction: 'clockwise' | 'counter-clockwise',
): number {
  if (direction === 'clockwise') {
    return (currentIndex + 1) % totalPlayers
  } else {
    return (currentIndex - 1 + totalPlayers) % totalPlayers
  }
}

/**
 * Generates realistic random bot thinking delay between 800ms and 1200ms.
 */
export function getBotThinkingDelay(minMs: number = 800, maxMs: number = 1200): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}

/**
 * Heuristic Decision Tree Algorithm for Bot AI:
 *
 * 1. If active wild card requires color choice -> Select dominant color in bot's hand.
 * 2. If active draw penalty > 0 -> Must stack matching penalty card (Draw2 / WildDraw4) if available.
 * 3. Find playable non-wild matching cards (matching color or value).
 * 4. Check if next opponent is in a dangerous position (hand size <= 2):
 *    - If opponent <= 2 cards, aggressively prioritize Draw2 / Skip / Reverse to disrupt opponent.
 * 5. Priority ranking:
 *    - Play matching non-wild card (saving Wild cards for emergency).
 *    - Play Wild cards only when no matching color/number non-wild cards exist.
 * 6. Auto-trigger "UNO!" call when bot plays a card that reduces hand to 1 card (i.e. hand size was 2).
 * 7. If no playable cards:
 *    - If not drawn yet: draw a card.
 *    - If already drawn this turn: pass.
 */
export function decideBotMove(
  gameState: UnoGameState,
  botPlayer: Player,
  isValidMoveFn: (card: UnoCard) => boolean,
  canStackOnPenaltyFn: (topCard: UnoCard, card: UnoCard) => boolean,
): BotDecision {
  const topCard =
    gameState.discardPile.length > 0
      ? gameState.discardPile[gameState.discardPile.length - 1]
      : null

  // 1. Color choice pending for wild card
  if (
    gameState.selectedWildCard &&
    gameState.players[gameState.currentPlayerIndex]?.id === botPlayer.id
  ) {
    const chosenColor = getDominantColor(botPlayer.hand)
    return {
      action: 'chooseColor',
      chosenColor,
    }
  }

  // 2. Penalty stacking check
  if (gameState.activeDrawPenalty > 0 && topCard) {
    const stackableCard = botPlayer.hand.find((card) => canStackOnPenaltyFn(topCard, card))
    if (stackableCard) {
      const shouldSayUno = botPlayer.hand.length === 2
      return {
        action: 'play',
        cardId: stackableCard.id,
        shouldSayUno,
      }
    }
  }

  // Find all playable cards using validity rules
  const playableCards = botPlayer.hand.filter((card) => {
    if (gameState.activeDrawPenalty > 0 && topCard) {
      return canStackOnPenaltyFn(topCard, card)
    }
    return isValidMoveFn(card)
  })

  if (playableCards.length > 0) {
    // Separate non-wild vs wild cards
    const nonWildPlayable = playableCards.filter((c) => c.color !== 'Wild')
    const wildPlayable = playableCards.filter((c) => c.color === 'Wild')

    const nextPlayerIndex = getNextPlayerIndex(
      gameState.currentPlayerIndex,
      gameState.players.length,
      gameState.direction,
    )
    const nextPlayer = gameState.players[nextPlayerIndex]
    const opponentInDanger = nextPlayer && nextPlayer.hand.length <= 2

    let chosenCard: UnoCard | null = null

    if (opponentInDanger) {
      // Aggressively use Draw2, Skip, Reverse or WildDraw4 if available
      const actionCard = nonWildPlayable.find(
        (c) => c.value === 'Draw2' || c.value === 'Skip' || c.value === 'Reverse',
      )
      if (actionCard) {
        chosenCard = actionCard
      } else if (wildPlayable.length > 0) {
        const wildDraw4 = wildPlayable.find((c) => c.value === 'WildDraw4')
        if (wildDraw4) {
          chosenCard = wildDraw4
        }
      }
    }

    if (!chosenCard) {
      if (nonWildPlayable.length > 0) {
        // High priority: match active color or value with non-wild card
        const activeColor = gameState.wildColorSelected || (topCard ? topCard.color : null)
        const matchingColorCard = nonWildPlayable.find((c) => c.color === activeColor)
        const matchingValueCard = nonWildPlayable.find((c) => topCard && c.value === topCard.value)

        chosenCard = matchingColorCard || matchingValueCard || nonWildPlayable[0]
      } else if (wildPlayable.length > 0) {
        // Save Wild cards for emergency (only play when no matching non-wild cards exist)
        chosenCard = wildPlayable[0]
      }
    }

    if (chosenCard) {
      const shouldSayUno = botPlayer.hand.length === 2
      return {
        action: 'play',
        cardId: chosenCard.id,
        shouldSayUno,
      }
    }
  }

  // 3. Draw or Pass if no valid play
  if (gameState.hasDrawnThisTurn) {
    return { action: 'pass' }
  } else {
    return { action: 'draw' }
  }
}
