<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <header class="mb-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Deck Management</h1>
        <button 
          @click="$router.push('/')"
          class="text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
      </div>
    </header>

    <!-- Import Section -->
    <div class="bg-card rounded-lg border p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Import New Deck</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">CSV Content</label>
          <textarea 
            v-model="csvContent"
            rows="6"
            placeholder="word,translation,part_of_speech,hint
bonjour,hello,interjection,common greeting
merci,thank you,interjection,polite expression"
            class="w-full border rounded-md px-3 py-2 text-sm bg-background"
          ></textarea>
        </div>
        
        <button 
          @click="previewImport"
          :disabled="!csvContent.trim()"
          class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-4 py-2"
        >
          Preview Import
        </button>
      </div>

      <!-- Import Preview -->
      <div v-if="importPreview" class="mt-6 p-4 bg-muted/50 rounded-md">
        <h3 class="font-medium mb-2">Import Preview</h3>
        
        <div v-if="importPreview.success" class="space-y-2">
          <p class="text-sm text-green-600">
            ✓ {{ importPreview.preview.validRows }} valid rows, 
            {{ importPreview.preview.invalidRows }} invalid rows
          </p>
          
          <div v-if="importPreview.preview.sampleCards.length > 0">
            <p class="text-sm font-medium mb-2">Sample cards:</p>
            <div class="space-y-1">
              <div 
                v-for="card in importPreview.preview.sampleCards" 
                :key="card.word"
                class="text-xs bg-background p-2 rounded border"
              >
                <strong>{{ card.word }}</strong> ({{ card.partOfSpeech }}) → {{ card.translation }}
                <span v-if="card.hint" class="text-muted-foreground"> • {{ card.hint }}</span>
              </div>
            </div>
          </div>
          
          <div class="mt-4">
            <input 
              v-model="deckName" 
              placeholder="Enter deck name" 
              class="w-full border rounded-md px-3 py-2 text-sm bg-background mb-2"
            />
            <button 
              @click="confirmImport"
              :disabled="!deckName.trim()"
              class="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 rounded-md px-4 py-2 text-sm"
            >
              Create Deck
            </button>
          </div>
        </div>
        
        <div v-else class="text-sm text-red-600">
          <p>✗ Import failed:</p>
          <ul class="list-disc list-inside mt-1">
            <li v-for="error in importPreview.preview.errors" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Existing Decks -->
    <div class="bg-card rounded-lg border p-6">
      <h2 class="text-lg font-semibold mb-4">Your Decks</h2>
      
      <div class="space-y-3">
        <div 
          v-for="deck in allDecks" 
          :key="deck.id"
          class="flex items-center justify-between p-4 rounded-md border bg-muted/50"
        >
          <div class="flex-1">
            <h3 class="font-medium">{{ deck.name }}</h3>
            <p class="text-sm text-muted-foreground">{{ deck.description }}</p>
            <p class="text-xs text-muted-foreground mt-1">
              {{ deck.totalCards }} cards • {{ deck.category }} • 
              {{ deck.enabled ? 'Enabled' : 'Disabled' }}
            </p>
          </div>
          
          <div class="flex items-center space-x-2">
            <label class="flex items-center text-sm">
              <input 
                type="checkbox" 
                :checked="deck.enabled"
                @change="toggleDeck(deck.id, $event.target.checked)"
                class="mr-1"
              />
              Active
            </label>
            
            <button 
              @click="deleteDeck(deck.id)"
              class="text-red-600 hover:text-red-700 text-sm px-2 py-1"
              :disabled="deck.category === 'preset'"
            >
              Delete
            </button>
          </div>
        </div>

        <div v-if="allDecks.length === 0" class="text-center py-8 text-muted-foreground">
          <p>No decks created yet</p>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="mt-4 p-4 rounded-md" :class="messageClass">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDecksStore } from '@/stores/decks'

const decksStore = useDecksStore()

// State
const csvContent = ref('')
const deckName = ref('')
const importPreview = ref(null)
const message = ref('')
const messageType = ref('success')

// Computed
const allDecks = computed(() => decksStore.decks)
const messageClass = computed(() => ({
  'bg-green-100 text-green-800 border border-green-200': messageType.value === 'success',
  'bg-red-100 text-red-800 border border-red-200': messageType.value === 'error'
}))

// Methods
function previewImport() {
  if (!csvContent.value.trim()) return
  
  importPreview.value = decksStore.importFromCSV(csvContent.value)
  
  if (importPreview.value.success) {
    deckName.value = `Imported Deck ${new Date().toLocaleDateString()}`
  }
}

function confirmImport() {
  if (!importPreview.value?.success || !deckName.value.trim()) return
  
  try {
    // Add all the word cards from the preview
    const wordCardIds = []
    
    for (const cardData of importPreview.value.preview.sampleCards) {
      const result = decksStore.addWordCard(cardData)
      if (result.success) {
        wordCardIds.push(result.wordCard.id)
      }
    }
    
    // Create the deck
    const deckResult = decksStore.addDeck({
      name: deckName.value,
      description: `Imported from CSV on ${new Date().toLocaleDateString()}`,
      category: 'imported',
      source: 'user-upload',
      wordCardIds
    })
    
    if (deckResult.success) {
      showMessage('Deck created successfully!', 'success')
      csvContent.value = ''
      deckName.value = ''
      importPreview.value = null
    } else {
      showMessage(`Failed to create deck: ${deckResult.errors.join(', ')}`, 'error')
    }
  } catch (error) {
    showMessage(`Error creating deck: ${error.message}`, 'error')
  }
}

function toggleDeck(deckId, enabled) {
  const result = decksStore.updateDeckSettings(deckId, { enabled })
  if (result.success) {
    showMessage(`Deck ${enabled ? 'enabled' : 'disabled'}`, 'success')
  } else {
    showMessage(`Failed to update deck: ${result.errors.join(', ')}`, 'error')
  }
}

function deleteDeck(deckId) {
  const deck = allDecks.value.find(d => d.id === deckId)
  if (!deck) return
  
  if (deck.category === 'preset') {
    showMessage('Cannot delete preset decks', 'error')
    return
  }
  
  if (confirm(`Are you sure you want to delete "${deck.name}"?`)) {
    const result = decksStore.deleteDeck(deckId)
    if (result.success) {
      showMessage('Deck deleted successfully', 'success')
    } else {
      showMessage(`Failed to delete deck: ${result.message}`, 'error')
    }
  }
}

function showMessage(text, type = 'success') {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

// Initialize
onMounted(() => {
  decksStore.loadFromPersistence()
})
</script>