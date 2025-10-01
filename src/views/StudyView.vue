<template>
  <div class="min-h-screen bg-background">
    <!-- Progress Header -->
    <header class="bg-card border-b px-4 py-3">
      <div class="flex justify-between items-center max-w-md mx-auto">
        <button 
          @click="goBack"
          class="text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
        
        <div class="text-center">
          <div class="text-sm font-medium">{{ currentPosition }}/{{ totalCards }}</div>
          <div class="text-xs text-muted-foreground">{{ remainingCards }} remaining</div>
        </div>
        
        <button 
          @click="showSettings = true"
          class="text-muted-foreground hover:text-foreground"
        >
          ⚙️
        </button>
      </div>
    </header>

    <!-- Progress Bar -->
    <div class="bg-muted h-1">
      <div 
        class="bg-primary h-full transition-all duration-300"
        :style="{ width: `${progressPercentage}%` }"
      ></div>
    </div>

    <!-- Retry Cards Timer -->
    <div v-if="retryCards.length > 0" class="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div class="flex justify-between items-center max-w-md mx-auto text-sm">
        <span class="text-yellow-800">
          {{ retryCards.length }} card{{ retryCards.length > 1 ? 's' : '' }} waiting: {{ formatRetryTime(retryCards[0].remainingTime) }}
        </span>
        <div class="space-x-2">
          <button 
            @click="skipRetry(retryCards[0].cardId)"
            class="text-yellow-600 hover:text-yellow-800 font-medium"
          >
            Skip
          </button>
          <button 
            @click="skipAllRetries"
            class="text-yellow-600 hover:text-yellow-800 font-medium"
          >
            Skip All
          </button>
        </div>
      </div>
    </div>

    <!-- Main Study Area -->
    <main class="flex-1 flex items-center justify-center p-4">
      <div v-if="loading" class="text-center">
        <div class="text-lg font-medium mb-2">Loading words...</div>
        <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>

      <div v-else-if="currentCards && cardType === 'comparison'" class="w-full">
        <ComparisonMode 
          :word-cards="currentCards"
          :highlighted-card-id="highlightedCardId"
          :revealed-cards="revealedComparisonCards"
          :completed-cards="completedComparisonCards"
          :audio-playing-card-id="audioPlayingCardId"
          @card-highlight="handleCardHighlight"
          @card-reveal="handleCardReveal"
          @card-action="handleComparisonCardAction"
          @audio-play="playAudio"
          @audio-stop="stopAudio"
          @group-complete="handleGroupComplete"
        />
      </div>
      <div v-else-if="currentCard && cardType === 'single'" class="w-full max-w-md">
        <WordCard 
          :word-card="currentCard"
          :revealed="cardRevealed"
          :audio-playing="audioPlaying"
          @audio-play="playAudio"
          @reveal="revealCard"
          @card-action="handleCardAction"
        />
      </div>

      <div v-else-if="sessionComplete" class="text-center max-w-md mx-auto">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold mb-4">Session Complete!</h2>
        <div class="bg-card rounded-lg border p-6 mb-6">
          <div class="grid grid-cols-2 gap-4 text-center mb-4">
            <div>
              <div class="text-2xl font-bold text-green-600">{{ sessionStats.rememberedCards }}</div>
              <div class="text-sm text-muted-foreground">Remembered</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-red-600">{{ sessionStats.forgottenCards }}</div>
              <div class="text-sm text-muted-foreground">Forgotten</div>
            </div>
          </div>
          <div class="text-sm text-muted-foreground space-y-1">
            <div>Time: {{ sessionStats.timeSpent }} minutes</div>
            <div>Avg Response: {{ sessionStats.averageResponseTime.toFixed(1) }}s</div>
            <div>Streak: {{ sessionStats.streak }} days</div>
          </div>
        </div>
        <button 
          @click="goBack"
          class="w-full bg-primary text-primary-foreground rounded-md px-4 py-3 font-medium"
        >
          Return to Menu
        </button>
      </div>

      <div v-else class="text-center">
        <p class="text-muted-foreground mb-4">No cards available for study</p>
        <button 
          @click="goBack"
          class="bg-primary text-primary-foreground rounded-md px-4 py-2"
        >
          Back to Menu
        </button>
      </div>
    </main>

    <!-- Settings Modal -->
    <div v-if="showSettings" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-background rounded-lg max-w-md w-full p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Settings</h3>
          <button @click="showSettings = false" class="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        
        <div class="space-y-4">
          <label class="flex items-center justify-between">
            <span>Auto-play audio</span>
            <input type="checkbox" v-model="autoPlayAudio" class="ml-2" />
          </label>
          
          <label class="flex items-center justify-between">
            <span>Show hints</span>
            <input type="checkbox" v-model="showHints" class="ml-2" />
          </label>

          <div class="space-y-2">
            <label class="block text-sm font-medium">Voice</label>
            <select v-model="selectedVoice" class="w-full border rounded-md px-3 py-2 bg-background">
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>
        
        <button 
          @click="saveSettings"
          class="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 mt-4"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useDecksStore } from '@/stores/decks'
import { useProgressStore } from '@/stores/progress'
import { sessionService } from '@/services/SessionService'
import { audioService } from '@/services/AudioService'
import WordCard from '@/components/cards/WordCard.vue'
import ComparisonMode from '@/components/cards/ComparisonMode.vue'

const router = useRouter()
const decksStore = useDecksStore()
const progressStore = useProgressStore()

// State
const loading = ref(true)
const currentCard = ref(null)
const currentCards = ref([])
const cardType = ref('single') // 'single' | 'comparison'
const cardRevealed = ref(false)
const audioPlaying = ref(false)
const audioPlayingCardId = ref(null)
const sessionComplete = ref(false)
const showSettings = ref(false)

// Comparison mode state
const highlightedCardId = ref(null)
const revealedComparisonCards = ref(new Set())
const completedComparisonCards = ref(new Set())

// Study session state
const currentSession = ref(null)
const retryCards = ref([])
const sessionStats = ref({
  rememberedCards: 0,
  forgottenCards: 0,
  timeSpent: 0,
  averageResponseTime: 0,
  streak: 0
})

// Settings
const autoPlayAudio = ref(true)
const showHints = ref(true)
const selectedVoice = ref('female')

// Response timing
const cardStartTime = ref(null)

// Computed
const currentPosition = computed(() => 
  currentSession.value?.cardsCompleted + 1 || 1
)

const totalCards = computed(() => 
  currentSession.value?.totalCards || 0
)

const remainingCards = computed(() => 
  currentSession.value?.cardsRemaining || 0
)

const progressPercentage = computed(() => 
  totalCards.value > 0 ? ((currentPosition.value - 1) / totalCards.value) * 100 : 0
)

// Methods
async function initializeSession() {
  loading.value = true
  
  try {
    // Load progress store
    progressStore.loadFromPersistence()
    
    // Get available decks
    const availableDecks = decksStore.getAvailableDecksForStudy
    if (availableDecks.length === 0) {
      sessionComplete.value = true
      loading.value = false
      return
    }

    // Create session
    const sessionResult = await sessionService.createSession({
      deckIds: availableDecks.map(deck => deck.id),
      roundSize: 20, // Larger rounds to better utilize 30 cards
      newReviewRatio: 80, // More new cards for testing
      sessionType: 'mixed'
    })

    if (!sessionResult.success) {
      console.error('Failed to create session:', sessionResult.error)
      sessionComplete.value = true
      loading.value = false
      return
    }

    currentSession.value = sessionResult.session
    await loadNextCard()
    
  } catch (error) {
    console.error('Session initialization failed:', error)
    sessionComplete.value = true
  } finally {
    loading.value = false
  }
}

async function loadNextCard() {
  try {
    const nextCardResult = await sessionService.getNextCard()
    
    if (nextCardResult.type === 'session-complete') {
      await completeSession(nextCardResult.sessionSummary)
      return
    }

    if (nextCardResult.type === 'comparison' && nextCardResult.data?.cards?.length > 1) {
      // Comparison mode
      cardType.value = 'comparison'
      currentCards.value = nextCardResult.data.cards
      currentCard.value = null
      
      // Reset comparison state
      highlightedCardId.value = currentCards.value[0]?.id || null
      revealedComparisonCards.value = new Set()
      completedComparisonCards.value = new Set()
      
      cardStartTime.value = Date.now()
      
    } else if (nextCardResult.type === 'single' && nextCardResult.data?.cards?.length > 0) {
      // Single card mode
      cardType.value = 'single'
      currentCard.value = nextCardResult.data.cards[0]
      currentCards.value = []
      cardRevealed.value = false
      cardStartTime.value = Date.now()
      
      // Auto-play audio if enabled
      if (autoPlayAudio.value && currentCard.value) {
        setTimeout(() => playAudio(currentCard.value.id), 500)
      }
    } else {
      await completeSession()
    }
    
    // Update retry cards
    const retryResult = await sessionService.getRetryCards()
    retryCards.value = retryResult.retryCards
    
  } catch (error) {
    console.error('Failed to load next card:', error)
    await completeSession()
  }
}

function revealCard() {
  cardRevealed.value = true
}

async function handleCardAction(cardId, action) {
  if (!currentCard.value || cardId !== currentCard.value.id) return

  try {
    // Calculate response time
    const responseTime = cardStartTime.value 
      ? (Date.now() - cardStartTime.value) / 1000 
      : 0

    // Record the result
    const result = await sessionService.recordCardResult(cardId, {
      action,
      responseTime,
      sessionType: 'normal'
    })

    if (result.success) {
      // Update session stats
      if (action === 'remember') {
        sessionStats.value.rememberedCards++
      } else {
        sessionStats.value.forgottenCards++
      }

      // Brief pause for feedback, then load next card
      setTimeout(() => {
        loadNextCard()
      }, 300)
    } else {
      console.error('Failed to record card result:', result.error)
    }
  } catch (error) {
    console.error('Error handling card action:', error)
    // Continue anyway
    setTimeout(() => {
      loadNextCard()
    }, 300)
  }
}

async function playAudio(cardId = null) {
  let card
  
  if (cardType.value === 'comparison') {
    card = currentCards.value.find(c => c.id === cardId)
    audioPlayingCardId.value = cardId
  } else {
    card = cardId ? currentCard.value : currentCard.value
  }
  
  if (!card?.word) return
  
  audioPlaying.value = true
  
  try {
    const result = await audioService.playWordAudio(card.word, 'fr', selectedVoice.value)
    
    // Audio playing indication
    setTimeout(() => {
      audioPlaying.value = false
      audioPlayingCardId.value = null
    }, 1500)
  } catch (error) {
    console.error('Audio playback failed:', error)
    audioPlaying.value = false
    audioPlayingCardId.value = null
  }
}

function stopAudio() {
  audioPlaying.value = false
  audioPlayingCardId.value = null
  // In a full implementation, this would stop the actual audio playback
}

// Comparison mode handlers
function handleCardHighlight(cardId) {
  highlightedCardId.value = cardId
}

function handleCardReveal(cardId) {
  revealedComparisonCards.value.add(cardId)
}

async function handleComparisonCardAction(cardId, action) {
  try {
    // Calculate response time
    const responseTime = cardStartTime.value 
      ? (Date.now() - cardStartTime.value) / 1000 
      : 0

    // Record the result
    const result = await sessionService.recordCardResult(cardId, {
      action,
      responseTime,
      sessionType: 'comparison'
    })

    if (result.success) {
      // Mark card as completed
      completedComparisonCards.value.add(cardId)
      
      // Update session stats
      if (action === 'remember') {
        sessionStats.value.rememberedCards++
      } else {
        sessionStats.value.forgottenCards++
      }
    } else {
      console.error('Failed to record card result:', result.error)
    }
  } catch (error) {
    console.error('Error handling comparison card action:', error)
  }
}

function handleGroupComplete() {
  // Brief pause for feedback, then load next card/group
  setTimeout(() => {
    loadNextCard()
  }, 1000)
}

async function skipRetry(cardId) {
  try {
    await sessionService.skipRetryWait(cardId)
    const retryResult = await sessionService.getRetryCards()
    retryCards.value = retryResult.retryCards
  } catch (error) {
    console.error('Failed to skip retry:', error)
  }
}

async function skipAllRetries() {
  try {
    await sessionService.skipRetryWait()
    retryCards.value = []
  } catch (error) {
    console.error('Failed to skip all retries:', error)
  }
}

async function completeSession(summary = null) {
  sessionComplete.value = true
  
  if (summary) {
    sessionStats.value = summary
  } else {
    const result = await sessionService.completeSession()
    sessionStats.value = result.summary
  }
}

function formatRetryTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

async function saveSettings() {
  try {
    await audioService.setAudioSettings({
      autoPlay: autoPlayAudio.value,
      voice: selectedVoice.value
    })
    showSettings.value = false
  } catch (error) {
    console.error('Failed to save audio settings:', error)
  }
}

function goBack() {
  router.push('/')
}

// Keyboard shortcuts
function handleKeydown(event) {
  if (showSettings.value) return

  switch(event.key) {
    case ' ':
    case 'Enter':
      event.preventDefault()
      if (!cardRevealed.value) {
        revealCard()
      }
      break
    case 'ArrowUp':
    case 'w':
      event.preventDefault()
      if (cardRevealed.value && currentCard.value) {
        handleCardAction(currentCard.value.id, 'remember')
      }
      break
    case 'ArrowLeft':
    case 'a':
      event.preventDefault()
      if (cardRevealed.value && currentCard.value) {
        handleCardAction(currentCard.value.id, 'not-remember')
      }
      break
    case 'p':
      event.preventDefault()
      playAudio()
      break
  }
}

// Update retry cards timer
let retryUpdateInterval = null

function startRetryTimer() {
  retryUpdateInterval = setInterval(async () => {
    if (retryCards.value.length > 0) {
      const updated = retryCards.value.map(card => ({
        ...card,
        remainingTime: Math.max(0, card.remainingTime - 1)
      }))
      
      retryCards.value = updated.filter(card => card.remainingTime > 0)
      
      // If any cards are ready, reload next card
      if (updated.some(card => card.remainingTime === 0)) {
        await loadNextCard()
      }
    }
  }, 1000)
}

// Lifecycle
onMounted(async () => {
  // Load audio settings
  const audioSettings = await audioService.getAudioSettings()
  autoPlayAudio.value = audioSettings.autoPlay
  selectedVoice.value = audioSettings.voice

  await initializeSession()
  document.addEventListener('keydown', handleKeydown)
  startRetryTimer()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (retryUpdateInterval) {
    clearInterval(retryUpdateInterval)
  }
})
</script>