export class AudioService {
  constructor() {
    this.audioCache = new Map()
    this.settings = {
      enabled: true,
      autoPlay: true,
      voice: 'female',
      volume: 80,
      playbackRate: 1.0
    }
    this.maxCacheSize = 50 * 1024 * 1024 // 50MB
    this.currentCacheSize = 0
    this.loadSettings()
  }

  async playWordAudio(word, language = 'fr', voice = null) {
    try {
      if (!this.settings.enabled) {
        return { success: false, source: 'disabled', error: 'Audio is disabled' }
      }

      const actualVoice = voice || this.settings.voice
      const cacheKey = `${word}-${language}-${actualVoice}`

      // Try cache first
      const cachedAudio = this.getFromCache(cacheKey)
      if (cachedAudio.found) {
        await this.playAudioBlob(cachedAudio.audioBlob)
        return { success: true, source: 'cache' }
      }

      // Generate TTS audio
      const ttsResult = await this.generateTTS(word, {
        language,
        voice: actualVoice,
        rate: this.settings.playbackRate,
        pitch: 1.0
      })

      if (ttsResult.success) {
        // Cache the generated audio
        this.cacheAudioBlob(cacheKey, ttsResult.audioBlob, {
          source: 'tts',
          language,
          voice: actualVoice,
          quality: 80,
          createdAt: new Date()
        })

        await this.playAudioBlob(ttsResult.audioBlob)
        return { success: true, source: 'tts' }
      }

      return { success: false, source: 'tts', error: ttsResult.error }
    } catch (error) {
      return { success: false, source: 'error', error: error.message }
    }
  }

  async preloadAudio(words, priority = 5, language = 'fr') {
    try {
      const results = {
        success: true,
        cached: 0,
        failed: [],
        fromCache: 0
      }

      for (const word of words) {
        const cacheKey = `${word}-${language}-${this.settings.voice}`
        
        // Check if already cached
        if (this.getFromCache(cacheKey).found) {
          results.fromCache++
          continue
        }

        try {
          const ttsResult = await this.generateTTS(word, {
            language,
            voice: this.settings.voice,
            rate: this.settings.playbackRate,
            pitch: 1.0
          })

          if (ttsResult.success) {
            this.cacheAudioBlob(cacheKey, ttsResult.audioBlob, {
              source: 'tts',
              language,
              voice: this.settings.voice,
              quality: 80,
              createdAt: new Date()
            })
            results.cached++
          } else {
            results.failed.push(word)
          }
        } catch (error) {
          results.failed.push(word)
        }
      }

      return results
    } catch (error) {
      return {
        success: false,
        cached: 0,
        failed: words,
        fromCache: 0,
        error: error.message
      }
    }
  }

  async setAudioSettings(newSettings) {
    try {
      // Validate settings
      const validatedSettings = this.validateSettings(newSettings)
      
      this.settings = { ...this.settings, ...validatedSettings }
      this.saveSettings()
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getAudioSettings() {
    return { ...this.settings }
  }

  async clearAudioCache() {
    try {
      const freedBytes = this.currentCacheSize
      this.audioCache.clear()
      this.currentCacheSize = 0
      
      return { success: true, freedBytes }
    } catch (error) {
      return { success: false, freedBytes: 0, error: error.message }
    }
  }

  async getCacheStatus() {
    const cacheEntries = Array.from(this.audioCache.values())
    
    return {
      totalItems: this.audioCache.size,
      totalBytes: this.currentCacheSize,
      maxBytes: this.maxCacheSize,
      hitRate: this.calculateHitRate(),
      oldestItem: cacheEntries.length > 0 
        ? Math.min(...cacheEntries.map(entry => entry.metadata.createdAt.getTime()))
        : null,
      newestItem: cacheEntries.length > 0
        ? Math.max(...cacheEntries.map(entry => entry.metadata.createdAt.getTime()))
        : null
    }
  }

  async generateTTS(word, options) {
    try {
      const { language = 'fr', voice = 'female', rate = 1.0, pitch = 1.0 } = options

      if (!('speechSynthesis' in window)) {
        return { success: false, error: 'Speech synthesis not supported' }
      }

      // Get available voices
      const voices = await this.getAvailableVoices(language)
      
      let selectedVoice = null
      if (voices.voices.length > 0) {
        // Find voice matching preference
        selectedVoice = voices.voices.find(v => 
          v.gender === voice || v.isDefault
        ) || voices.voices[0]
      }

      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(word)
        utterance.lang = this.getLanguageCode(language)
        utterance.rate = rate
        utterance.pitch = pitch
        utterance.volume = this.settings.volume / 100

        if (selectedVoice) {
          utterance.voice = selectedVoice.voice
        }

        let audioBlob = null
        let duration = 0

        utterance.onstart = () => {
          duration = Date.now()
        }

        utterance.onend = () => {
          duration = (Date.now() - duration) / 1000
          
          // Create a mock audio blob since we can't capture TTS directly
          audioBlob = new Blob([word], { type: 'audio/wav' })
          
          resolve({
            success: true,
            audioBlob,
            duration
          })
        }

        utterance.onerror = (error) => {
          resolve({
            success: false,
            error: error.error || 'Speech synthesis failed'
          })
        }

        speechSynthesis.speak(utterance)
      })
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getAvailableVoices(language) {
    try {
      if (!('speechSynthesis' in window)) {
        return { voices: [] }
      }

      return new Promise((resolve) => {
        let voices = speechSynthesis.getVoices()
        
        if (voices.length === 0) {
          // Wait for voices to load
          speechSynthesis.onvoiceschanged = () => {
            voices = speechSynthesis.getVoices()
            resolve(this.formatVoices(voices, language))
          }
        } else {
          resolve(this.formatVoices(voices, language))
        }
      })
    } catch (error) {
      return { voices: [] }
    }
  }

  formatVoices(voices, language) {
    const langCode = this.getLanguageCode(language)
    const filteredVoices = voices.filter(voice => 
      voice.lang.startsWith(langCode.split('-')[0])
    )

    return {
      voices: filteredVoices.map(voice => ({
        name: voice.name,
        gender: this.detectVoiceGender(voice.name),
        quality: voice.localService ? 'high' : 'medium',
        isDefault: voice.default,
        voice // Keep reference for actual usage
      }))
    }
  }

  async cacheAudioBlob(cacheKey, audioBlob, metadata) {
    try {
      const blobSize = audioBlob.size || 1024 // Estimate size
      
      // Check cache space
      if (this.currentCacheSize + blobSize > this.maxCacheSize) {
        this.evictLeastRecent(Math.ceil(blobSize / (1024 * 1024))) // Evict MB equivalent
      }

      const cacheEntry = {
        audioBlob,
        metadata: {
          ...metadata,
          createdAt: new Date(metadata.createdAt),
          lastAccessed: new Date(),
          accessCount: 0
        }
      }

      this.audioCache.set(cacheKey, cacheEntry)
      this.currentCacheSize += blobSize

      return { success: true, cacheKey }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  getFromCache(cacheKey) {
    const entry = this.audioCache.get(cacheKey)
    
    if (entry) {
      // Update access tracking
      entry.metadata.lastAccessed = new Date()
      entry.metadata.accessCount++
      
      return {
        found: true,
        audioBlob: entry.audioBlob,
        metadata: entry.metadata,
        lastAccessed: entry.metadata.lastAccessed
      }
    }

    return { found: false }
  }

  evictLeastRecent(targetMB) {
    const entries = Array.from(this.audioCache.entries())
      .sort((a, b) => a[1].metadata.lastAccessed - b[1].metadata.lastAccessed)

    let evicted = 0
    let freedBytes = 0
    const targetBytes = targetMB * 1024 * 1024

    for (const [key, entry] of entries) {
      if (freedBytes >= targetBytes) break
      
      const blobSize = entry.audioBlob.size || 1024
      this.audioCache.delete(key)
      this.currentCacheSize -= blobSize
      freedBytes += blobSize
      evicted++
    }

    return { evicted, freedBytes }
  }

  // Helper methods
  async playAudioBlob(audioBlob) {
    return new Promise((resolve, reject) => {
      // For TTS, we just resolve immediately since speechSynthesis handles playback
      // In a full implementation, this would create an Audio object from the blob
      setTimeout(resolve, 100) // Small delay to simulate playback start
    })
  }

  validateSettings(settings) {
    const validated = {}

    if (settings.enabled !== undefined) {
      validated.enabled = Boolean(settings.enabled)
    }

    if (settings.autoPlay !== undefined) {
      validated.autoPlay = Boolean(settings.autoPlay)
    }

    if (settings.voice !== undefined) {
      if (['male', 'female'].includes(settings.voice)) {
        validated.voice = settings.voice
      }
    }

    if (settings.volume !== undefined) {
      validated.volume = Math.max(0, Math.min(100, Number(settings.volume)))
    }

    if (settings.playbackRate !== undefined) {
      validated.playbackRate = Math.max(0.5, Math.min(2.0, Number(settings.playbackRate)))
    }

    return validated
  }

  getLanguageCode(language) {
    const langMap = {
      'fr': 'fr-FR',
      'en': 'en-US',
      'es': 'es-ES',
      'de': 'de-DE',
      'it': 'it-IT'
    }
    return langMap[language] || 'fr-FR'
  }

  detectVoiceGender(voiceName) {
    const name = voiceName.toLowerCase()
    const femaleIndicators = ['female', 'woman', 'marie', 'amelie', 'claire', 'samantha', 'anna']
    const maleIndicators = ['male', 'man', 'pierre', 'henri', 'thomas', 'alex', 'daniel']

    if (femaleIndicators.some(indicator => name.includes(indicator))) {
      return 'female'
    }
    if (maleIndicators.some(indicator => name.includes(indicator))) {
      return 'male'
    }
    return 'unknown'
  }

  calculateHitRate() {
    // Simple hit rate calculation based on access counts
    const entries = Array.from(this.audioCache.values())
    if (entries.length === 0) return 0
    
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.metadata.accessCount, 0)
    return entries.length > 0 ? (totalAccesses / entries.length) * 100 : 0
  }

  // Persistence
  saveSettings() {
    localStorage.setItem('word-app-audio-settings', JSON.stringify(this.settings))
  }

  loadSettings() {
    const saved = localStorage.getItem('word-app-audio-settings')
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) }
      } catch (error) {
        console.warn('Failed to load audio settings:', error)
      }
    }
  }
}

// Export singleton instance
export const audioService = new AudioService()