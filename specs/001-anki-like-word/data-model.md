# Data Model: Anki-like Word Recite App

**Feature**: 001-anki-like-word  
**Date**: 2024-09-30  
**Status**: Complete  

## Core Entities

### WordCard
Represents individual vocabulary items for learning.

**Attributes**:
- `id`: string (unique identifier)
- `word`: string (the vocabulary word)
- `translation`: string (primary translation)
- `partOfSpeech`: string (noun, verb, adjective, etc.)
- `hint`: string | null (optional learning hint)
- `audioUrl`: string | null (pronunciation audio file path)
- `difficulty`: 'new' | 'easy' | 'medium' | 'hard'
- `cefr`: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null
- `tags`: string[] (categorization tags)
- `createdAt`: Date
- `updatedAt`: Date

**Validation Rules**:
- `word` and `translation` are required and non-empty
- `partOfSpeech` must be from predefined list
- `hint` max length: 200 characters
- `audioUrl` must be valid URL or null

**Relationships**:
- Belongs to one or more Decks
- Has many ProgressEntries
- Can belong to multiple ConfusingWordGroups

### Deck
Collection of vocabulary words organized by theme, level, or user preference.

**Attributes**:
- `id`: string (unique identifier)
- `name`: string (display name)
- `description`: string (deck description)
- `category`: 'preset' | 'imported' | 'generated'
- `source`: string (origin: 'french-a1', 'user-upload', 'confusing-words', etc.)
- `enabled`: boolean (active in study sessions)
- `totalCards`: number (computed: count of word cards)
- `newCardsToday`: number (computed: unlearned cards)
- `reviewsDue`: number (computed: cards due for review)
- `createdAt`: Date
- `updatedAt`: Date

**Validation Rules**:
- `name` required, max 100 characters
- `description` max 500 characters
- `category` must be from enum
- `totalCards` auto-calculated, read-only

**Relationships**:
- Contains many WordCards
- Referenced by StudySession

### ProgressEntry
Tracks individual word learning progress and spaced repetition scheduling.

**Attributes**:
- `wordId`: string (foreign key to WordCard)
- `reviewCount`: number (total times reviewed)
- `successCount`: number (times marked as "remember")
- `failureCount`: number (times marked as "not remember")
- `currentInterval`: number (days until next review)
- `easeFactor`: number (SM-2 algorithm ease factor)
- `lastReviewDate`: Date | null
- `nextReviewDate`: Date | null
- `lastResult`: 'remember' | 'not-remember' | null
- `status`: 'new' | 'learning' | 'review' | 'suspended'
- `reviewHistory`: ReviewEntry[] (last 10 reviews)
- `createdAt`: Date
- `updatedAt`: Date

**Validation Rules**:
- `reviewCount` >= 0
- `successCount` + `failureCount` <= `reviewCount`
- `currentInterval` >= 0
- `easeFactor` between 1.3 and 2.5
- `nextReviewDate` >= `lastReviewDate` when both exist

**Relationships**:
- Belongs to one WordCard
- Contains ReviewEntry history

### ReviewEntry
Individual review attempt record for detailed tracking.

**Attributes**:
- `timestamp`: Date
- `result`: 'remember' | 'not-remember'
- `responseTime`: number (seconds to respond)
- `sessionType`: 'normal' | 'comparison' | 'retry'
- `difficulty`: 'easy' | 'medium' | 'hard' (user-perceived)

### StudySession
Represents a learning session with rounds and progress tracking.

**Attributes**:
- `id`: string
- `startTime`: Date
- `endTime`: Date | null
- `deckIds`: string[] (active decks)
- `roundSize`: number (cards per round, default 50)
- `currentRound`: number
- `totalRounds`: number
- `cardsCompleted`: number
- `cardsRemaining`: number
- `sessionType`: 'mixed' | 'new-only' | 'review-only' | 'comparison-only'
- `newReviewRatio`: number (0-100, percentage of new cards)
- `status`: 'active' | 'paused' | 'completed' | 'abandoned'
- `statistics`: SessionStats

**SessionStats**:
- `totalCards`: number
- `rememberedCards`: number
- `forgottenCards`: number
- `averageResponseTime`: number
- `comparisonGroupsShown`: number

### ConfusingWordGroup
Groups similar words for comparison-based learning.

**Attributes**:
- `id`: string
- `name`: string (group identifier)
- `wordIds`: string[] (member word IDs)
- `source`: 'system' | 'user'
- `confidence`: number (0-100, system confidence in similarity)
- `category`: string (similarity type: 'phonetic', 'spelling', 'meaning', etc.)
- `createdAt`: Date
- `updatedAt`: Date

**Validation Rules**:
- Minimum 2 words per group
- Maximum 6 words per group for UI constraints
- `confidence` between 0 and 100

### UserSettings
Application configuration and preferences.

**Attributes**:
- `audioEnabled`: boolean
- `autoPlayAudio`: boolean
- `voiceGender`: 'male' | 'female'
- `fontSize`: 'small' | 'normal' | 'large' | 'huge'
- `theme`: 'light' | 'dark' | 'auto'
- `roundSize`: number (default 50)
- `newReviewRatio`: number (default 50)
- `gesturesEnabled`: boolean
- `animationsEnabled`: boolean
- `notificationsEnabled`: boolean

## Entity Relationships

```
WordCard ──┐
           ├─── Deck (many-to-many)
           ├─── ProgressEntry (one-to-one)
           └─── ConfusingWordGroup (many-to-many)

StudySession ──── Deck (many-to-many via deckIds)

ProgressEntry ──── ReviewEntry[] (one-to-many, embedded)
```

## State Transitions

### WordCard Learning Status
```
new → learning → review → mastered
  ↓      ↓         ↓
suspended ← ← ← ← ←
```

### StudySession Status
```
active → paused → active
  ↓        ↓
completed/abandoned
```

## Data Storage Strategy

### LocalStorage Structure
```javascript
{
  // Persisted data
  "word-app": {
    "decks": Deck[],
    "wordCards": WordCard[],
    "progress": { [wordId]: ProgressEntry },
    "confusingGroups": ConfusingWordGroup[],
    "settings": UserSettings,
    "version": "1.0.0"
  },
  
  // Session data (cleared on app close)
  "word-app-session": {
    "currentSession": StudySession | null,
    "audioCache": { [url]: Blob },
    "tempProgress": { [wordId]: ProgressEntry }
  }
}
```

### Data Migration Strategy
- Version field enables future schema migrations
- Backward compatibility for at least 2 versions
- Export/import functionality for data portability

---

**Data Model Status**: ✅ Complete - All entities, relationships, and storage strategy defined  
**Next**: Create API contracts and test scenarios