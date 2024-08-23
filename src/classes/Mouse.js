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

    validateMove(newCard) {
        if (newCard === this.card) {
            return false
        }

        if (this.isDisabled) {
            return false
        }

        if (this.disableCard.includes(newCard)) {
            return false
        }

        if (newCard.mouse && newCard.mouse.faction === this.faction) {
            return false
        }

        return true
    }

    /**
     * 
     * @param {Card} newCard 
     */
    moveTo(newCard) {
        if (!this.validateMove(newCard)) return

        newCard.isReveal = true

        setTimeout(() => {
            this.card.mouse = null
            this.card = newCard
        }, 350)
    }
}