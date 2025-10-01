/**
 * ProgressEntry model with validation
 * Tracks individual word learning progress and spaced repetition scheduling
 */

export const REVIEW_STATUS = ['new', 'learning', 'review', 'suspended', 'mastered']
export const RESULT_TYPES = ['remember', 'not-remember']

export class ProgressEntry {
  constructor({
    wordId = '',
    reviewCount = 0,
    successCount = 0,
    failureCount = 0,
    currentInterval = 1,
    easeFactor = 2.5,
    lastReviewDate = null,
    nextReviewDate = null,
    lastResult = null,
    status = 'new',
    reviewHistory = [],
    createdAt = new Date(),
    updatedAt = new Date()
  } = {}) {
    this.wordId = wordId
    this.reviewCount = reviewCount
    this.successCount = successCount
    this.failureCount = failureCount
    this.currentInterval = currentInterval
    this.easeFactor = easeFactor
    this.lastReviewDate = lastReviewDate
    this.nextReviewDate = nextReviewDate
    this.lastResult = lastResult
    this.status = status
    this.reviewHistory = Array.isArray(reviewHistory) ? reviewHistory : []
    this.createdAt = createdAt
    this.updatedAt = updatedAt

    this.validate()
  }

  validate() {
    const errors = []

    // Required fields
    if (!this.wordId || this.wordId.trim().length === 0) {
      errors.push('WordId is required')
    }

    // Count validations
    if (this.reviewCount < 0) {
      errors.push('Review count cannot be negative')
    }

    if (this.successCount < 0 || this.failureCount < 0) {
      errors.push('Success and failure counts cannot be negative')
    }

    if (this.successCount + this.failureCount > this.reviewCount) {
      errors.push('Success + failure count cannot exceed total review count')
    }

    // Interval validation
    if (this.currentInterval < 0) {
      errors.push('Current interval cannot be negative')
    }

    // Ease factor validation (SM-2 algorithm constraints)
    if (this.easeFactor < 1.3 || this.easeFactor > 2.5) {
      errors.push('Ease factor must be between 1.3 and 2.5')
    }

    // Status validation
    if (!REVIEW_STATUS.includes(this.status)) {
      errors.push(`Status must be one of: ${REVIEW_STATUS.join(', ')}`)
    }

    // Result type validation
    if (this.lastResult && !RESULT_TYPES.includes(this.lastResult)) {
      errors.push(`Last result must be one of: ${RESULT_TYPES.join(', ')}`)
    }

    // Date validation
    if (this.lastReviewDate && this.nextReviewDate) {
      if (this.nextReviewDate < this.lastReviewDate) {
        errors.push('Next review date cannot be before last review date')
      }
    }

    if (errors.length > 0) {
      throw new Error(`ProgressEntry validation failed: ${errors.join('; ')}`)
    }
  }

  // Computed properties
  get successRate() {
    return this.reviewCount > 0 ? this.successCount / this.reviewCount : 0
  }

  get isDue() {
    if (!this.nextReviewDate) return this.status === 'new'
    return new Date() >= this.nextReviewDate
  }

  get daysSinceLastReview() {
    if (!this.lastReviewDate) return null
    return Math.floor((Date.now() - this.lastReviewDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  get difficulty() {
    if (this.status === 'new') return 'new'
    
    const recentHistory = this.reviewHistory.slice(-3)
    const hasRecentFailure = recentHistory.some(entry => entry.result === 'not-remember')
    
    if (hasRecentFailure || this.currentInterval <= 3) return 'hard'
    if (this.currentInterval <= 7) return 'medium'
    return 'easy'
  }

  // Progress tracking methods
  recordReview(result, responseTime = 0) {
    const reviewEntry = {
      timestamp: new Date(),
      result,
      responseTime,
      intervalBefore: this.currentInterval,
      easeFactorBefore: this.easeFactor
    }

    // Update counts
    this.reviewCount++
    if (result === 'remember') {
      this.successCount++
    } else {
      this.failureCount++
    }

    // Add to history (keep last 10 reviews)
    this.reviewHistory.push(reviewEntry)
    if (this.reviewHistory.length > 10) {
      this.reviewHistory = this.reviewHistory.slice(-10)
    }

    this.lastResult = result
    this.lastReviewDate = new Date()
    this.updatedAt = new Date()

    // Calculate next review using SM-2 algorithm
    this.calculateNextReview(result)
    this.updateStatus()

    return this
  }

  calculateNextReview(result) {
    if (result === 'not-remember') {
      // Reset interval on failure
      this.currentInterval = 1
      this.easeFactor = Math.max(1.3, this.easeFactor - 0.2)
    } else {
      // Success - increase interval
      if (this.reviewCount === 1) {
        this.currentInterval = 1
      } else if (this.reviewCount === 2) {
        this.currentInterval = 6
      } else {
        this.currentInterval = Math.round(this.currentInterval * this.easeFactor)
      }

      // Adjust ease factor based on performance
      const quality = this.calculateQuality()
      this.easeFactor = this.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      this.easeFactor = Math.max(1.3, Math.min(2.5, this.easeFactor))
    }

    // Set next review date
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + this.currentInterval)
    this.nextReviewDate = nextDate

    return this
  }

  calculateQuality() {
    // Simple quality calculation based on recent performance
    // 5 = perfect, 4 = correct with hesitation, 3 = correct with difficulty
    // 2 = incorrect but remembered, 1 = incorrect, 0 = complete blackout
    
    const recentHistory = this.reviewHistory.slice(-3)
    if (recentHistory.length === 0) return 3
    
    const successRate = recentHistory.filter(entry => entry.result === 'remember').length / recentHistory.length
    
    if (successRate >= 1.0) return 5
    if (successRate >= 0.8) return 4
    if (successRate >= 0.6) return 3
    if (successRate >= 0.4) return 2
    return 1
  }

  updateStatus() {
    if (this.reviewCount === 0) {
      this.status = 'new'
    } else if (this.currentInterval < 7) {
      this.status = 'learning'
    } else if (this.currentInterval >= 21 && this.successRate > 0.8) {
      this.status = 'mastered'
    } else {
      this.status = 'review'
    }
    
    return this
  }

  // 10-minute rule for immediate retry
  scheduleRetry(minutes = 10) {
    const retryDate = new Date()
    retryDate.setMinutes(retryDate.getMinutes() + minutes)
    
    // Store retry info temporarily (not affecting main scheduling)
    this.retryScheduledAt = retryDate
    this.updatedAt = new Date()
    
    return this
  }

  isRetryReady() {
    if (!this.retryScheduledAt) return false
    return new Date() >= this.retryScheduledAt
  }

  clearRetry() {
    delete this.retryScheduledAt
    this.updatedAt = new Date()
    return this
  }

  // Serialization
  toJSON() {
    return {
      wordId: this.wordId,
      reviewCount: this.reviewCount,
      successCount: this.successCount,
      failureCount: this.failureCount,
      currentInterval: this.currentInterval,
      easeFactor: this.easeFactor,
      lastReviewDate: this.lastReviewDate?.toISOString() || null,
      nextReviewDate: this.nextReviewDate?.toISOString() || null,
      lastResult: this.lastResult,
      status: this.status,
      reviewHistory: this.reviewHistory,
      retryScheduledAt: this.retryScheduledAt?.toISOString() || null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // Computed properties for convenience
      successRate: this.successRate,
      difficulty: this.difficulty,
      isDue: this.isDue
    }
  }

  static fromJSON(json) {
    return new ProgressEntry({
      ...json,
      lastReviewDate: json.lastReviewDate ? new Date(json.lastReviewDate) : null,
      nextReviewDate: json.nextReviewDate ? new Date(json.nextReviewDate) : null,
      retryScheduledAt: json.retryScheduledAt ? new Date(json.retryScheduledAt) : undefined,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    })
  }

  // Factory methods
  static createNew(wordId) {
    return new ProgressEntry({ wordId })
  }

  static createFromReview(wordId, result, responseTime = 0) {
    const entry = new ProgressEntry({ wordId })
    return entry.recordReview(result, responseTime)
  }
}