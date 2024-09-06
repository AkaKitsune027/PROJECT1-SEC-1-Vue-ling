import { timeout } from "@/libs/utils"
import Card from "./Card"

export default class Mouse {
  static #nextId = 0

  /**
   *
   * @param {'white' | 'black'} faction
   * @param {'king' | 'soldier'} type
   */
  constructor(faction, type) {
    this.id = "m" + Mouse.#nextId++
    this.faction = faction
    this.type = type
    this.isDisabled = false
    this.isStuck = false
    this.disableCards = []

    this._card = null
  }

  /**
   * @type {Card}
   */
  get card() {
    return this._card
  }

  /**
   * @param {Card} newCard
   */
  set card(newCard) {
    if (this._card !== newCard) {
      this._card = newCard
      if (newCard && newCard.mouse !== this) {
        newCard.mouse = this // Link back to this mouse from the card
      }
    }
  }

  /**
   * List of card IDs that this mouse can move to
   */
  get availableMoves() {
    if (!this.card) return []

    const boardSize = 6
    const moves = []

    // Horizontal moves
    if (this.card.id % boardSize !== 0) moves.push(this.card.id - 1)
    if (this.card.id % boardSize !== boardSize - 1) moves.push(this.card.id + 1)

    // Vertical moves
    if (this.card.id - boardSize >= 0) moves.push(this.card.id - boardSize)
    if (this.card.id + boardSize < boardSize * boardSize)
      moves.push(this.card.id + boardSize)

    // Diagonal moves
    if (this.card.id % boardSize !== 0 && this.card.id - boardSize >= 0)
      moves.push(this.card.id - boardSize - 1)
    if (
      this.card.id % boardSize !== boardSize - 1 &&
      this.card.id - boardSize >= 0
    )
      moves.push(this.card.id - boardSize + 1)
    if (
      this.card.id % boardSize !== 0 &&
      this.card.id + boardSize < boardSize * boardSize
    )
      moves.push(this.card.id + boardSize - 1)
    if (
      this.card.id % boardSize !== boardSize - 1 &&
      this.card.id + boardSize < boardSize * boardSize
    )
      moves.push(this.card.id + boardSize + 1)

    return moves
  }

  /**
   * This function checks if the mouse can move to the new card
   * @param {Card} newCard - The card that the mouse wants to move to
   * @returns
   */
  validateMove(newCard) {
    if (newCard === this.card) {
      return false
    }

    if (!this.availableMoves.includes(newCard.id)) {
      return false
    }

    if (this.isDisabled) {
      return false
    }

    if (this.isStuck) {
      return false
    }

    if (this.disableCards.includes(newCard)) {
      return false
    }

    if (newCard.mouse && newCard.mouse.faction === this.faction) {
      return false
    }

    return true
  }

  /**
   * This function moves the mouse to the new card
   * @param {Card} newCard - The card that the mouse wants to move to
   */
  async moveTo(newCard) {
    if (!this.validateMove(newCard)) return false

    newCard.isReveal = true

    await timeout(350)

    this.card.mouse = null
    this.card = newCard

    return true
  }
}
