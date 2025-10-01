# Deck Service Contract

**Service**: DeckService  
**Type**: Frontend Service (no HTTP endpoints)  
**Purpose**: Manage vocabulary decks and word cards

## Service Interface

### getDeckList()
**Purpose**: Retrieve all available decks with metadata  
**Input**: None  
**Output**: 
```typescript
{
  decks: Array<{
    id: string
    name: string
    description: string
    category: 'preset' | 'imported' | 'generated'
    enabled: boolean
    totalCards: number
    newCardsToday: number
    reviewsDue: number
  }>
}
```

### getDeckById(id: string)
**Purpose**: Get detailed deck information including all word cards  
**Input**: `{ id: string }`  
**Output**:
```typescript
{
  deck: {
    id: string
    name: string
    description: string
    category: string
    source: string
    enabled: boolean
    wordCards: WordCard[]
    createdAt: string
    updatedAt: string
  }
}
```

### createDeck(deckData: CreateDeckRequest)
**Purpose**: Create new deck from user input  
**Input**:
```typescript
{
  name: string
  description: string
  category: 'imported' | 'generated'
  wordCards: Array<{
    word: string
    translation: string
    partOfSpeech?: string
    hint?: string
  }>
}
```
**Output**:
```typescript
{
  success: boolean
  deck?: Deck
  errors?: string[]
}
```

### updateDeckSettings(id: string, settings: DeckSettings)
**Purpose**: Update deck configuration  
**Input**:
```typescript
{
  id: string
  settings: {
    name?: string
    description?: string
    enabled?: boolean
  }
}
```
**Output**: `{ success: boolean, errors?: string[] }`

### importFromCSV(csvContent: string)
**Purpose**: Parse and validate CSV import  
**Input**: `{ csvContent: string }`  
**Output**:
```typescript
{
  success: boolean
  preview?: {
    validRows: number
    invalidRows: number
    sampleCards: WordCard[]
    errors: Array<{
      row: number
      field: string
      message: string
    }>
  }
  deck?: Deck
}
```

### deleteDeck(id: string)
**Purpose**: Remove deck and associated progress  
**Input**: `{ id: string }`  
**Output**: `{ success: boolean, message?: string }`

### getAvailableDecksForStudy()
**Purpose**: Get enabled decks with available cards  
**Input**: None  
**Output**:
```typescript
{
  decks: Array<{
    id: string
    name: string
    newCards: number
    reviewsDue: number
    totalAvailable: number
  }>
}
```

## Test Scenarios

### Test: getDeckList_returnsAllDecks
**Given**: Multiple decks exist in storage  
**When**: getDeckList() is called  
**Then**: Returns array with all deck summaries  
**And**: Each deck has correct card counts  
**And**: Response matches interface exactly  

### Test: createDeck_withValidData_succeeds
**Given**: Valid deck creation request  
**When**: createDeck() is called  
**Then**: New deck is saved to storage  
**And**: Returns success with deck ID  
**And**: All word cards are properly associated  

### Test: createDeck_withInvalidData_fails
**Given**: Deck request missing required fields  
**When**: createDeck() is called  
**Then**: Returns success: false  
**And**: Provides detailed error messages  
**And**: No data is saved to storage  

### Test: importFromCSV_withValidData_succeeds
**Given**: Well-formed CSV with word,translation columns  
**When**: importFromCSV() is called  
**Then**: Returns preview with parsed data  
**And**: No validation errors  
**And**: Sample cards match input data  

### Test: importFromCSV_withErrors_providesDetailedFeedback
**Given**: CSV with missing columns and invalid rows  
**When**: importFromCSV() is called  
**Then**: Returns errors array with row numbers  
**And**: Identifies missing/invalid fields  
**And**: Includes valid rows count  

### Test: updateDeckSettings_enabledToggle_affectsStudyAvailability
**Given**: Deck is enabled and has available cards  
**When**: updateDeckSettings() disables the deck  
**Then**: getAvailableDecksForStudy() excludes the deck  
**And**: Deck settings are persisted  

### Test: deleteDeck_withProgress_cleansUpCompletely
**Given**: Deck has associated progress entries  
**When**: deleteDeck() is called  
**Then**: Deck is removed from storage  
**And**: All associated progress is deleted  
**And**: Confusing word groups are updated  

---

**Contract Status**: ✅ Complete - All service methods and test scenarios defined