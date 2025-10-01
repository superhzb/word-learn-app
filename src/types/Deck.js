/**
 * Deck model with validation
 * Collection of vocabulary words organized by theme, level, or user preference
 */

export const DECK_CATEGORIES = ['preset', 'imported', 'generated']

export class Deck {
  constructor({
    id = null,
    name = '',
    description = '',
    category = 'imported',
    source = '',
    enabled = true,
    wordCardIds = [],
    createdAt = new Date(),
    updatedAt = new Date()
  } = {}) {
    this.id = id || this.generateId()
    this.name = name
    this.description = description
    this.category = category
    this.source = source
    this.enabled = enabled
    this.wordCardIds = Array.isArray(wordCardIds) ? wordCardIds : []
    this.createdAt = createdAt
    this.updatedAt = updatedAt

    this.validate()
  }

  generateId() {
    return `deck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  validate() {
    const errors = []

    // Required fields
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Deck name is required and cannot be empty')
    }

    if (this.name && this.name.length > 100) {
      errors.push('Deck name must be 100 characters or less')
    }

    if (this.description && this.description.length > 500) {
      errors.push('Deck description must be 500 characters or less')
    }

    // Category validation
    if (!DECK_CATEGORIES.includes(this.category)) {
      errors.push(`Deck category must be one of: ${DECK_CATEGORIES.join(', ')}`)
    }

    if (errors.length > 0) {
      throw new Error(`Deck validation failed: ${errors.join('; ')}`)
    }
  }

  // Computed properties (these would normally be calculated from relations)
  get totalCards() {
    return this.wordCardIds.length
  }

  // Deck management methods
  addWordCard(wordCardId) {
    if (!this.wordCardIds.includes(wordCardId)) {
      this.wordCardIds.push(wordCardId)
      this.updatedAt = new Date()
    }
    return this
  }

  removeWordCard(wordCardId) {
    this.wordCardIds = this.wordCardIds.filter(id => id !== wordCardId)
    this.updatedAt = new Date()
    return this
  }

  toggle() {
    this.enabled = !this.enabled
    this.updatedAt = new Date()
    return this
  }

  updateName(newName) {
    this.name = newName
    this.updatedAt = new Date()
    this.validate()
    return this
  }

  updateDescription(newDescription) {
    this.description = newDescription
    this.updatedAt = new Date()
    this.validate()
    return this
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      source: this.source,
      enabled: this.enabled,
      wordCardIds: this.wordCardIds,
      totalCards: this.totalCards,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }

  static fromJSON(json) {
    return new Deck({
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    })
  }

  // Factory methods for different deck types
  static createPresetDeck(name, description, source, wordCards = []) {
    const deck = new Deck({
      name,
      description,
      category: 'preset',
      source,
      wordCardIds: wordCards.map(card => card.id)
    })
    return deck
  }

  static createImportedDeck(name, description, wordCards = []) {
    const deck = new Deck({
      name,
      description,
      category: 'imported',
      source: 'user-upload',
      wordCardIds: wordCards.map(card => card.id)
    })
    return deck
  }

  static createGeneratedDeck(name, description, generationType, wordCards = []) {
    const deck = new Deck({
      name,
      description,
      category: 'generated',
      source: generationType,
      wordCardIds: wordCards.map(card => card.id)
    })
    return deck
  }
}