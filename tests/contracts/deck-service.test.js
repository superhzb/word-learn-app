import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DeckService } from '@/services/DeckService'

describe('DeckService Contract', () => {
  let deckService

  beforeEach(() => {
    localStorage.clear()
    deckService = new DeckService()
  })

  describe('getDeckList', () => {
    it('should return all available decks with metadata', async () => {
      const result = await deckService.getDeckList()
      
      expect(result).toHaveProperty('decks')
      expect(Array.isArray(result.decks)).toBe(true)
      
      if (result.decks.length > 0) {
        const deck = result.decks[0]
        expect(deck).toHaveProperty('id')
        expect(deck).toHaveProperty('name')
        expect(deck).toHaveProperty('description')
        expect(deck).toHaveProperty('category')
        expect(deck).toHaveProperty('enabled')
        expect(deck).toHaveProperty('totalCards')
        expect(deck).toHaveProperty('newCardsToday')
        expect(deck).toHaveProperty('reviewsDue')
        expect(['preset', 'imported', 'generated']).toContain(deck.category)
      }
    })
  })

  describe('getDeckById', () => {
    it('should return detailed deck information with word cards', async () => {
      // This test will fail until implementation exists
      const result = await deckService.getDeckById('test-deck-id')
      
      expect(result).toHaveProperty('deck')
      expect(result.deck).toHaveProperty('id')
      expect(result.deck).toHaveProperty('name')
      expect(result.deck).toHaveProperty('wordCards')
      expect(Array.isArray(result.deck.wordCards)).toBe(true)
    })

    it('should handle non-existent deck ID', async () => {
      const result = await deckService.getDeckById('non-existent-id')
      expect(result.deck).toBeNull()
    })
  })

  describe('createDeck', () => {
    it('should create new deck from valid input', async () => {
      const deckData = {
        name: 'Test Deck',
        description: 'A test deck',
        category: 'imported',
        wordCards: [
          { word: 'test', translation: 'test', partOfSpeech: 'noun' }
        ]
      }

      const result = await deckService.createDeck(deckData)
      
      expect(result).toHaveProperty('success')
      expect(result.success).toBe(true)
      expect(result).toHaveProperty('deck')
      expect(result.deck.name).toBe('Test Deck')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        description: 'Missing name',
        category: 'imported'
      }

      const result = await deckService.createDeck(invalidData)
      
      expect(result.success).toBe(false)
      expect(result).toHaveProperty('errors')
      expect(Array.isArray(result.errors)).toBe(true)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('importFromCSV', () => {
    it('should parse valid CSV content', async () => {
      const csvContent = 'word,translation,part_of_speech\nbonjour,hello,interjection\nmerci,thank you,interjection'
      
      const result = await deckService.importFromCSV(csvContent)
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('preview')
      expect(result.preview).toHaveProperty('validRows')
      expect(result.preview).toHaveProperty('sampleCards')
      expect(result.preview.validRows).toBe(2)
    })

    it('should handle CSV with errors', async () => {
      const csvContent = 'word,translation\nbonjour\n,empty word'
      
      const result = await deckService.importFromCSV(csvContent)
      
      expect(result).toHaveProperty('preview')
      expect(result.preview).toHaveProperty('errors')
      expect(result.preview.errors.length).toBeGreaterThan(0)
    })
  })

  describe('updateDeckSettings', () => {
    it('should update deck configuration', async () => {
      const result = await deckService.updateDeckSettings('test-id', {
        name: 'Updated Name',
        enabled: false
      })
      
      expect(result).toHaveProperty('success')
    })
  })

  describe('deleteDeck', () => {
    it('should remove deck and associated progress', async () => {
      const result = await deckService.deleteDeck('test-id')
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
    })
  })

  describe('getAvailableDecksForStudy', () => {
    it('should return enabled decks with available cards', async () => {
      const result = await deckService.getAvailableDecksForStudy()
      
      expect(result).toHaveProperty('decks')
      expect(Array.isArray(result.decks)).toBe(true)
      
      if (result.decks.length > 0) {
        const deck = result.decks[0]
        expect(deck).toHaveProperty('id')
        expect(deck).toHaveProperty('name')
        expect(deck).toHaveProperty('newCards')
        expect(deck).toHaveProperty('reviewsDue')
        expect(deck).toHaveProperty('totalAvailable')
      }
    })
  })
})