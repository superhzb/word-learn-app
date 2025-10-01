/**
 * ConfusingWordGroup model
 * Groups similar words for comparison-based learning
 */

export const GROUP_SOURCES = ['system', 'user']
export const SIMILARITY_CATEGORIES = ['phonetic', 'spelling', 'meaning', 'grammar']

export class ConfusingWordGroup {
  constructor({
    id = null,
    name = '',
    wordIds = [],
    source = 'system',
    confidence = 80,
    category = 'phonetic',
    description = '',
    createdAt = new Date(),
    updatedAt = new Date()
  } = {}) {
    this.id = id || this.generateId()
    this.name = name
    this.wordIds = Array.isArray(wordIds) ? wordIds : []
    this.source = source
    this.confidence = confidence
    this.category = category
    this.description = description
    this.createdAt = createdAt
    this.updatedAt = updatedAt

    this.validate()
  }

  generateId() {
    return `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  validate() {
    const errors = []

    // Required fields
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Group name is required')
    }

    // Word count validation
    if (this.wordIds.length < 2) {
      errors.push('Group must contain at least 2 words')
    }

    if (this.wordIds.length > 6) {
      errors.push('Group cannot contain more than 6 words (UI constraint)')
    }

    // Source validation
    if (!GROUP_SOURCES.includes(this.source)) {
      errors.push(`Source must be one of: ${GROUP_SOURCES.join(', ')}`)
    }

    // Category validation
    if (!SIMILARITY_CATEGORIES.includes(this.category)) {
      errors.push(`Category must be one of: ${SIMILARITY_CATEGORIES.join(', ')}`)
    }

    // Confidence validation
    if (this.confidence < 0 || this.confidence > 100) {
      errors.push('Confidence must be between 0 and 100')
    }

    if (errors.length > 0) {
      throw new Error(`ConfusingWordGroup validation failed: ${errors.join('; ')}`)
    }
  }

  // Group management methods
  addWord(wordId) {
    if (!this.wordIds.includes(wordId)) {
      this.wordIds.push(wordId)
      this.updatedAt = new Date()
    }
    this.validate()
    return this
  }

  removeWord(wordId) {
    this.wordIds = this.wordIds.filter(id => id !== wordId)
    this.updatedAt = new Date()
    this.validate()
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
    return this
  }

  // Utility methods
  containsWord(wordId) {
    return this.wordIds.includes(wordId)
  }

  getWordCount() {
    return this.wordIds.length
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      wordIds: this.wordIds,
      source: this.source,
      confidence: this.confidence,
      category: this.category,
      description: this.description,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }

  static fromJSON(json) {
    return new ConfusingWordGroup({
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    })
  }

  // Factory methods for different similarity types
  static createPhoneticGroup(words, name) {
    return new ConfusingWordGroup({
      name,
      wordIds: words.map(w => w.id),
      category: 'phonetic',
      description: 'Words that sound similar',
      confidence: 85
    })
  }

  static createSpellingGroup(words, name) {
    return new ConfusingWordGroup({
      name,
      wordIds: words.map(w => w.id),
      category: 'spelling',
      description: 'Words with similar spelling patterns',
      confidence: 90
    })
  }

  static createMeaningGroup(words, name) {
    return new ConfusingWordGroup({
      name,
      wordIds: words.map(w => w.id),
      category: 'meaning',
      description: 'Words with related meanings',
      confidence: 80
    })
  }

  static createUserGroup(wordIds, name, description = '') {
    return new ConfusingWordGroup({
      name,
      wordIds,
      source: 'user',
      description,
      confidence: 100
    })
  }
}

// Predefined confusing word group rules for French
export const FRENCH_CONFUSING_GROUPS = [
  {
    name: 'Animals with CH sound',
    category: 'phonetic',
    words: ['chat', 'chien', 'cheval'],
    description: 'French animals starting with CH'
  },
  {
    name: 'Colors - Primary',
    category: 'meaning',
    words: ['rouge', 'bleu', 'vert'],
    description: 'Basic color words'
  },
  {
    name: 'Size adjectives',
    category: 'meaning', 
    words: ['grand', 'petit'],
    description: 'Opposite size descriptions'
  },
  {
    name: 'Essential verbs',
    category: 'grammar',
    words: ['être', 'avoir', 'aller', 'faire'],
    description: 'Most common French verbs'
  },
  {
    name: 'Greetings',
    category: 'meaning',
    words: ['bonjour', 'bonsoir', 'salut'],
    description: 'Different greeting expressions'
  }
]