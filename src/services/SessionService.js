import { StudySession } from '@/types/StudySession'
import { ConfusingWordGroup, FRENCH_CONFUSING_GROUPS } from '@/types/ConfusingWordGroup'
import { useDecksStore } from '@/stores/decks'
import { useProgressStore } from '@/stores/progress'

export class SessionService {
  constructor() {
    this.currentSession = null
    this.decksStore = null
    this.progressStore = null
  }

  // Initialize stores (called from Vue context)
  initializeStores() {
    if (!this.decksStore) {
      this.decksStore = useDecksStore()
    }
    if (!this.progressStore) {
      this.progressStore = useProgressStore()
    }
  }

  async createSession(config) {
    try {
      this.initializeStores()

      const { deckIds, roundSize = 50, newReviewRatio = 50, sessionType = 'mixed' } = config

      // Validate deck IDs
      if (!deckIds || deckIds.length === 0) {
        return { success: false, error: 'No decks selected for study' }
      }

      // Get word cards from selected decks
      const allCards = []
      for (const deckId of deckIds) {
        const deckWithCards = this.decksStore.getDeckWithCards(deckId)
        if (deckWithCards?.wordCards) {
          allCards.push(...deckWithCards.wordCards.map(card => ({
            ...card,
            deckId,
            difficulty: this.getWordDifficulty(card.id)
          })))
        }
      }

      if (allCards.length === 0) {
        return { success: false, error: 'No cards available in selected decks' }
      }

      // Create new session
      this.currentSession = new StudySession({
        deckIds,
        roundSize,
        newReviewRatio,
        sessionType
      })

      // Initialize session with cards
      this.currentSession.initializeCards(allCards)

      // Estimate time
      const estimatedTime = Math.round((this.currentSession.totalCards * 3) / 60) // 3 seconds per card average

      // Save session to persistence
      this.saveSessionToPersistence()

      return {
        success: true,
        session: {
          id: this.currentSession.id,
          totalCards: this.currentSession.totalCards,
          totalRounds: this.currentSession.totalRounds,
          estimatedTime
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getNextCard() {
    try {
      if (!this.currentSession) {
        return { type: 'session-complete', sessionSummary: null }
      }

      // Check for retry cards first
      const retryCards = this.currentSession.getRetryCards()
      const readyRetryCards = retryCards.filter(retry => retry.isReady)
      
      if (readyRetryCards.length > 0) {
        // Return retry card
        const retryCard = readyRetryCards[0]
        const card = this.currentSession.sessionCards.find(c => c.id === retryCard.cardId)
        
        if (card) {
          return {
            type: 'single',
            data: {
              cards: [card],
              progress: {
                currentPosition: this.currentSession.cardsCompleted + 1,
                totalCards: this.currentSession.totalCards,
                roundProgress: (this.currentSession.cardsCompleted % this.currentSession.roundSize) + 1,
                roundTotal: this.currentSession.roundSize
              },
              isRetry: true
            }
          }
        }
      }

      // Check if session is complete
      if (this.currentSession.isComplete) {
        const summary = this.generateSessionSummary()
        return { type: 'session-complete', sessionSummary: summary }
      }

      // Get current card
      const currentCard = this.currentSession.currentCard
      if (!currentCard) {
        const summary = this.generateSessionSummary()
        return { type: 'session-complete', sessionSummary: summary }
      }

      // Check if this card should be in comparison mode
      const comparisonGroup = this.getComparisonGroup(currentCard)
      
      if (comparisonGroup && comparisonGroup.length > 1) {
        return {
          type: 'comparison',
          data: {
            cards: comparisonGroup,
            progress: {
              currentPosition: this.currentSession.cardsCompleted + 1,
              totalCards: this.currentSession.totalCards,
              roundProgress: (this.currentSession.cardsCompleted % this.currentSession.roundSize) + 1,
              roundTotal: this.currentSession.roundSize
            }
          }
        }
      }

      // Return single card
      return {
        type: 'single',
        data: {
          cards: [currentCard],
          progress: {
            currentPosition: this.currentSession.cardsCompleted + 1,
            totalCards: this.currentSession.totalCards,
            roundProgress: (this.currentSession.cardsCompleted % this.currentSession.roundSize) + 1,
            roundTotal: this.currentSession.roundSize
          }
        }
      }
    } catch (error) {
      return { type: 'error', error: error.message }
    }
  }

  async recordCardResult(cardId, result) {
    try {
      this.initializeStores()

      if (!this.currentSession) {
        return { success: false, error: 'No active session' }
      }

      const { action, responseTime = 0, sessionType = 'normal' } = result

      // Record in session
      this.currentSession.recordCardResult(cardId, action, responseTime)

      // Record in progress store
      const progressResult = this.progressStore.recordWordReview(cardId, action, responseTime)

      // Handle 10-minute rule for failed cards
      let retryInfo = null
      if (action === 'not-remember') {
        this.currentSession.scheduleRetry(cardId, 10)
        retryInfo = { retryIn: 10 }
      }

      // Save session state
      this.saveSessionToPersistence()

      return {
        success: true,
        nextReview: progressResult.nextReview,
        retryIn: retryInfo?.retryIn || null
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async pauseSession() {
    try {
      if (!this.currentSession) {
        return { success: false, error: 'No active session' }
      }

      this.currentSession.pauseSession()
      this.saveSessionToPersistence()

      return { success: true, resumeToken: this.currentSession.id }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async resumeSession(resumeToken = null) {
    try {
      // Load session from persistence
      const sessionData = this.loadSessionFromPersistence()
      
      if (!sessionData) {
        return { success: false, error: 'No session to resume' }
      }

      this.currentSession = StudySession.fromJSON(sessionData)
      
      if (resumeToken && this.currentSession.id !== resumeToken) {
        return { success: false, error: 'Invalid resume token' }
      }

      this.currentSession.resumeSession()

      // Check for retry cards
      const retryCards = this.currentSession.getRetryCards()
      
      return {
        success: true,
        session: this.currentSession.toJSON(),
        hasRetryCards: retryCards.length > 0,
        retryCards: retryCards.map(retry => ({
          cardId: retry.cardId,
          availableAt: retry.scheduledFor
        }))
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async completeSession() {
    try {
      if (!this.currentSession) {
        return { summary: this.getDefaultSummary() }
      }

      this.currentSession.completeSession()
      const summary = this.generateSessionSummary()

      // Clear session from persistence
      this.clearSessionFromPersistence()
      this.currentSession = null

      return { summary }
    } catch (error) {
      return { summary: this.getDefaultSummary(), error: error.message }
    }
  }

  async undoLastAction() {
    try {
      if (!this.currentSession) {
        return { success: false, message: 'No active session' }
      }

      const undoResult = this.currentSession.undoLastAction()
      
      if (undoResult.success) {
        this.saveSessionToPersistence()
        
        const restoredCard = this.currentSession.currentCard
        return {
          success: true,
          restoredCard: {
            cardId: restoredCard?.id || null,
            previousResult: null // Could track this in future
          }
        }
      }

      return undoResult
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  async getRetryCards() {
    try {
      if (!this.currentSession) {
        return { retryCards: [] }
      }

      const retryCards = this.currentSession.getRetryCards()
      
      return {
        retryCards: retryCards.map(retry => ({
          cardId: retry.cardId,
          word: this.getWordFromCard(retry.cardId),
          availableAt: retry.scheduledFor,
          remainingTime: retry.remainingTime
        }))
      }
    } catch (error) {
      return { retryCards: [] }
    }
  }

  async skipRetryWait(cardId = null) {
    try {
      if (!this.currentSession) {
        return { success: false, cardsReady: 0 }
      }

      const beforeCount = this.currentSession.retryCards.length
      this.currentSession.skipRetryWait(cardId)
      const afterCount = this.currentSession.retryCards.length
      
      this.saveSessionToPersistence()

      return {
        success: true,
        cardsReady: beforeCount - afterCount
      }
    } catch (error) {
      return { success: false, cardsReady: 0, error: error.message }
    }
  }

  async calculateNextReview(progress, result) {
    try {
      // Create a temporary progress entry for calculation
      const tempEntry = new (await import('@/types/ProgressEntry')).ProgressEntry({
        wordId: 'temp',
        reviewCount: progress.reviewCount || 0,
        easeFactor: progress.easeFactor || 2.5,
        currentInterval: progress.currentInterval || 1,
        lastResult: progress.lastResult
      })

      // Calculate next review
      tempEntry.calculateNextReview(result)

      return {
        nextInterval: tempEntry.currentInterval,
        nextReviewDate: tempEntry.nextReviewDate,
        newEaseFactor: tempEntry.easeFactor,
        difficulty: tempEntry.difficulty
      }
    } catch (error) {
      // Fallback calculation
      const interval = result === 'remember' 
        ? Math.max(1, (progress.currentInterval || 1) * 2)
        : 1
        
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + interval)

      return {
        nextInterval: interval,
        nextReviewDate: nextDate,
        newEaseFactor: progress.easeFactor || 2.5,
        difficulty: interval <= 3 ? 'hard' : interval <= 7 ? 'medium' : 'easy'
      }
    }
  }

  // Helper methods
  getWordDifficulty(wordId) {
    this.initializeStores()
    const progress = this.progressStore.getProgressForWord(wordId)
    return progress?.difficulty || 'new'
  }

  getComparisonGroup(card) {
    // Check if current card is part of any predefined confusing group
    for (const groupDef of FRENCH_CONFUSING_GROUPS) {
      if (groupDef.words.includes(card.word)) {
        // Find other cards in session that are part of this group
        const groupCards = this.currentSession.sessionCards.filter(sessionCard => 
          groupDef.words.includes(sessionCard.word)
        )
        
        // Only return comparison if we have multiple cards from the group
        if (groupCards.length >= 2) {
          return groupCards
        }
      }
    }
    
    // Check for user-defined groups (placeholder for future implementation)
    // Could check stored ConfusingWordGroup instances here
    
    return null
  }

  generateSessionSummary() {
    if (!this.currentSession) return this.getDefaultSummary()

    const stats = this.currentSession.statistics
    return {
      totalCards: stats.totalCards || 0,
      rememberedCards: stats.rememberedCards || 0,
      forgottenCards: stats.forgottenCards || 0,
      timeSpent: this.currentSession.sessionDuration,
      averageResponseTime: stats.averageResponseTime || 0,
      comparisonGroupsShown: stats.comparisonGroupsShown || 0,
      newWordsLearned: stats.newWordsLearned || 0,
      streak: this.progressStore?.streakData?.currentStreak || 0
    }
  }

  getDefaultSummary() {
    return {
      totalCards: 0,
      rememberedCards: 0,
      forgottenCards: 0,
      timeSpent: 0,
      averageResponseTime: 0,
      comparisonGroupsShown: 0,
      newWordsLearned: 0,
      streak: 0
    }
  }

  getWordFromCard(cardId) {
    if (!this.currentSession) return 'Unknown'
    const card = this.currentSession.sessionCards.find(c => c.id === cardId)
    return card?.word || 'Unknown'
  }

  // Persistence methods
  saveSessionToPersistence() {
    if (this.currentSession) {
      localStorage.setItem('word-app-session', JSON.stringify(this.currentSession.toJSON()))
    }
  }

  loadSessionFromPersistence() {
    const sessionData = localStorage.getItem('word-app-session')
    return sessionData ? JSON.parse(sessionData) : null
  }

  clearSessionFromPersistence() {
    localStorage.removeItem('word-app-session')
  }
}

// Export singleton instance
export const sessionService = new SessionService()