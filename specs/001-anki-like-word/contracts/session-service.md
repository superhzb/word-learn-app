# Session Service Contract

**Service**: SessionService  
**Type**: Frontend Service  
**Purpose**: Manage study sessions, card scheduling, and spaced repetition

## Service Interface

### createSession(config: SessionConfig)
**Purpose**: Initialize new study session with selected decks  
**Input**:
```typescript
{
  deckIds: string[]
  roundSize?: number (default: 50)
  newReviewRatio?: number (default: 50)
  sessionType?: 'mixed' | 'new-only' | 'review-only' | 'comparison-only'
}
```
**Output**:
```typescript
{
  success: boolean
  session?: {
    id: string
    totalCards: number
    totalRounds: number
    estimatedTime: number // minutes
  }
  error?: string
}
```

### getNextCard()
**Purpose**: Get next card or comparison group for study  
**Input**: None  
**Output**:
```typescript
{
  type: 'single' | 'comparison' | 'session-complete'
  data?: {
    cards: WordCard[]
    progress: {
      currentPosition: number
      totalCards: number
      roundProgress: number
      roundTotal: number
    }
    isRetry?: boolean // for 10-minute rule cards
  }
  sessionSummary?: SessionStats // when session-complete
}
```

### recordCardResult(cardId: string, result: CardResult)
**Purpose**: Record user response and update progress  
**Input**:
```typescript
{
  cardId: string
  result: {
    action: 'remember' | 'not-remember'
    responseTime: number // milliseconds
    sessionType: 'normal' | 'comparison' | 'retry'
  }
}
```
**Output**:
```typescript
{
  success: boolean
  nextReview?: {
    scheduledFor: Date
    interval: number // days
  }
  retryIn?: number // minutes (for 10-minute rule)
}
```

### pauseSession()
**Purpose**: Save current session state for later resumption  
**Input**: None  
**Output**: `{ success: boolean, resumeToken?: string }`

### resumeSession(resumeToken?: string)
**Purpose**: Restore paused session or recover interrupted session  
**Input**: `{ resumeToken?: string }`  
**Output**:
```typescript
{
  success: boolean
  session?: StudySession
  hasRetryCards?: boolean
  retryCards?: Array<{
    cardId: string
    availableAt: Date
  }>
}
```

### completeSession()
**Purpose**: Finalize session and generate summary  
**Input**: None  
**Output**:
```typescript
{
  summary: {
    totalCards: number
    rememberedCards: number
    forgottenCards: number
    timeSpent: number // minutes
    averageResponseTime: number // seconds
    comparisonGroupsShown: number
    newWordsLearned: number
    streak: number // days
  }
  achievements?: string[] // unlocked achievements
}
```

### undoLastAction()
**Purpose**: Revert the most recent card result  
**Input**: None  
**Output**:
```typescript
{
  success: boolean
  restoredCard?: {
    cardId: string
    previousResult?: 'remember' | 'not-remember'
  }
  message?: string
}
```

### getRetryCards()
**Purpose**: Get cards waiting for 10-minute retry  
**Input**: None  
**Output**:
```typescript
{
  retryCards: Array<{
    cardId: string
    word: string
    availableAt: Date
    remainingTime: number // seconds
  }>
}
```

### skipRetryWait(cardId?: string)
**Purpose**: Skip 10-minute wait for specific card or all waiting cards  
**Input**: `{ cardId?: string }` // if null, skip all  
**Output**: `{ success: boolean, cardsReady: number }`

## Spaced Repetition Algorithm Interface

### calculateNextReview(progress: ProgressEntry, result: 'remember' | 'not-remember')
**Purpose**: Compute next review date using SM-2 algorithm  
**Input**:
```typescript
{
  progress: {
    reviewCount: number
    easeFactor: number
    currentInterval: number
    lastResult?: string
  }
  result: 'remember' | 'not-remember'
}
```
**Output**:
```typescript
{
  nextInterval: number // days
  nextReviewDate: Date
  newEaseFactor: number
  difficulty: 'easy' | 'medium' | 'hard'
}
```

## Test Scenarios

### Test: createSession_withMixedDecks_calculatesCorrectTotals
**Given**: Multiple enabled decks with mix of new and review cards  
**When**: createSession() called with mixed type  
**Then**: Returns correct total card count  
**And**: Respects new/review ratio setting  
**And**: Calculates realistic time estimate  

### Test: getNextCard_returnsCardsInCorrectOrder
**Given**: Active session with Easy→Medium→Hard pattern  
**When**: getNextCard() called repeatedly  
**Then**: Cards returned in difficulty progression  
**And**: Comparison groups appear as single units  
**And**: Progress tracking updates correctly  

### Test: recordCardResult_remember_updatesScheduling
**Given**: Card with existing progress history  
**When**: recordCardResult() called with 'remember'  
**Then**: Next review date calculated by SM-2  
**And**: Ease factor updated appropriately  
**And**: Progress statistics updated  

### Test: recordCardResult_notRemember_triggers10MinuteRule
**Given**: Card during normal session  
**When**: recordCardResult() called with 'not-remember'  
**Then**: Card scheduled for 10-minute retry  
**And**: Card marked for reappearance  
**And**: Session continues without interruption  

### Test: getRetryCards_showsActiveRetries
**Given**: Multiple cards in 10-minute wait state  
**When**: getRetryCards() called  
**Then**: Returns all waiting cards  
**And**: Shows accurate remaining time  
**And**: Orders by availability time  

### Test: undoLastAction_revertsProgressCorrectly
**Given**: Just recorded a 'not-remember' result  
**When**: undoLastAction() called  
**Then**: Card progress reverted to previous state  
**And**: 10-minute timer cancelled if applicable  
**And**: Session position adjusted  

### Test: completeSession_generatesSummary
**Given**: Session with completed cards and statistics  
**When**: completeSession() called  
**Then**: Returns comprehensive session summary  
**And**: Updates daily streak counter  
**And**: Clears session state  

### Test: resumeSession_restoresInterruptedState
**Given**: Session was paused or interrupted  
**When**: resumeSession() called on app restart  
**Then**: Restores exact session position  
**And**: Includes any pending retry cards  
**And**: Preserves session statistics  

### Test: comparisonMode_groupsSimilarWords
**Given**: Word has confusing group associations  
**When**: getNextCard() encounters the word  
**Then**: Returns entire group as comparison set  
**And**: Marks as single session event  
**And**: Handles individual card results within group  

---

**Contract Status**: ✅ Complete - All session management and spaced repetition contracts defined