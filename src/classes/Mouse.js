import { Card } from "./Card"

export class Mouse {
    static nextId = 0

    /**
     * 
     * @param {'white' | 'black'} faction 
     * @param {'king' | 'soldier'} type
     */
    constructor(faction, type) {
        this.id = 'm' + Mouse.nextId++
        this.faction = faction
        this.type = type
        this.isDisabled = false
        this.isStucked = false
        this.disableCard = []

        this._card = null  // Internal property to store the card reference
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
     * 
     * @param {Card} card 
     */
    moveTo(card) {
        this.card = card
    }
}