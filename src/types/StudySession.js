/**
 * StudySession model with validation
 * Represents a learning session with rounds and progress tracking
 */

export const SESSION_TYPES = ['mixed', 'new-only', 'review-only', 'comparison-only']
export const SESSION_STATUS = ['active', 'paused', 'completed', 'abandoned']

export class StudySession {
  constructor({
    id = null,
    deckIds = [],
    roundSize = 50,
    newReviewRatio = 50,
    sessionType = 'mixed',
    status = 'active',
    startTime = new Date(),
    endTime = null,
    currentRound = 1,
    totalRounds = 1,
    cardsCompleted = 0,
    cardsRemaining = 0,
    currentCardIndex = 0,
    sessionCards = [],
    retryCards = [],
    statistics = null,
    settings = {},
    createdAt = new Date(),
    updatedAt = new Date()
  } = {}) {
    this.id = id || this.generateId()
    this.deckIds = Array.isArray(deckIds) ? deckIds : []
    this.roundSize = roundSize
    this.newReviewRatio = newReviewRatio
    this.sessionType = sessionType
    this.status = status
    this.startTime = startTime
    this.endTime = endTime
    this.currentRound = currentRound
    this.totalRounds = totalRounds
    this.cardsCompleted = cardsCompleted
    this.cardsRemaining = cardsRemaining
    this.currentCardIndex = currentCardIndex
    this.sessionCards = Array.isArray(sessionCards) ? sessionCards : []
    this.retryCards = Array.isArray(retryCards) ? retryCards : []
    this.statistics = statistics || this.createDefaultStatistics()
    this.settings = settings || this.createDefaultSettings()
    this.createdAt = createdAt
    this.updatedAt = updatedAt

    this.validate()
  }

  generateId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  createDefaultStatistics() {
    return {
      totalCards: 0,
      rememberedCards: 0,
      forgottenCards: 0,
      averageResponseTime: 0,
      comparisonGroupsShown: 0,
      newWordsLearned: 0,
      reviewsCompleted: 0,
      streak: 0,
      startTime: new Date(),
      timeSpent: 0 // minutes
    }
  }

  createDefaultSettings() {
    return {
      autoPlayAudio: true,
      showHints: true,
      gesturesEnabled: true,
      animationsEnabled: true
    }
  }

  validate() {
    const errors = []

    // Required fields
    if (this.deckIds.length === 0) {
      errors.push('At least one deck ID is required')
    }

    // Round size validation
    if (this.roundSize < 1 || this.roundSize > 100) {
      errors.push('Round size must be between 1 and 100')
    }

    // New/review ratio validation
    if (this.newReviewRatio < 0 || this.newReviewRatio > 100) {
      errors.push('New/review ratio must be between 0 and 100')
    }

    // Session type validation
    if (!SESSION_TYPES.includes(this.sessionType)) {
      errors.push(`Session type must be one of: ${SESSION_TYPES.join(', ')}`)
    }

    // Status validation
    if (!SESSION_STATUS.includes(this.status)) {
      errors.push(`Status must be one of: ${SESSION_STATUS.join(', ')}`)
    }

    // Round validation
    if (this.currentRound < 1 || this.currentRound > this.totalRounds) {
      errors.push('Current round must be between 1 and total rounds')
    }

    // Card counts validation
    if (this.cardsCompleted < 0 || this.cardsRemaining < 0) {
      errors.push('Card counts cannot be negative')
    }

    if (errors.length > 0) {
      throw new Error(`StudySession validation failed: ${errors.join('; ')}`)
    }
  }

  // Computed properties
  get totalCards() {
    return this.sessionCards.length
  }

  get progressPercentage() {
    return this.totalCards > 0 ? (this.cardsCompleted / this.totalCards) * 100 : 0
  }

  get isComplete() {
    return this.status === 'completed' || this.currentCardIndex >= this.sessionCards.length
  }

  get currentCard() {
    if (this.currentCardIndex >= this.sessionCards.length) return null
    return this.sessionCards[this.currentCardIndex]
  }

  get estimatedTimeRemaining() {
    if (this.cardsRemaining === 0) return 0
    const avgTimePerCard = this.statistics.averageResponseTime || 3 // seconds
    return Math.round((this.cardsRemaining * avgTimePerCard) / 60) // minutes
  }

  get sessionDuration() {
    const endTime = this.endTime || new Date()
    return Math.round((endTime - this.startTime) / (1000 * 60)) // minutes
  }

  // Session management methods
  initializeCards(wordCards) {
    // Sort cards by difficulty (Easy → Medium → Hard pattern)
    const sortedCards = this.sortCardsByDifficulty(wordCards)
    
    // Apply new/review ratio
    const { newCards, reviewCards } = this.categorizeCards(sortedCards)
    const selectedCards = this.applyNewReviewRatio(newCards, reviewCards)
    
    // Organize into rounds
    this.sessionCards = this.organizeIntoRounds(selectedCards)
    this.cardsRemaining = this.sessionCards.length
    this.totalRounds = Math.ceil(this.sessionCards.length / this.roundSize)
    this.statistics.totalCards = this.sessionCards.length

    this.updatedAt = new Date()
    return this
  }

  sortCardsByDifficulty(wordCards) {
    // Group by difficulty level
    const groups = {
      new: wordCards.filter(card => card.difficulty === 'new'),
      easy: wordCards.filter(card => card.difficulty === 'easy'),
      medium: wordCards.filter(card => card.difficulty === 'medium'),
      hard: wordCards.filter(card => card.difficulty === 'hard')
    }

    // Shuffle within each group to avoid predictable patterns
    Object.keys(groups).forEach(key => {
      groups[key] = this.shuffleArray([...groups[key]])
    })

    // Arrange in Easy → Medium → Hard pattern
    const arranged = []
    const maxLength = Math.max(groups.easy.length, groups.medium.length, groups.hard.length)
    
    for (let i = 0; i < maxLength; i++) {
      if (groups.easy[i]) arranged.push(groups.easy[i])
      if (groups.medium[i]) arranged.push(groups.medium[i])
      if (groups.hard[i]) arranged.push(groups.hard[i])
    }

    // Add new cards at the beginning
    return [...groups.new, ...arranged]
  }

  categorizeCards(wordCards) {
    return {
      newCards: wordCards.filter(card => card.difficulty === 'new'),
      reviewCards: wordCards.filter(card => card.difficulty !== 'new')
    }
  }

  applyNewReviewRatio(newCards, reviewCards) {
    const totalNeeded = Math.min(this.roundSize * this.totalRounds, newCards.length + reviewCards.length)
    const newNeeded = Math.round((this.newReviewRatio / 100) * totalNeeded)
    const reviewNeeded = totalNeeded - newNeeded

    const selectedNew = newCards.slice(0, Math.min(newNeeded, newCards.length))
    const selectedReview = reviewCards.slice(0, Math.min(reviewNeeded, reviewCards.length))

    return [...selectedNew, ...selectedReview]
  }

  organizeIntoRounds(cards) {
    // For prototype, just return the cards in order
    // In full implementation, this would handle comparison groups
    return cards
  }

  shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Card progression methods
  advanceToNextCard() {
    if (this.currentCardIndex < this.sessionCards.length - 1) {
      this.currentCardIndex++
      this.cardsCompleted++
      this.cardsRemaining = this.sessionCards.length - this.cardsCompleted
      
      // Check if we completed a round
      if (this.cardsCompleted % this.roundSize === 0 && this.cardsCompleted < this.sessionCards.length) {
        this.currentRound++
      }
    } else {
      this.completeSession()
    }

    this.updatedAt = new Date()
    return this
  }

  recordCardResult(cardId, result, responseTime = 0) {
    // Update statistics
    this.statistics.averageResponseTime = this.calculateAverageResponseTime(responseTime)
    
    if (result === 'remember') {
      this.statistics.rememberedCards++
    } else {
      this.statistics.forgottenCards++
      
      // Add to retry cards with 10-minute rule
      this.scheduleRetry(cardId)
    }

    this.advanceToNextCard()
    return this
  }

  calculateAverageResponseTime(newTime) {
    const totalResponses = this.statistics.rememberedCards + this.statistics.forgottenCards
    const currentAverage = this.statistics.averageResponseTime || 0
    return ((currentAverage * totalResponses) + newTime) / (totalResponses + 1)
  }

  scheduleRetry(cardId, minutes = 10) {
    const retryTime = new Date()
    retryTime.setMinutes(retryTime.getMinutes() + minutes)
    
    const retryCard = {
      cardId,
      scheduledFor: retryTime,
      remainingTime: minutes * 60 // seconds
    }
    
    this.retryCards.push(retryCard)
    this.updatedAt = new Date()
    return this
  }

  getRetryCards() {
    const now = new Date()
    return this.retryCards.map(retry => ({
      ...retry,
      remainingTime: Math.max(0, Math.floor((retry.scheduledFor - now) / 1000)),
      isReady: now >= retry.scheduledFor
    }))
  }

  skipRetryWait(cardId = null) {
    if (cardId) {
      // Skip specific card
      this.retryCards = this.retryCards.filter(retry => retry.cardId !== cardId)
    } else {
      // Skip all retry cards
      this.retryCards = []
    }
    
    this.updatedAt = new Date()
    return this
  }

  // Session control methods
  pauseSession() {
    if (this.status === 'active') {
      this.status = 'paused'
      this.updatedAt = new Date()
    }
    return this
  }

  resumeSession() {
    if (this.status === 'paused') {
      this.status = 'active'
      this.updatedAt = new Date()
    }
    return this
  }

  completeSession() {
    this.status = 'completed'
    this.endTime = new Date()
    this.statistics.timeSpent = this.sessionDuration
    this.updatedAt = new Date()
    return this
  }

  abandonSession() {
    this.status = 'abandoned'
    this.endTime = new Date()
    this.statistics.timeSpent = this.sessionDuration
    this.updatedAt = new Date()
    return this
  }

  // Undo functionality
  undoLastAction() {
    if (this.cardsCompleted > 0) {
      this.currentCardIndex = Math.max(0, this.currentCardIndex - 1)
      this.cardsCompleted--
      this.cardsRemaining++
      
      // Recalculate current round
      this.currentRound = Math.floor(this.cardsCompleted / this.roundSize) + 1
      
      this.updatedAt = new Date()
      return { success: true, cardIndex: this.currentCardIndex }
    }
    
    return { success: false, message: 'No actions to undo' }
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      deckIds: this.deckIds,
      roundSize: this.roundSize,
      newReviewRatio: this.newReviewRatio,
      sessionType: this.sessionType,
      status: this.status,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime?.toISOString() || null,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      cardsCompleted: this.cardsCompleted,
      cardsRemaining: this.cardsRemaining,
      currentCardIndex: this.currentCardIndex,
      sessionCards: this.sessionCards,
      retryCards: this.retryCards,
      statistics: this.statistics,
      settings: this.settings,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // Computed properties
      totalCards: this.totalCards,
      progressPercentage: this.progressPercentage,
      isComplete: this.isComplete,
      estimatedTimeRemaining: this.estimatedTimeRemaining,
      sessionDuration: this.sessionDuration
    }
  }

  static fromJSON(json) {
    return new StudySession({
      ...json,
      startTime: new Date(json.startTime),
      endTime: json.endTime ? new Date(json.endTime) : null,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    })
  }

  // Factory methods
  static createNew(deckIds, options = {}) {
    return new StudySession({
      deckIds,
      ...options
    })
  }
}