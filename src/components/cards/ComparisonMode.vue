<template>
  <div 
    class="comparison-container w-full max-w-4xl mx-auto"
    :class="containerClasses"
    data-testid="comparison-container"
    aria-label="Comparison mode - practice similar words together"
  >
    <!-- Group Header -->
    <div class="text-center mb-6">
      <h2 class="text-lg font-semibold mb-2">Compare Similar Words</h2>
      <p class="text-sm text-muted-foreground">
        Study these {{ wordCards.length }} similar words together
      </p>
    </div>

    <!-- Cards Grid -->
    <div 
      class="cards-grid gap-4 mb-6"
      :class="gridClasses"
    >
      <div
        v-for="(card, index) in wordCards"
        :key="card.id"
        class="comparison-card bg-card border rounded-lg p-4 transition-all duration-200 cursor-pointer touch-target"
        :class="getCardClasses(card.id, index)"
        :data-testid="`comparison-card`"
        :role="'button'"
        :aria-label="`Word ${index + 1}: ${card.word}`"
        :tabindex="0"
        @click="highlightCard(card.id)"
        @keydown="handleKeydown($event, card.id)"
      >
        <!-- Card Content -->
        <div class="text-center">
          <!-- Word and Part of Speech -->
          <div 
            class="word-display cursor-pointer select-none transition-colors"
            :class="{ 'text-primary scale-105': isHighlighted(card.id) && audioPlayingCardId === card.id }"
            @click.stop="playCardAudio(card.id)"
          >
            <h3 class="text-2xl font-bold mb-1">{{ card.word }}</h3>
            <div class="text-sm text-muted-foreground">{{ card.partOfSpeech }}</div>
          </div>

          <!-- Audio Playing Indicator -->
          <div 
            v-if="audioPlayingCardId === card.id"
            class="audio-indicator playing mt-2"
            :data-testid="`audio-indicator-${card.id}`"
          >
            <div class="flex justify-center">
              <div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>

          <!-- Reveal Section -->
          <div v-if="revealedCards.has(card.id)" class="mt-4">
            <div class="text-lg font-medium mb-2">{{ card.translation }}</div>
            <div v-if="card.hint" class="text-sm text-muted-foreground italic">
              {{ card.hint }}
            </div>
          </div>

          <!-- Card Actions -->
          <div class="mt-4">
            <!-- Reveal Button -->
            <button
              v-if="!revealedCards.has(card.id)"
              @click.stop="revealCard(card.id)"
              :data-testid="`reveal-button-${card.id}`"
              class="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2 text-sm font-medium transition-colors touch-target"
            >
              Reveal
            </button>

            <!-- Action Buttons -->
            <div v-else class="grid grid-cols-2 gap-2">
              <button
                @click.stop="recordAction(card.id, 'not-remember')"
                :data-testid="`not-remember-button-${card.id}`"
                :disabled="completedCards.has(card.id)"
                class="bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-3 py-2 text-sm font-medium transition-colors touch-target"
              >
                Don't Know
              </button>
              <button
                @click.stop="recordAction(card.id, 'remember')"
                :data-testid="`remember-button-${card.id}`"
                :disabled="completedCards.has(card.id)"
                class="bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-3 py-2 text-sm font-medium transition-colors touch-target"
              >
                Know
              </button>
            </div>
          </div>

          <!-- Completed Indicator -->
          <div v-if="completedCards.has(card.id)" class="mt-2">
            <div class="text-xs text-green-600 font-medium">✓ Completed</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-section">
      <div class="flex justify-between items-center mb-2 text-sm">
        <span>Group Progress</span>
        <span>{{ completedCards.size }}/{{ wordCards.length }}</span>
      </div>
      <div class="bg-muted h-2 rounded-full overflow-hidden">
        <div 
          class="bg-primary h-full transition-all duration-300"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="instructions text-center mt-4 text-sm text-muted-foreground">
      <div class="hidden md:block">
        Click cards to hear pronunciation • Use arrow keys to navigate
      </div>
      <div class="md:hidden">
        Tap cards to hear pronunciation • Tap buttons to answer
      </div>
    </div>

    <!-- Screen Reader Announcements -->
    <div class="sr-only" aria-live="polite" ref="announcements">
      {{ currentAnnouncement }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  wordCards: {
    type: Array,
    required: true,
    validator: (cards) => cards.length >= 2 && cards.length <= 6
  },
  highlightedCardId: {
    type: String,
    default: null
  },
  revealedCards: {
    type: Set,
    default: () => new Set()
  },
  completedCards: {
    type: Set, 
    default: () => new Set()
  },
  audioPlayingCardId: {
    type: String,
    default: null
  }
})

const emit = defineEmits([
  'card-highlight',
  'card-reveal', 
  'card-action',
  'audio-play',
  'audio-stop',
  'group-complete'
])

// State
const announcements = ref('')
const currentAnnouncement = ref('')

// Computed properties
const containerClasses = computed(() => ({
  'mobile-single-column': window.innerWidth < 640,
  'tablet-two-columns': window.innerWidth >= 640 && window.innerWidth < 1024,
  'desktop-grid': window.innerWidth >= 1024
}))

const gridClasses = computed(() => {
  const cardCount = props.wordCards.length
  if (window.innerWidth < 640) {
    return 'flex flex-col' // Mobile: vertical stack
  } else if (window.innerWidth < 1024) {
    return cardCount <= 2 ? 'grid grid-cols-2' : 'grid grid-cols-2' // Tablet: 2 columns
  } else {
    // Desktop: responsive grid based on card count
    if (cardCount <= 2) return 'grid grid-cols-2'
    if (cardCount <= 3) return 'grid grid-cols-3'
    if (cardCount <= 4) return 'grid grid-cols-2'
    return 'grid grid-cols-3' // 5-6 cards
  }
})

const progressPercentage = computed(() => {
  const total = props.wordCards.length
  const completed = props.completedCards.size
  return total > 0 ? (completed / total) * 100 : 0
})

// Methods
function getCardClasses(cardId, index) {
  return {
    'highlighted': isHighlighted(cardId),
    'completed': props.completedCards.has(cardId),
    'ring-2 ring-primary': isHighlighted(cardId),
    'opacity-75': props.completedCards.has(cardId)
  }
}

function isHighlighted(cardId) {
  return props.highlightedCardId === cardId
}

function highlightCard(cardId) {
  emit('card-highlight', cardId)
  playCardAudio(cardId)
  announceCardChange(cardId)
}

function playCardAudio(cardId) {
  // Stop current audio
  if (props.audioPlayingCardId) {
    emit('audio-stop')
  }
  
  // Play new audio
  emit('audio-play', cardId)
}

function revealCard(cardId) {
  emit('card-reveal', cardId)
  
  const card = props.wordCards.find(c => c.id === cardId)
  if (card) {
    announceText(`Revealed: ${card.word} means ${card.translation}`)
  }
}

function recordAction(cardId, action) {
  emit('card-action', cardId, action)
  
  // Check if group is complete
  nextTick(() => {
    if (props.completedCards.size === props.wordCards.length) {
      emit('group-complete')
      announceText('All words in this group completed!')
    }
  })
}

function handleKeydown(event, cardId) {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!props.revealedCards.has(cardId)) {
        revealCard(cardId)
      }
      break
    case 'ArrowRight':
      event.preventDefault()
      navigateToNextCard(cardId, 1)
      break
    case 'ArrowLeft':
      event.preventDefault()
      navigateToNextCard(cardId, -1)
      break
    case 'ArrowUp':
      event.preventDefault()
      if (props.revealedCards.has(cardId)) {
        recordAction(cardId, 'remember')
      }
      break
    case 'ArrowDown':
      event.preventDefault()
      if (props.revealedCards.has(cardId)) {
        recordAction(cardId, 'not-remember')
      }
      break
  }
}

function navigateToNextCard(currentCardId, direction) {
  const currentIndex = props.wordCards.findIndex(card => card.id === currentCardId)
  const nextIndex = (currentIndex + direction + props.wordCards.length) % props.wordCards.length
  const nextCard = props.wordCards[nextIndex]
  
  if (nextCard) {
    highlightCard(nextCard.id)
  }
}

function announceCardChange(cardId) {
  const card = props.wordCards.find(c => c.id === cardId)
  const cardIndex = props.wordCards.findIndex(c => c.id === cardId) + 1
  
  if (card) {
    announceText(`Card ${cardIndex}: ${card.word}`)
  }
}

function announceText(text) {
  currentAnnouncement.value = text
  // Clear after announcement
  setTimeout(() => {
    currentAnnouncement.value = ''
  }, 2000)
}

// Auto-highlight first card on mount
if (props.wordCards.length > 0 && !props.highlightedCardId) {
  nextTick(() => {
    emit('card-highlight', props.wordCards[0].id)
  })
}

// Watch for completion
watch(() => props.completedCards.size, (newSize) => {
  if (newSize === props.wordCards.length && newSize > 0) {
    announceText('Comparison group completed successfully!')
  }
})
</script>

<style scoped>
.comparison-container {
  container-type: inline-size;
}

.comparison-card {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.comparison-card.highlighted {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.comparison-card.completed {
  background: rgba(34, 197, 94, 0.05);
  border-color: rgba(34, 197, 94, 0.2);
}

.word-display:hover {
  transform: scale(1.02);
}

.audio-indicator.playing {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Responsive adjustments */
@container (max-width: 640px) {
  .comparison-card {
    min-height: 240px;
  }
  
  .word-display h3 {
    font-size: 1.5rem;
  }
}

@container (min-width: 1024px) {
  .comparison-card {
    min-height: 320px;
  }
}

/* Touch-friendly improvements */
@media (hover: none) {
  .comparison-card:hover {
    transform: none;
  }
  
  .comparison-card:active {
    transform: scale(0.98);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .comparison-card.highlighted {
    border-width: 3px;
  }
}

/* Reduce motion support */
@media (prefers-reduced-motion: reduce) {
  .comparison-card,
  .word-display,
  .audio-indicator.playing {
    transition: none;
    animation: none;
  }
}
</style>