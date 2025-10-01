/**
 * WordCard model with validation
 * Represents individual vocabulary items for learning
 */

export const PARTS_OF_SPEECH = [
  'noun', 'verb', 'adjective', 'adverb', 'pronoun', 
  'preposition', 'conjunction', 'interjection', 'article'
]

export const DIFFICULTIES = ['new', 'easy', 'medium', 'hard']
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export class WordCard {
  constructor({
    id = null,
    word = '',
    translation = '',
    partOfSpeech = 'noun',
    hint = null,
    audioUrl = null,
    difficulty = 'new',
    cefr = null,
    tags = [],
    createdAt = new Date(),
    updatedAt = new Date()
  } = {}) {
    this.id = id || this.generateId()
    this.word = word
    this.translation = translation
    this.partOfSpeech = partOfSpeech
    this.hint = hint
    this.audioUrl = audioUrl
    this.difficulty = difficulty
    this.cefr = cefr
    this.tags = Array.isArray(tags) ? tags : []
    this.createdAt = createdAt
    this.updatedAt = updatedAt

    this.validate()
  }

  generateId() {
    return `word-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  validate() {
    const errors = []

    // Required fields
    if (!this.word || this.word.trim().length === 0) {
      errors.push('Word is required and cannot be empty')
    }

    if (!this.translation || this.translation.trim().length === 0) {
      errors.push('Translation is required and cannot be empty')
    }

    // Part of speech validation
    if (!PARTS_OF_SPEECH.includes(this.partOfSpeech)) {
      errors.push(`Part of speech must be one of: ${PARTS_OF_SPEECH.join(', ')}`)
    }

    // Hint length validation
    if (this.hint && this.hint.length > 200) {
      errors.push('Hint must be 200 characters or less')
    }

    // Difficulty validation
    if (!DIFFICULTIES.includes(this.difficulty)) {
      errors.push(`Difficulty must be one of: ${DIFFICULTIES.join(', ')}`)
    }

    // CEFR level validation
    if (this.cefr && !CEFR_LEVELS.includes(this.cefr)) {
      errors.push(`CEFR level must be one of: ${CEFR_LEVELS.join(', ')}`)
    }

    // Audio URL validation
    if (this.audioUrl && !this.isValidUrl(this.audioUrl)) {
      errors.push('Audio URL must be a valid URL')
    }

    if (errors.length > 0) {
      throw new Error(`WordCard validation failed: ${errors.join('; ')}`)
    }
  }

  isValidUrl(string) {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  // Update methods
  updateTranslation(newTranslation) {
    this.translation = newTranslation
    this.updatedAt = new Date()
    this.validate()
    return this
  }

  updateDifficulty(newDifficulty) {
    this.difficulty = newDifficulty
    this.updatedAt = new Date()
    this.validate()
    return this
  }

  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag)
      this.updatedAt = new Date()
    }
    return this
  }

  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag)
    this.updatedAt = new Date()
    return this
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      word: this.word,
      translation: this.translation,
      partOfSpeech: this.partOfSpeech,
      hint: this.hint,
      audioUrl: this.audioUrl,
      difficulty: this.difficulty,
      cefr: this.cefr,
      tags: this.tags,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }

  static fromJSON(json) {
    return new WordCard({
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    })
  }

  // Factory methods
  static createFromCSV(csvRow) {
    return new WordCard({
      word: csvRow.word?.trim(),
      translation: csvRow.translation?.trim(),
      partOfSpeech: csvRow.part_of_speech || csvRow.partOfSpeech || 'noun',
      hint: csvRow.hint?.trim() || null,
      cefr: csvRow.cefr || csvRow.level || null,
      tags: csvRow.tags ? csvRow.tags.split(',').map(t => t.trim()) : []
    })
  }
}