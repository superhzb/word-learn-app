import { Deck } from '@/types/Deck'
import { WordCard } from '@/types/WordCard'

export class DeckService {
  constructor() {
    this.decksStore = null
  }

  // Initialize store (called from Vue context)
  initializeStore() {
    if (!this.decksStore) {
      const { useDecksStore } = require('@/stores/decks')
      this.decksStore = useDecksStore()
    }
  }

  async getDeckList() {
    this.initializeStore()
    
    const decks = this.decksStore.decks.map(deck => ({
      id: deck.id,
      name: deck.name,
      description: deck.description,
      category: deck.category,
      enabled: deck.enabled,
      totalCards: deck.totalCards,
      newCardsToday: this.calculateNewCardsToday(deck),
      reviewsDue: this.calculateReviewsDue(deck)
    }))

    return { decks }
  }

  async getDeckById(id) {
    this.initializeStore()
    
    const deckWithCards = this.decksStore.getDeckWithCards(id)
    
    if (!deckWithCards) {
      return { deck: null }
    }

    return { deck: deckWithCards }
  }

  async createDeck(deckData) {
    this.initializeStore()
    
    try {
      // Validate required fields
      if (!deckData.name || !deckData.name.trim()) {
        return { success: false, errors: ['Deck name is required'] }
      }

      if (!deckData.wordCards || !Array.isArray(deckData.wordCards) || deckData.wordCards.length === 0) {
        return { success: false, errors: ['At least one word card is required'] }
      }

      // Create word cards first
      const wordCardIds = []
      const cardErrors = []

      for (let i = 0; i < deckData.wordCards.length; i++) {
        const cardData = deckData.wordCards[i]
        try {
          const result = this.decksStore.addWordCard(cardData)
          if (result.success) {
            wordCardIds.push(result.wordCard.id)
          } else {
            cardErrors.push(`Card ${i + 1}: ${result.errors.join(', ')}`)
          }
        } catch (error) {
          cardErrors.push(`Card ${i + 1}: ${error.message}`)
        }
      }

      if (cardErrors.length > 0) {
        return { success: false, errors: cardErrors }
      }

      // Create the deck
      const result = this.decksStore.addDeck({
        name: deckData.name.trim(),
        description: deckData.description || '',
        category: deckData.category || 'imported',
        source: deckData.source || 'user-created',
        wordCardIds
      })

      return result
    } catch (error) {
      return { success: false, errors: [error.message] }
    }
  }

  async updateDeckSettings(id, settings) {
    this.initializeStore()
    
    try {
      const result = this.decksStore.updateDeckSettings(id, settings)
      return result
    } catch (error) {
      return { success: false, errors: [error.message] }
    }
  }

  async deleteDeck(id) {
    this.initializeStore()
    
    try {
      const result = this.decksStore.deleteDeck(id)
      return result
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  async importFromCSV(csvContent) {
    this.initializeStore()
    
    try {
      const result = this.decksStore.importFromCSV(csvContent)
      return result
    } catch (error) {
      return { success: false, preview: { errors: [error.message] } }
    }
  }

  async getAvailableDecksForStudy() {
    this.initializeStore()
    
    const availableDecks = this.decksStore.getAvailableDecksForStudy
    return { decks: availableDecks }
  }

  // Helper methods
  calculateNewCardsToday(deck) {
    // In a full implementation, this would check progress store
    // For now, estimate based on deck size and difficulty distribution
    const totalCards = deck.totalCards
    if (totalCards === 0) return 0
    
    // Assume 70% of cards are new for fresh decks
    return Math.floor(totalCards * 0.7)
  }

  calculateReviewsDue(deck) {
    // In a full implementation, this would check progress store for due dates
    // For now, simulate some cards being due for review
    const totalCards = deck.totalCards
    if (totalCards === 0) return 0
    
    // Simulate 20% of cards being due for review
    return Math.floor(totalCards * 0.2)
  }

  // Bulk operations
  async createMultipleDecks(decksData) {
    const results = []
    
    for (const deckData of decksData) {
      const result = await this.createDeck(deckData)
      results.push({
        name: deckData.name,
        ...result
      })
    }

    return {
      success: results.every(r => r.success),
      results
    }
  }

  async exportDeck(id, format = 'json') {
    const deckResult = await this.getDeckById(id)
    
    if (!deckResult.deck) {
      return { success: false, error: 'Deck not found' }
    }

    const deck = deckResult.deck
    
    if (format === 'csv') {
      return this.exportDeckAsCSV(deck)
    } else {
      return this.exportDeckAsJSON(deck)
    }
  }

  exportDeckAsCSV(deck) {
    try {
      const headers = ['word', 'translation', 'part_of_speech', 'hint', 'cefr']
      const rows = [headers.join(',')]
      
      deck.wordCards.forEach(card => {
        const row = [
          this.escapeCSV(card.word),
          this.escapeCSV(card.translation),
          this.escapeCSV(card.partOfSpeech),
          this.escapeCSV(card.hint || ''),
          this.escapeCSV(card.cefr || '')
        ]
        rows.push(row.join(','))
      })
      
      return {
        success: true,
        content: rows.join('\n'),
        filename: `${deck.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  exportDeckAsJSON(deck) {
    try {
      const exportData = {
        name: deck.name,
        description: deck.description,
        category: deck.category,
        wordCards: deck.wordCards.map(card => ({
          word: card.word,
          translation: card.translation,
          partOfSpeech: card.partOfSpeech,
          hint: card.hint,
          cefr: card.cefr,
          tags: card.tags
        })),
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
      
      return {
        success: true,
        content: JSON.stringify(exportData, null, 2),
        filename: `${deck.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  escapeCSV(field) {
    if (!field) return ''
    const fieldStr = String(field)
    if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
      return `"${fieldStr.replace(/"/g, '""')}"`
    }
    return fieldStr
  }
}

// Export singleton instance
export const deckService = new DeckService()