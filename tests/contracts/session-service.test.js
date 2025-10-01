import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SessionService } from '@/services/SessionService'

describe('SessionService Contract', () => {
  let sessionService

  beforeEach(() => {
    localStorage.clear()
    sessionService = new SessionService()
  })

  describe('createSession', () => {
    it('should initialize new study session with config', async () => {
      const config = {
        deckIds: ['deck1', 'deck2'],
        roundSize: 25,
        newReviewRatio: 60,
        sessionType: 'mixed'
      }

      const result = await sessionService.createSession(config)
      
      expect(result).toHaveProperty('success')
      expect(result.success).toBe(true)
      expect(result).toHaveProperty('session')
      expect(result.session).toHaveProperty('id')
      expect(result.session).toHaveProperty('totalCards')
      expect(result.session).toHaveProperty('totalRounds')
      expect(result.session).toHaveProperty('estimatedTime')
    })

    it('should handle empty deck list', async () => {
      const config = { deckIds: [] }
      
      const result = await sessionService.createSession(config)
      
      expect(result.success).toBe(false)
      expect(result).toHaveProperty('error')
    })
  })

  describe('getNextCard', () => {
    it('should return next card for study', async () => {
      const result = await sessionService.getNextCard()
      
      expect(result).toHaveProperty('type')
      expect(['single', 'comparison', 'session-complete']).toContain(result.type)
      
      if (result.type !== 'session-complete') {
        expect(result).toHaveProperty('data')
        expect(result.data).toHaveProperty('cards')
        expect(result.data).toHaveProperty('progress')
        expect(Array.isArray(result.data.cards)).toBe(true)
      }
    })

    it('should return session complete when no more cards', async () => {
      // This will be implemented when we have session state
      const result = await sessionService.getNextCard()
      
      if (result.type === 'session-complete') {
        expect(result).toHaveProperty('sessionSummary')
      }
    })
  })

  describe('recordCardResult', () => {
    it('should record user response and update progress', async () => {
      const cardResult = {
        action: 'remember',
        responseTime: 2500,
        sessionType: 'normal'
      }

      const result = await sessionService.recordCardResult('card-id', cardResult)
      
      expect(result).toHaveProperty('success')
      
      if (cardResult.action === 'remember') {
        expect(result).toHaveProperty('nextReview')
        expect(result.nextReview).toHaveProperty('scheduledFor')
        expect(result.nextReview).toHaveProperty('interval')
      } else {
        expect(result).toHaveProperty('retryIn')
        expect(typeof result.retryIn).toBe('number')
      }
    })

    it('should handle not-remember action with 10-minute rule', async () => {
      const cardResult = {
        action: 'not-remember',
        responseTime: 1500,
        sessionType: 'normal'
      }

      const result = await sessionService.recordCardResult('card-id', cardResult)
      
      expect(result.success).toBe(true)
      expect(result).toHaveProperty('retryIn')
      expect(result.retryIn).toBe(10) // 10 minutes
    })
  })

  describe('pauseSession', () => {
    it('should save current session state', async () => {
      const result = await sessionService.pauseSession()
      
      expect(result).toHaveProperty('success')
      expect(result.success).toBe(true)
    })
  })

  describe('resumeSession', () => {
    it('should restore paused session', async () => {
      const result = await sessionService.resumeSession()
      
      expect(result).toHaveProperty('success')
      
      if (result.success) {
        expect(result).toHaveProperty('session')
      }
    })

    it('should handle retry cards from interrupted session', async () => {
      const result = await sessionService.resumeSession()
      
      if (result.hasRetryCards) {
        expect(result).toHaveProperty('retryCards')
        expect(Array.isArray(result.retryCards)).toBe(true)
      }
    })
  })

  describe('completeSession', () => {
    it('should finalize session and generate summary', async () => {
      const result = await sessionService.completeSession()
      
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('totalCards')
      expect(result.summary).toHaveProperty('rememberedCards')
      expect(result.summary).toHaveProperty('forgottenCards')
      expect(result.summary).toHaveProperty('timeSpent')
      expect(result.summary).toHaveProperty('averageResponseTime')
      expect(result.summary).toHaveProperty('streak')
      
      expect(typeof result.summary.totalCards).toBe('number')
      expect(typeof result.summary.streak).toBe('number')
    })
  })

  describe('undoLastAction', () => {
    it('should revert most recent card result', async () => {
      const result = await sessionService.undoLastAction()
      
      expect(result).toHaveProperty('success')
      
      if (result.success) {
        expect(result).toHaveProperty('restoredCard')
        expect(result.restoredCard).toHaveProperty('cardId')
      } else {
        expect(result).toHaveProperty('message')
      }
    })
  })

  describe('getRetryCards', () => {
    it('should return cards waiting for retry', async () => {
      const result = await sessionService.getRetryCards()
      
      expect(result).toHaveProperty('retryCards')
      expect(Array.isArray(result.retryCards)).toBe(true)
      
      result.retryCards.forEach(card => {
        expect(card).toHaveProperty('cardId')
        expect(card).toHaveProperty('word')
        expect(card).toHaveProperty('availableAt')
        expect(card).toHaveProperty('remainingTime')
      })
    })
  })

  describe('skipRetryWait', () => {
    it('should skip wait for specific card', async () => {
      const result = await sessionService.skipRetryWait('card-id')
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('cardsReady')
      expect(typeof result.cardsReady).toBe('number')
    })

    it('should skip wait for all cards when no cardId provided', async () => {
      const result = await sessionService.skipRetryWait()
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('cardsReady')
    })
  })

  describe('calculateNextReview', () => {
    it('should compute next review date using SM-2 algorithm', async () => {
      const progress = {
        reviewCount: 3,
        easeFactor: 2.5,
        currentInterval: 7,
        lastResult: 'remember'
      }

      const result = await sessionService.calculateNextReview(progress, 'remember')
      
      expect(result).toHaveProperty('nextInterval')
      expect(result).toHaveProperty('nextReviewDate')
      expect(result).toHaveProperty('newEaseFactor')
      expect(result).toHaveProperty('difficulty')
      
      expect(typeof result.nextInterval).toBe('number')
      expect(result.nextReviewDate instanceof Date).toBe(true)
      expect(['easy', 'medium', 'hard']).toContain(result.difficulty)
    })

    it('should handle failure results correctly', async () => {
      const progress = {
        reviewCount: 5,
        easeFactor: 2.0,
        currentInterval: 14,
      }

      const result = await sessionService.calculateNextReview(progress, 'not-remember')
      
      expect(result.nextInterval).toBe(1) // Reset to 1 day on failure
      expect(result.newEaseFactor).toBeLessThanOrEqual(2.0)
    })
  })
})