import Mouse from './Mouse'

export default class Card {
  static #nextId = 0

  /**
   *
   * @param {'plate' | 'cat' | 'peanut' |
   * 'spring' | 'glue' | 'cheddar-cheese' |
   *  'gouda-cheese' | 'swiss-cheese'} type
   */
  constructor(type) {
    this.id = Card.#nextId++
    this.type = type
    this.isReveal = false

    this._mouse = null
  }

  /** @type {Mouse} */
  get mouse() {
    return this._mouse
  }

  /**
   * @param {Mouse} newMouse
   * */
  set mouse(newMouse) {
    if (this._mouse !== newMouse) {
      this._mouse = newMouse
      if (newMouse && newMouse.card !== this) {
        newMouse.card = this
      }
    }
  }

  static resetId() {
    Card.#nextId = 0
  }
}
