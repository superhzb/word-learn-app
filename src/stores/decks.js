import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Deck } from '@/types/Deck'
import { WordCard } from '@/types/WordCard'

export const useDecksStore = defineStore('decks', () => {
  // State
  const decks = ref(new Map())
  const wordCards = ref(new Map())

  // Getters
  const allDecks = computed(() => Array.from(decks.value.values()))
  const enabledDecks = computed(() => 
    allDecks.value.filter(deck => deck.enabled)
  )

  const getDeckWithCards = computed(() => (deckId) => {
    const deck = decks.value.get(deckId)
    if (!deck) return null

    const cards = deck.wordCardIds.map(cardId => wordCards.value.get(cardId)).filter(Boolean)
    return { ...deck, wordCards: cards }
  })

  const getAvailableDecksForStudy = computed(() => {
    return enabledDecks.value
      .map(deck => {
        const cards = deck.wordCardIds.map(id => wordCards.value.get(id)).filter(Boolean)
        const newCards = cards.filter(card => card.difficulty === 'new')
        
        // For prototype, we'll simulate reviews due based on difficulty
        const reviewsDue = cards.filter(card => 
          card.difficulty !== 'new' && Math.random() > 0.7 // Simulate 30% due for review
        )

        return {
          id: deck.id,
          name: deck.name,
          newCards: newCards.length,
          reviewsDue: reviewsDue.length,
          totalAvailable: cards.length
        }
      })
      .filter(deck => deck.totalAvailable > 0)
  })

  // Actions
  function addDeck(deckData) {
    try {
      const deck = new Deck(deckData)
      decks.value.set(deck.id, deck)
      saveDecksToPersistence()
      return { success: true, deck }
    } catch (error) {
      return { success: false, errors: [error.message] }
    }
  }

  function addWordCard(wordCardData) {
    try {
      const wordCard = new WordCard(wordCardData)
      wordCards.value.set(wordCard.id, wordCard)
      saveWordCardsToPersistence()
      return { success: true, wordCard }
    } catch (error) {
      return { success: false, errors: [error.message] }
    }
  }

  function updateDeckSettings(deckId, settings) {
    try {
      const deck = decks.value.get(deckId)
      if (!deck) {
        return { success: false, errors: ['Deck not found'] }
      }

      if (settings.name !== undefined) deck.updateName(settings.name)
      if (settings.description !== undefined) deck.updateDescription(settings.description)
      if (settings.enabled !== undefined) {
        deck.enabled = settings.enabled
        deck.updatedAt = new Date()
      }

      decks.value.set(deckId, deck)
      saveDecksToPersistence()
      return { success: true }
    } catch (error) {
      return { success: false, errors: [error.message] }
    }
  }

  function deleteDeck(deckId) {
    const deck = decks.value.get(deckId)
    if (!deck) {
      return { success: false, message: 'Deck not found' }
    }

    // Remove all associated word cards
    deck.wordCardIds.forEach(cardId => {
      wordCards.value.delete(cardId)
    })

    decks.value.delete(deckId)
    saveDecksToPersistence()
    saveWordCardsToPersistence()
    
    return { success: true, message: 'Deck deleted successfully' }
  }

  function importFromCSV(csvContent) {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim())
      if (lines.length < 2) {
        return { success: false, preview: { errors: ['CSV must have header and data rows'] } }
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const requiredHeaders = ['word', 'translation']
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      if (missingHeaders.length > 0) {
        return { 
          success: false, 
          preview: { 
            errors: [`Missing required columns: ${missingHeaders.join(', ')}`] 
          } 
        }
      }

      const errors = []
      const validCards = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const rowData = {}
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || ''
        })

        try {
          const card = WordCard.createFromCSV(rowData)
          validCards.push(card)
        } catch (error) {
          errors.push({ row: i, field: 'general', message: error.message })
        }
      }

      return {
        success: true,
        preview: {
          validRows: validCards.length,
          invalidRows: errors.length,
          sampleCards: validCards.slice(0, 3),
          errors
        }
      }
    } catch (error) {
      return { success: false, preview: { errors: [error.message] } }
    }
  }

  // Persistence
  function saveDecksToPersistence() {
    const decksData = Array.from(decks.value.values()).map(deck => deck.toJSON())
    localStorage.setItem('word-app-decks', JSON.stringify(decksData))
  }

  function saveWordCardsToPersistence() {
    const cardsData = Array.from(wordCards.value.values()).map(card => card.toJSON())
    localStorage.setItem('word-app-cards', JSON.stringify(cardsData))
  }

  function loadFromPersistence() {
    // Load decks
    const decksData = JSON.parse(localStorage.getItem('word-app-decks') || '[]')
    decks.value.clear()
    decksData.forEach(deckData => {
      const deck = Deck.fromJSON(deckData)
      decks.value.set(deck.id, deck)
    })

    // Load word cards
    const cardsData = JSON.parse(localStorage.getItem('word-app-cards') || '[]')
    wordCards.value.clear()
    cardsData.forEach(cardData => {
      const card = WordCard.fromJSON(cardData)
      wordCards.value.set(card.id, card)
    })
  }

  function initializeWithSampleData() {
    if (decks.value.size > 0) return // Already has data

    // Create comprehensive French A1 deck with 30 cards
    const frenchA1Words = [
      // Greetings & Basic Expressions (5)
      { word: 'bonjour', translation: 'hello', partOfSpeech: 'interjection', hint: 'common greeting', cefr: 'A1' },
      { word: 'merci', translation: 'thank you', partOfSpeech: 'interjection', hint: 'polite expression', cefr: 'A1' },
      { word: 'au revoir', translation: 'goodbye', partOfSpeech: 'interjection', hint: 'farewell', cefr: 'A1' },
      { word: 'oui', translation: 'yes', partOfSpeech: 'adverb', hint: 'affirmative response', cefr: 'A1' },
      { word: 'non', translation: 'no', partOfSpeech: 'adverb', hint: 'negative response', cefr: 'A1' },
      
      // Basic Nouns (10)
      { word: 'chat', translation: 'cat', partOfSpeech: 'noun', hint: 'domestic feline', cefr: 'A1' },
      { word: 'chien', translation: 'dog', partOfSpeech: 'noun', hint: 'man\'s best friend', cefr: 'A1' },
      { word: 'eau', translation: 'water', partOfSpeech: 'noun', hint: 'essential liquid', cefr: 'A1' },
      { word: 'pain', translation: 'bread', partOfSpeech: 'noun', hint: 'daily staple food', cefr: 'A1' },
      { word: 'livre', translation: 'book', partOfSpeech: 'noun', hint: 'for reading', cefr: 'A1' },
      { word: 'maison', translation: 'house', partOfSpeech: 'noun', hint: 'place to live', cefr: 'A1' },
      { word: 'voiture', translation: 'car', partOfSpeech: 'noun', hint: 'vehicle for transport', cefr: 'A1' },
      { word: 'école', translation: 'school', partOfSpeech: 'noun', hint: 'place of learning', cefr: 'A1' },
      { word: 'ami', translation: 'friend', partOfSpeech: 'noun', hint: 'close companion', cefr: 'A1' },
      { word: 'famille', translation: 'family', partOfSpeech: 'noun', hint: 'relatives together', cefr: 'A1' },
      
      // Colors & Adjectives (5)
      { word: 'rouge', translation: 'red', partOfSpeech: 'adjective', hint: 'color like blood', cefr: 'A1' },
      { word: 'bleu', translation: 'blue', partOfSpeech: 'adjective', hint: 'color like sky', cefr: 'A1' },
      { word: 'vert', translation: 'green', partOfSpeech: 'adjective', hint: 'color like grass', cefr: 'A1' },
      { word: 'grand', translation: 'big', partOfSpeech: 'adjective', hint: 'opposite of small', cefr: 'A1' },
      { word: 'petit', translation: 'small', partOfSpeech: 'adjective', hint: 'opposite of big', cefr: 'A1' },
      
      // Common Verbs (5)
      { word: 'être', translation: 'to be', partOfSpeech: 'verb', hint: 'most important verb', cefr: 'A1' },
      { word: 'avoir', translation: 'to have', partOfSpeech: 'verb', hint: 'auxiliary verb', cefr: 'A1' },
      { word: 'aller', translation: 'to go', partOfSpeech: 'verb', hint: 'movement verb', cefr: 'A1' },
      { word: 'faire', translation: 'to do/make', partOfSpeech: 'verb', hint: 'action verb', cefr: 'A1' },
      { word: 'voir', translation: 'to see', partOfSpeech: 'verb', hint: 'perception verb', cefr: 'A1' },
      
      // Numbers & Time (5)
      { word: 'un', translation: 'one', partOfSpeech: 'number', hint: 'first number', cefr: 'A1' },
      { word: 'deux', translation: 'two', partOfSpeech: 'number', hint: 'second number', cefr: 'A1' },
      { word: 'trois', translation: 'three', partOfSpeech: 'number', hint: 'third number', cefr: 'A1' },
      { word: 'aujourd\'hui', translation: 'today', partOfSpeech: 'adverb', hint: 'this day', cefr: 'A1' },
      { word: 'demain', translation: 'tomorrow', partOfSpeech: 'adverb', hint: 'next day', cefr: 'A1' },
    ]

    // Add word cards
    const cardIds = frenchA1Words.map(wordData => {
      const result = addWordCard(wordData)
      return result.success ? result.wordCard.id : null
    }).filter(Boolean)

    // Create deck
    addDeck({
      name: 'French A1 - Essential Vocabulary',
      description: 'Complete set of 30 essential French words for absolute beginners',
      category: 'preset',
      source: 'french-a1-complete',
      wordCardIds: cardIds
    })

    // Create a second smaller deck for variety
    const basicGreetings = [
      { word: 'salut', translation: 'hi/bye', partOfSpeech: 'interjection', hint: 'informal greeting', cefr: 'A1' },
      { word: 'bonsoir', translation: 'good evening', partOfSpeech: 'interjection', hint: 'evening greeting', cefr: 'A1' },
      { word: 's\'il vous plaît', translation: 'please', partOfSpeech: 'interjection', hint: 'polite request', cefr: 'A1' },
      { word: 'excusez-moi', translation: 'excuse me', partOfSpeech: 'interjection', hint: 'polite interruption', cefr: 'A1' },
      { word: 'pardon', translation: 'sorry', partOfSpeech: 'interjection', hint: 'apology', cefr: 'A1' },
    ]

    const greetingCardIds = basicGreetings.map(wordData => {
      const result = addWordCard(wordData)
      return result.success ? result.wordCard.id : null
    }).filter(Boolean)

    addDeck({
      name: 'French Greetings',
      description: 'Polite expressions for social interactions',
      category: 'preset',
      source: 'french-greetings',
      wordCardIds: greetingCardIds,
      enabled: false // Disabled by default to focus on main deck
    })
  }

  return {
    // State
    decks: allDecks,
    enabledDecks,
    
    // Getters
    getDeckWithCards,
    getAvailableDecksForStudy,
    
    // Actions
    addDeck,
    addWordCard,
    updateDeckSettings,
    deleteDeck,
    importFromCSV,
    loadFromPersistence,
    initializeWithSampleData
  }
})