import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AudioService } from '@/services/AudioService'

describe('AudioService Contract', () => {
  let audioService

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    audioService = new AudioService()
  })

  describe('playWordAudio', () => {
    it('should play pronunciation audio for a word', async () => {
      const result = await audioService.playWordAudio('bonjour', 'fr')
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('source')
      expect(['cache', 'tts', 'file']).toContain(result.source)
      
      if (!result.success) {
        expect(result).toHaveProperty('error')
      }
    })

    it('should handle different languages and voices', async () => {
      const result = await audioService.playWordAudio('hello', 'en', 'female')
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('source')
    })
  })

  describe('preloadAudio', () => {
    it('should pre-cache audio for upcoming cards', async () => {
      const words = ['bonjour', 'merci', 'au revoir']
      
      const result = await audioService.preloadAudio(words, 5, 'fr')
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('cached')
      expect(result).toHaveProperty('failed')
      expect(result).toHaveProperty('fromCache')
      
      expect(typeof result.cached).toBe('number')
      expect(Array.isArray(result.failed)).toBe(true)
      expect(typeof result.fromCache).toBe('number')
    })

    it('should handle priority ordering', async () => {
      const highPriorityWords = ['urgent']
      const lowPriorityWords = ['not urgent']
      
      // High priority should be processed first
      const result1 = await audioService.preloadAudio(highPriorityWords, 10)
      const result2 = await audioService.preloadAudio(lowPriorityWords, 1)
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })
  })

  describe('setAudioSettings', () => {
    it('should update audio configuration', async () => {
      const settings = {
        enabled: true,
        autoPlay: false,
        voice: 'male',
        volume: 80,
        playbackRate: 1.2
      }

      const result = await audioService.setAudioSettings(settings)
      
      expect(result).toHaveProperty('success')
      expect(result.success).toBe(true)
    })

    it('should validate settings ranges', async () => {
      const invalidSettings = {
        volume: 150, // Invalid range
        playbackRate: 5.0 // Invalid range
      }

      const result = await audioService.setAudioSettings(invalidSettings)
      
      // Should either reject invalid values or clamp them
      expect(result).toHaveProperty('success')
    })
  })

  describe('getAudioSettings', () => {
    it('should retrieve current audio configuration', async () => {
      const result = await audioService.getAudioSettings()
      
      expect(result).toHaveProperty('enabled')
      expect(result).toHaveProperty('autoPlay')
      expect(result).toHaveProperty('voice')
      expect(result).toHaveProperty('volume')
      expect(result).toHaveProperty('playbackRate')
      
      expect(['male', 'female']).toContain(result.voice)
      expect(result.volume).toBeGreaterThanOrEqual(0)
      expect(result.volume).toBeLessThanOrEqual(100)
    })
  })

  describe('clearAudioCache', () => {
    it('should remove cached audio to free memory', async () => {
      const result = await audioService.clearAudioCache()
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('freedBytes')
      expect(typeof result.freedBytes).toBe('number')
    })
  })

  describe('getCacheStatus', () => {
    it('should return current cache statistics', async () => {
      const result = await audioService.getCacheStatus()
      
      expect(result).toHaveProperty('totalItems')
      expect(result).toHaveProperty('totalBytes')
      expect(result).toHaveProperty('maxBytes')
      expect(result).toHaveProperty('hitRate')
      
      expect(typeof result.totalItems).toBe('number')
      expect(typeof result.totalBytes).toBe('number')
      expect(typeof result.hitRate).toBe('number')
      
      if (result.totalItems > 0) {
        expect(result).toHaveProperty('oldestItem')
        expect(result).toHaveProperty('newestItem')
      }
    })
  })

  describe('generateTTS', () => {
    it('should generate speech audio using browser TTS', async () => {
      const options = {
        language: 'fr',
        voice: 'female',
        rate: 1.0,
        pitch: 1.0
      }

      const result = await audioService.generateTTS('bonjour', options)
      
      expect(result).toHaveProperty('success')
      
      if (result.success) {
        expect(result).toHaveProperty('audioBlob')
        expect(result).toHaveProperty('duration')
        expect(typeof result.duration).toBe('number')
      } else {
        expect(result).toHaveProperty('error')
      }
    })
  })

  describe('getAvailableVoices', () => {
    it('should list browser TTS voices for language', async () => {
      const result = await audioService.getAvailableVoices('fr')
      
      expect(result).toHaveProperty('voices')
      expect(Array.isArray(result.voices)).toBe(true)
      
      result.voices.forEach(voice => {
        expect(voice).toHaveProperty('name')
        expect(voice).toHaveProperty('gender')
        expect(voice).toHaveProperty('quality')
        expect(voice).toHaveProperty('isDefault')
        
        expect(['male', 'female', 'unknown']).toContain(voice.gender)
        expect(['high', 'medium', 'low']).toContain(voice.quality)
      })
    })
  })

  describe('cacheAudioBlob', () => {
    it('should store audio in memory cache with metadata', async () => {
      const audioBlob = new Blob(['fake audio'], { type: 'audio/mp3' })
      const metadata = {
        source: 'tts',
        language: 'fr',
        voice: 'female',
        quality: 80,
        createdAt: new Date()
      }

      const result = await audioService.cacheAudioBlob('test-word', audioBlob, metadata)
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('cacheKey')
      expect(typeof result.cacheKey).toBe('string')
    })
  })

  describe('getFromCache', () => {
    it('should retrieve cached audio', async () => {
      const result = await audioService.getFromCache('test-word', 'fr')
      
      expect(result).toHaveProperty('found')
      
      if (result.found) {
        expect(result).toHaveProperty('audioBlob')
        expect(result).toHaveProperty('metadata')
        expect(result).toHaveProperty('lastAccessed')
      }
    })
  })

  describe('evictLeastRecent', () => {
    it('should remove oldest cached items to free space', async () => {
      const result = await audioService.evictLeastRecent(5)
      
      expect(result).toHaveProperty('evicted')
      expect(result).toHaveProperty('freedBytes')
      expect(typeof result.evicted).toBe('number')
      expect(typeof result.freedBytes).toBe('number')
    })
  })
})