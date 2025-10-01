import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ProgressEntry } from '@/types/ProgressEntry'

export const useProgressStore = defineStore('progress', () => {
  // State
  const progressEntries = ref(new Map())
  const dailyStats = ref(new Map())
  const streakData = ref({
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null
  })

  // Getters
  const getProgressForWord = computed(() => (wordId) => {
    return progressEntries.value.get(wordId) || null
  })

  const getWordsByDifficulty = computed(() => (difficulty) => {
    return Array.from(progressEntries.value.values())
      .filter(entry => entry.difficulty === difficulty)
      .map(entry => entry.wordId)
  })

  const getDueCards = computed(() => {
    const now = new Date()
    return Array.from(progressEntries.value.values())
      .filter(entry => entry.isDue)
      .sort((a, b) => {
        // Priority: overdue first, then by scheduled time
        if (a.nextReviewDate && b.nextReviewDate) {
          return a.nextReviewDate - b.nextReviewDate
        }
        return a.status === 'new' ? -1 : 1
      })
  })

  const getRetryCards = computed(() => {
    return Array.from(progressEntries.value.values())
      .filter(entry => entry.retryScheduledAt && entry.isRetryReady())
      .map(entry => ({
        wordId: entry.wordId,
        scheduledFor: entry.retryScheduledAt,
        remainingTime: Math.max(0, Math.floor((entry.retryScheduledAt - new Date()) / 1000))
      }))
  })

  const getTodayStats = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return dailyStats.value.get(today) || {
      date: today,
      cardsStudied: 0,
      newCards: 0,
      reviewCards: 0,
      rememberedCards: 0,
      forgottenCards: 0,
      timeSpent: 0,
      averageResponseTime: 0
    }
  })

  const getOverallStats = computed(() => {
    const entries = Array.from(progressEntries.value.values())
    
    return {
      totalWords: entries.length,
      newWords: entries.filter(e => e.status === 'new').length,
      learningWords: entries.filter(e => e.status === 'learning').length,
      reviewWords: entries.filter(e => e.status === 'review').length,
      masteredWords: entries.filter(e => e.status === 'mastered').length,
      dueForReview: getDueCards.value.length,
      averageSuccessRate: entries.length > 0 
        ? entries.reduce((sum, e) => sum + e.successRate, 0) / entries.length 
        : 0
    }
  })

  // Actions
  function initializeWordProgress(wordId) {
    if (!progressEntries.value.has(wordId)) {
      const entry = ProgressEntry.createNew(wordId)
      progressEntries.value.set(wordId, entry)
      saveProgressToPersistence()
      return entry
    }
    return progressEntries.value.get(wordId)
  }

  function recordWordReview(wordId, result, responseTime = 0) {
    let entry = progressEntries.value.get(wordId)
    
    if (!entry) {
      entry = initializeWordProgress(wordId)
    }

    // Record the review
    entry.recordReview(result, responseTime)
    progressEntries.value.set(wordId, entry)

    // Update daily statistics
    updateDailyStats(result, responseTime, entry.status === 'new')
    
    // Update streak
    updateStreak()

    saveProgressToPersistence()
    
    return {
      success: true,
      progress: entry,
      nextReview: {
        scheduledFor: entry.nextReviewDate,
        interval: entry.currentInterval
      }
    }
  }

  function scheduleWordRetry(wordId, minutes = 10) {
    const entry = progressEntries.value.get(wordId)
    if (!entry) return { success: false, error: 'Word not found' }

    entry.scheduleRetry(minutes)
    progressEntries.value.set(wordId, entry)
    saveProgressToPersistence()

    return {
      success: true,
      retryIn: minutes,
      availableAt: entry.retryScheduledAt
    }
  }

  function skipRetryForWord(wordId) {
    const entry = progressEntries.value.get(wordId)
    if (!entry) return { success: false, error: 'Word not found' }

    entry.clearRetry()
    progressEntries.value.set(wordId, entry)
    saveProgressToPersistence()

    return { success: true }
  }

  function skipAllRetries() {
    let count = 0
    progressEntries.value.forEach((entry, wordId) => {
      if (entry.retryScheduledAt) {
        entry.clearRetry()
        progressEntries.value.set(wordId, entry)
        count++
      }
    })
    
    if (count > 0) {
      saveProgressToPersistence()
    }

    return { success: true, clearedCount: count }
  }

  function updateDailyStats(result, responseTime, wasNew) {
    const today = new Date().toISOString().split('T')[0]
    const stats = getTodayStats.value
    
    stats.cardsStudied++
    if (wasNew) stats.newCards++
    else stats.reviewCards++
    
    if (result === 'remember') {
      stats.rememberedCards++
    } else {
      stats.forgottenCards++
    }

    // Update average response time
    const totalResponses = stats.rememberedCards + stats.forgottenCards
    stats.averageResponseTime = ((stats.averageResponseTime * (totalResponses - 1)) + responseTime) / totalResponses

    dailyStats.value.set(today, stats)
    saveDailyStatsToPersistence()
  }

  function updateStreak() {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (streakData.value.lastStudyDate === yesterdayStr) {
      // Continuing streak
      streakData.value.currentStreak++
    } else if (streakData.value.lastStudyDate !== today) {
      // Starting new streak
      streakData.value.currentStreak = 1
    }

    streakData.value.lastStudyDate = today
    streakData.value.longestStreak = Math.max(
      streakData.value.longestStreak, 
      streakData.value.currentStreak
    )

    saveStreakToPersistence()
  }

  function getWordStatistics(wordId) {
    const entry = progressEntries.value.get(wordId)
    if (!entry) return null

    return {
      wordId,
      reviewCount: entry.reviewCount,
      successRate: entry.successRate,
      difficulty: entry.difficulty,
      status: entry.status,
      lastReviewDate: entry.lastReviewDate,
      nextReviewDate: entry.nextReviewDate,
      currentInterval: entry.currentInterval,
      easeFactor: entry.easeFactor,
      daysSinceLastReview: entry.daysSinceLastReview,
      reviewHistory: entry.reviewHistory
    }
  }

  function resetWordProgress(wordId) {
    if (progressEntries.value.has(wordId)) {
      const newEntry = ProgressEntry.createNew(wordId)
      progressEntries.value.set(wordId, newEntry)
      saveProgressToPersistence()
      return { success: true }
    }
    return { success: false, error: 'Word not found' }
  }

  function exportProgress() {
    const progressData = Array.from(progressEntries.value.values()).map(entry => entry.toJSON())
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      progressEntries: progressData,
      dailyStats: Object.fromEntries(dailyStats.value),
      streakData: streakData.value
    }
    return JSON.stringify(exportData, null, 2)
  }

  function importProgress(jsonData) {
    try {
      const data = JSON.parse(jsonData)
      
      // Clear existing data
      progressEntries.value.clear()
      dailyStats.value.clear()
      
      // Import progress entries
      if (data.progressEntries) {
        data.progressEntries.forEach(entryData => {
          const entry = ProgressEntry.fromJSON(entryData)
          progressEntries.value.set(entry.wordId, entry)
        })
      }
      
      // Import daily stats
      if (data.dailyStats) {
        Object.entries(data.dailyStats).forEach(([date, stats]) => {
          dailyStats.value.set(date, stats)
        })
      }
      
      // Import streak data
      if (data.streakData) {
        streakData.value = { ...data.streakData }
        if (streakData.value.lastStudyDate) {
          streakData.value.lastStudyDate = new Date(streakData.value.lastStudyDate)
        }
      }
      
      saveAllToPersistence()
      return { success: true, message: 'Progress imported successfully' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Persistence functions
  function saveProgressToPersistence() {
    const progressData = Array.from(progressEntries.value.values()).map(entry => entry.toJSON())
    localStorage.setItem('word-app-progress', JSON.stringify(progressData))
  }

  function saveDailyStatsToPersistence() {
    const statsData = Object.fromEntries(dailyStats.value)
    localStorage.setItem('word-app-daily-stats', JSON.stringify(statsData))
  }

  function saveStreakToPersistence() {
    localStorage.setItem('word-app-streak', JSON.stringify(streakData.value))
  }

  function saveAllToPersistence() {
    saveProgressToPersistence()
    saveDailyStatsToPersistence()
    saveStreakToPersistence()
  }

  function loadFromPersistence() {
    // Load progress entries
    const progressData = JSON.parse(localStorage.getItem('word-app-progress') || '[]')
    progressEntries.value.clear()
    progressData.forEach(entryData => {
      const entry = ProgressEntry.fromJSON(entryData)
      progressEntries.value.set(entry.wordId, entry)
    })

    // Load daily stats
    const statsData = JSON.parse(localStorage.getItem('word-app-daily-stats') || '{}')
    dailyStats.value.clear()
    Object.entries(statsData).forEach(([date, stats]) => {
      dailyStats.value.set(date, stats)
    })

    // Load streak data
    const streakDataJson = localStorage.getItem('word-app-streak')
    if (streakDataJson) {
      const parsed = JSON.parse(streakDataJson)
      streakData.value = {
        ...parsed,
        lastStudyDate: parsed.lastStudyDate ? new Date(parsed.lastStudyDate) : null
      }
    }
  }

  function clearAllProgress() {
    progressEntries.value.clear()
    dailyStats.value.clear()
    streakData.value = {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null
    }
    
    localStorage.removeItem('word-app-progress')
    localStorage.removeItem('word-app-daily-stats')
    localStorage.removeItem('word-app-streak')

    return { success: true, message: 'All progress cleared' }
  }

  return {
    // State
    progressEntries,
    streakData: computed(() => streakData.value),
    
    // Getters
    getProgressForWord,
    getWordsByDifficulty,
    getDueCards,
    getRetryCards,
    getTodayStats,
    getOverallStats,
    
    // Actions
    initializeWordProgress,
    recordWordReview,
    scheduleWordRetry,
    skipRetryForWord,
    skipAllRetries,
    getWordStatistics,
    resetWordProgress,
    exportProgress,
    importProgress,
    loadFromPersistence,
    clearAllProgress
  }
})