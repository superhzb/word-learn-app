<template>
  <div 
    class="bg-card rounded-lg border shadow-lg p-6 min-h-[400px] flex flex-col touch-target card-transition"
    :class="{ 'audio-playing': audioPlaying }"
    data-testid="word-card"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- Word Display Area -->
    <div class="flex-grow flex flex-col justify-center text-center mb-6">
      <!-- Word and Part of Speech -->
      <div 
        class="cursor-pointer select-none hover:text-primary transition-colors"
        :class="{ 'text-primary scale-105': audioPlaying }"
        data-testid="word"
        :aria-label="`Click to hear pronunciation of ${wordCard.word}`"
        @click="$emit('audio-play', wordCard.id)"
      >
        <h1 class="text-4xl font-bold mb-2">{{ wordCard.word }}</h1>
        <div class="text-lg text-muted-foreground">{{ wordCard.partOfSpeech }}</div>
      </div>

      <!-- Hint (only shown if revealed and exists) -->
      <div 
        v-if="revealed && wordCard.hint" 
        class="mt-4 text-muted-foreground text-sm italic"
      >
        {{ wordCard.hint }}
      </div>

      <!-- Translation (only shown when revealed) -->
      <div v-if="revealed" class="mt-6">
        <h2 class="text-2xl font-semibold mb-2">{{ wordCard.translation }}</h2>
      </div>
    </div>

    <!-- Action Area -->
    <div class="flex-shrink-0">
      <!-- Reveal Button (shown when not revealed) -->
      <button 
        v-if="!revealed"
        @click="$emit('reveal')"
        data-testid="reveal-button"
        class="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-3 font-medium transition-colors touch-target"
      >
        Reveal Answer
      </button>

      <!-- Action Buttons (shown when revealed) -->
      <div v-else class="grid grid-cols-2 gap-3">
        <button 
          @click="$emit('card-action', wordCard.id, 'not-remember')"
          data-testid="not-remember-button"
          class="bg-red-500 text-white hover:bg-red-600 rounded-md px-4 py-3 font-medium transition-colors touch-target"
        >
          Not Remember
        </button>
        <button 
          @click="$emit('card-action', wordCard.id, 'remember')"
          data-testid="remember-button"
          class="bg-green-500 text-white hover:bg-green-600 rounded-md px-4 py-3 font-medium transition-colors touch-target"
        >
          Remember
        </button>
      </div>
    </div>

    <!-- Touch Gesture Instructions -->
    <div class="text-xs text-muted-foreground text-center mt-3 md:hidden">
      <div v-if="!revealed">Tap word for audio • Tap button to reveal</div>
      <div v-else>Swipe ↑ Remember • Swipe ← Not Remember</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  wordCard: {
    type: Object,
    required: true
  },
  revealed: {
    type: Boolean,
    default: false
  },
  audioPlaying: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['audio-play', 'reveal', 'card-action'])

// Touch gesture handling
const touchStart = ref(null)
const touchEnd = ref(null)

function handleTouchStart(event) {
  touchStart.value = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY,
    time: Date.now()
  }
}

function handleTouchEnd(event) {
  if (!touchStart.value || !props.revealed) return

  touchEnd.value = {
    x: event.changedTouches[0].clientX,
    y: event.changedTouches[0].clientY,
    time: Date.now()
  }

  const deltaX = touchEnd.value.x - touchStart.value.x
  const deltaY = touchEnd.value.y - touchStart.value.y
  const deltaTime = touchEnd.value.time - touchStart.value.time

  // Check for valid swipe (minimum distance and maximum time)
  if (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50) return
  if (deltaTime > 300) return

  // Determine swipe direction
  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    // Vertical swipe
    if (deltaY < -50) {
      // Swipe up = Remember
      emit('card-action', props.wordCard.id, 'remember')
    }
  } else {
    // Horizontal swipe
    if (deltaX < -50) {
      // Swipe left = Not Remember
      emit('card-action', props.wordCard.id, 'not-remember')
    }
  }

  // Reset touch tracking
  touchStart.value = null
  touchEnd.value = null
}
</script>

<style scoped>
.audio-playing {
  @apply ring-2 ring-primary ring-opacity-50;
}

.card-transition {
  transition: transform 0.2s ease-out, opacity 0.2s ease-out, box-shadow 0.2s ease-out;
}

.card-transition:hover {
  @apply shadow-xl;
}

/* Responsive font sizing for very long words */
@media (max-width: 320px) {
  h1 {
    @apply text-3xl;
  }
}

/* Touch feedback */
.touch-target:active {
  @apply scale-95;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .card-transition {
    transition: none;
  }
}
</style>