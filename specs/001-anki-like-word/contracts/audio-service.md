# Audio Service Contract

**Service**: AudioService  
**Type**: Frontend Service  
**Purpose**: Handle audio playback, caching, and text-to-speech for pronunciation

## Service Interface

### playWordAudio(word: string, language?: string)
**Purpose**: Play pronunciation audio for a vocabulary word  
**Input**:
```typescript
{
  word: string
  language?: string (default: 'fr' for French)
  voice?: 'male' | 'female'
}
```
**Output**:
```typescript
{
  success: boolean
  source: 'cache' | 'tts' | 'file'
  error?: string
}
```

### preloadAudio(words: string[], priority?: number)
**Purpose**: Pre-cache audio for upcoming cards  
**Input**:
```typescript
{
  words: string[]
  priority?: number (1-10, higher = more urgent)
  language?: string
}
```
**Output**:
```typescript
{
  success: boolean
  cached: number // successfully cached count
  failed: string[] // words that failed to cache
  fromCache: number // already cached count
}
```

### setAudioSettings(settings: AudioSettings)
**Purpose**: Update audio configuration  
**Input**:
```typescript
{
  enabled: boolean
  autoPlay: boolean
  voice: 'male' | 'female'
  volume: number // 0-100
  playbackRate: number // 0.5-2.0
}
```
**Output**: `{ success: boolean }`

### getAudioSettings()
**Purpose**: Retrieve current audio configuration  
**Input**: None  
**Output**: `AudioSettings`

### clearAudioCache()
**Purpose**: Remove cached audio to free memory  
**Input**: None  
**Output**: `{ success: boolean, freedBytes: number }`

### getCacheStatus()
**Purpose**: Get current cache statistics  
**Input**: None  
**Output**:
```typescript
{
  totalItems: number
  totalBytes: number
  maxBytes: number
  hitRate: number // percentage
  oldestItem: Date
  newestItem: Date
}
```

## Text-to-Speech Interface

### generateTTS(word: string, options: TTSOptions)
**Purpose**: Generate speech audio using browser TTS  
**Input**:
```typescript
{
  word: string
  language: string
  voice?: 'male' | 'female'
  rate?: number // 0.5-2.0
  pitch?: number // 0.5-2.0
}
```
**Output**:
```typescript
{
  success: boolean
  audioBlob?: Blob
  duration?: number // seconds
  error?: string
}
```

### getAvailableVoices(language: string)
**Purpose**: List browser TTS voices for language  
**Input**: `{ language: string }`  
**Output**:
```typescript
{
  voices: Array<{
    name: string
    gender: 'male' | 'female' | 'unknown'
    quality: 'high' | 'medium' | 'low'
    isDefault: boolean
  }>
}
```

## Audio Cache Management

### cacheAudioBlob(word: string, audioBlob: Blob, metadata: CacheMetadata)
**Purpose**: Store audio in memory cache with metadata  
**Input**:
```typescript
{
  word: string
  audioBlob: Blob
  metadata: {
    source: 'file' | 'tts'
    language: string
    voice: string
    quality: number
    createdAt: Date
  }
}
```
**Output**: `{ success: boolean, cacheKey: string }`

### getFromCache(word: string, language: string)
**Purpose**: Retrieve cached audio  
**Input**: `{ word: string, language: string }`  
**Output**:
```typescript
{
  found: boolean
  audioBlob?: Blob
  metadata?: CacheMetadata
  lastAccessed?: Date
}
```

### evictLeastRecent(count: number)
**Purpose**: Remove oldest cached items to free space  
**Input**: `{ count: number }`  
**Output**: `{ evicted: number, freedBytes: number }`

## Test Scenarios

### Test: playWordAudio_withCachedAudio_playsImmediately
**Given**: Word audio is already cached  
**When**: playWordAudio() called  
**Then**: Audio plays without delay  
**And**: Returns source: 'cache'  
**And**: Updates cache access time  

### Test: playWordAudio_withoutCache_usesTTSFallback
**Given**: No cached audio for word  
**And**: TTS is available  
**When**: playWordAudio() called  
**Then**: Generates TTS audio  
**And**: Plays generated audio  
**And**: Caches result for future use  
**And**: Returns source: 'tts'  

### Test: preloadAudio_cachesSuccessfully
**Given**: List of upcoming words  
**When**: preloadAudio() called  
**Then**: Attempts to cache all words  
**And**: Reports success/failure counts  
**And**: Higher priority items cached first  

### Test: preloadAudio_handlesErrors_gracefully
**Given**: Some words cannot generate TTS  
**When**: preloadAudio() called  
**Then**: Continues processing remaining words  
**And**: Returns failed words list  
**And**: Doesn't block successful caching  

### Test: audioCache_respectsMemoryLimits
**Given**: Cache is approaching memory limit  
**When**: New audio added to cache  
**Then**: Evicts least recently used items  
**And**: Stays within memory constraints  
**And**: Logs eviction statistics  

### Test: setAudioSettings_autoPlay_affectsCardBehavior
**Given**: Auto-play is enabled  
**When**: setAudioSettings() disables auto-play  
**Then**: Subsequent cards don't auto-play  
**And**: Manual play still works  
**And**: Setting is persisted  

### Test: generateTTS_withUnavailableVoice_fallsBack
**Given**: Requested voice is not available  
**When**: generateTTS() called  
**Then**: Uses default system voice  
**And**: Still generates audio successfully  
**And**: Returns appropriate metadata  

### Test: clearAudioCache_freesMemory
**Given**: Cache contains multiple audio files  
**When**: clearAudioCache() called  
**Then**: All cached audio removed  
**And**: Memory usage decreases  
**And**: Returns freed bytes count  

### Test: getCacheStatus_reportsAccurateStats
**Given**: Cache has been used for some time  
**When**: getCacheStatus() called  
**Then**: Returns current cache metrics  
**And**: Hit rate reflects actual usage  
**And**: Byte counts are accurate  

---

**Contract Status**: ✅ Complete - All audio handling and caching contracts defined