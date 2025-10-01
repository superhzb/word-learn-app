<template>
  <div class="container mx-auto px-4 py-8 max-w-md">
    <header class="text-center mb-8">
      <h1 class="text-3xl font-bold text-primary mb-2">Word Learn App</h1>
      <p class="text-muted-foreground">Vocabulary learning through spaced repetition</p>
    </header>

    <!-- Today's Task Summary -->
    <div class="bg-card rounded-lg border p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Today's Task</h2>
      
      <div class="text-center mb-4">
        <div class="text-2xl font-bold text-primary mb-1">
          {{ totalNewCards }} new cards, {{ totalReviews }} reviews
        </div>
      </div>

      <button 
        @click="startLearning"
        :disabled="totalAvailable === 0"
        class="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-4 py-3 font-medium transition-colors"
      >
        {{ totalAvailable === 0 ? 'No cards available' : 'Start Learning' }}
      </button>
    </div>

    <!-- Deck Management -->
    <div class="bg-card rounded-lg border p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Your Decks</h2>
        <button 
          @click="showDeckManager = true"
          class="text-primary hover:text-primary/80 text-sm font-medium"
        >
          Manage
        </button>
      </div>

      <div class="space-y-3">
        <div 
          v-for="deck in availableDecks" 
          :key="deck.id"
          class="flex items-center justify-between p-3 rounded-md border bg-muted/50"
        >
          <div>
            <h3 class="font-medium">{{ deck.name }}</h3>
            <p class="text-sm text-muted-foreground">
              {{ deck.newCards }} new • {{ deck.reviewsDue }} reviews
            </p>
          </div>
          <div class="text-right">
            <div class="text-sm font-medium">{{ deck.totalAvailable }}</div>
            <div class="text-xs text-muted-foreground">cards</div>
          </div>
        </div>

        <div v-if="availableDecks.length === 0" class="text-center py-8 text-muted-foreground">
          <p>No decks available</p>
          <button 
            @click="initializeSampleData"
            class="mt-2 text-primary hover:text-primary/80 text-sm font-medium"
          >
            Add sample deck
          </button>
        </div>
      </div>
    </div>

    <!-- Simple Deck Manager Modal -->
    <div v-if="showDeckManager" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-background rounded-lg max-w-md w-full p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Manage Decks</h3>
          <button @click="showDeckManager = false" class="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        
        <div class="space-y-2">
          <div 
            v-for="deck in allDecks" 
            :key="deck.id"
            class="flex items-center justify-between p-2 rounded border"
          >
            <span>{{ deck.name }}</span>
            <label class="flex items-center">
              <input 
                type="checkbox" 
                :checked="deck.enabled"
                @change="toggleDeck(deck.id, $event.target.checked)"
                class="mr-2"
              />
              <span class="text-sm">Enabled</span>
            </label>
          </div>
        </div>
        
        <div class="mt-4 pt-4 border-t">
          <button 
            @click="showDeckManager = false"
            class="w-full bg-primary text-primary-foreground rounded-md px-4 py-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDecksStore } from '@/stores/decks'
import { useProgressStore } from '@/stores/progress'

const router = useRouter()
const decksStore = useDecksStore()
const progressStore = useProgressStore()

const showDeckManager = ref(false)

// Computed properties
const allDecks = computed(() => decksStore.decks)
const availableDecks = computed(() => decksStore.getAvailableDecksForStudy)

const totalNewCards = computed(() => 
  availableDecks.value.reduce((sum, deck) => sum + deck.newCards, 0)
)

const totalReviews = computed(() => 
  availableDecks.value.reduce((sum, deck) => sum + deck.reviewsDue, 0)
)

const totalAvailable = computed(() => totalNewCards.value + totalReviews.value)

// Methods
function startLearning() {
  if (totalAvailable.value > 0) {
    router.push('/study')
  }
}

function toggleDeck(deckId, enabled) {
  decksStore.updateDeckSettings(deckId, { enabled })
}

function initializeSampleData() {
  decksStore.initializeWithSampleData()
}

// Initialize on mount
onMounted(() => {
  decksStore.loadFromPersistence()
  progressStore.loadFromPersistence()
  
  // If no decks exist, initialize with sample data
  if (allDecks.value.length === 0) {
    initializeSampleData()
  }
})
</script>