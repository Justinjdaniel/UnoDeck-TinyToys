import React from 'react'
import { GameLayout } from './layout/GameLayout'
import { type UnoGameState, type UnoCard, type CardColor } from '../engine/unoEngine'

interface BoardProps {
  gameState: UnoGameState
  isMuted: boolean
  volume: number
  handleVolumeChange: (volume: number) => void
  toggleMute: () => void
  ruleModalOpen?: boolean
  setRuleModalOpen?: (open: boolean) => void
  handlePlayCard: (cardId: string) => void
  handleDrawCard: () => void
  handleSayUno: () => void
  handleChallenge: (targetPlayerId: string) => void
  handleChooseColor: (color: CardColor) => void
  handleInitGame: () => void
  isValidPlay: (card: UnoCard) => boolean
  handleQuitMatch?: () => void
}

export const Board: React.FC<BoardProps> = (props) => {
  return <GameLayout {...props} handleQuitMatch={props.handleQuitMatch || props.handleInitGame} />
}
