# PRD: Word Recite App

## /constitution

### Vision
A web/mobile SaaS for vocabulary learning through spaced repetition. Swipe-based interface, audio-first approach, intelligent word comparison.

### Core Principles
1. **Mobile-first** - Touch gestures + keyboard shortcuts for desktop
2. **Audio-first** - Click-to-play pronunciation, cloud-cached
3. **Smart comparison** - System + user-defined confusing word groups
4. **Adaptive difficulty** - Easy → Hard progression within sessions
5. **Word-level persistence** - All progress saved per word, no session conflicts

---

## /specify

## 1. Core User Flow

### Study Session Overview
1. User opens app → Main menu shows "50 new, 897 reviews"
2. Tap "Start Learning" → Loading screen: "Loading words..." (pre-cache Round 1 audio)
3. Cards appear one-by-one (or in comparison groups)
4. User reviews each card: Remember / Not Remember
5. Near end of Round 1 → Start pre-caching Round 2 audio in background
6. Session ends → Celebration (2s) → Summary → Return to menu

---

## 2. Card Interface

### 2.1 Single Card Layout

#### Before Reveal
```
┌─────────────────────────────────┐
│  [Top Bar: Icons]               │ ← Desktop only
├─────────────────────────────────┤
│                                 │
│         chien (noun)            │ ← Word + POS (inline, right)
│                                 │ ← Click word to play audio
│                                 │ ← Auto-highlight on appear
│                                 │ ← 2/3 of card height
│                                 │
├─────────────────────────────────┤
│    [Reveal Answer Button]       │ ← 1/3 of card height
└─────────────────────────────────┘
```

#### After Reveal
```
┌─────────────────────────────────┐
│  [Top Bar: Icons]               │
├─────────────────────────────────┤
│         chien (noun)            │ ← Word + POS (clickable)
│   un animal domestique...       │ ← Hint (smaller, grey)
│                                 │
│   dog                           │ ← Translation
│   A domestic animal that...     │ ← Flexible expand area
│   commonly kept as a pet...     │   Auto font-size if needed
│                                 │   Wraps text, min 12px
├─────────────────────────────────┤
│  [Remember]  [Not Remember]     │ ← 1/5 of card height
└─────────────────────────────────┘
```

**Key specs:**
- **Audio trigger:** Click on word itself (no speaker icon)
- **Auto-highlight:** Card highlights on appear, audio plays once
- **Word:** Large font, centered, wraps if overflow, clickable
- **POS:** Inline on right side of word, normal size
- **Hint:** Below word, smaller/weaker font, greyed out after first tap, one-time use
- **Translation:** Flexible area, takes remaining space, wraps text
- **Auto font-size:** Triggers when text exceeds 80% of available height, min 12px
- **Buttons:** Fixed 1/5 height at bottom
- **Reveal transition:** Instant (no animation)

### 2.2 Comparison Mode Layout

#### Desktop
- Grid layout (responsive, 2-4 cards per row based on screen width)
- Min card width: 300px
- Each card has same structure as single mode

#### Mobile/Tablet
- Small phones (<768px): 1 card per row
- Tablets (768px-1024px): 2 cards per row
- Vertical scroll for additional cards
- **Swipe gestures disabled** (button-only interaction)

#### Audio Behavior in Comparison
- **First card auto-highlights** on group appear
- First card audio plays once
- **Click any card to highlight + play its audio**
- Only one card highlighted at a time

### 2.3 Control Panel

**Desktop:** Top horizontal bar
**Mobile:** Floating hamburger button (bottom-right) → Bottom sheet menu (slides up)

**Icons/Actions:**
- **Back** - Return to main menu
- **Hint** - Toggle hint visibility (one-time, greys out after tap, resets for next card)
- **Undo** - Revert last action (disabled on first card)
  - Tracks last action globally (works across comparison cards)
- **Settings** - Opens settings menu (see 2.4)

**Removed:** Speaker icon (click word instead)

### 2.4 Settings Menu
- Edit card content
- Remove card from deck
- Color theme selection
- Font size: Small / Normal / Big / Huge (global setting)
- Auto-play audio: On / Off
- Round size: Default 50 (global setting)
- **Confusing word groups** (see Section 4)

### 2.5 Interactions

| Action | Mobile | Desktop | Keyboard |
|--------|--------|---------|----------|
| Play audio | Tap word | Click word | P |
| Reveal | Tap button | Click button | Space / Enter |
| Remember | Swipe up | Drag up / Click | ↑ / W / Num8 |
| Not Remember | Swipe left | Drag left / Click | ← / A / Num4 |
| Undo | Tap icon | Click icon | ↓ / S / Num2 |

**Note:** In comparison mode on mobile, only tap/click buttons (swipe disabled)

---

## 3. Main Menu

### 3.1 Today's Task Summary
```
┌─────────────────────────────────┐
│  Today's Task                   │
│  50 new cards, 897 reviews      │
│                                 │
│  [Start Learning]               │
└─────────────────────────────────┘
```

### 3.2 Deck Management
- **Deck list** with toggle switches (ON by default)
- **Select All / Deselect All** buttons
- Each deck shows:
  - Name
  - Total cards
  - New cards today
  - Reviews due

### 3.3 Deck Sources
**User-created:**
- Upload CSV/text
- Import validation:
  - Required columns: "word", "translation"
  - Optional columns: "part_of_speech", "hint"
  - Skip invalid rows, show error report
  - No duplicates checking (allow)
- Imported exactly as uploaded (maintain row order)

**Pre-built:**
- French A1, A2, B1, B2 (CEFR levels)
- Themed: Countries, Verbs, Food, Colors, Numbers

**Auto-generated:**
- By category (grammar tags)
- By difficulty (memory strength)
- By date added
- Pure comparison mode deck (all confusing groups)

---

## 4. Learning Session

### 4.1 Session Display
```
┌─────────────────────────────────┐
│  47/50              897         │ ← Progress / Remaining
├─────────────────────────────────┤
│                                 │
│         [Card Area]             │
│                                 │
└─────────────────────────────────┘
```

**Top left:** Current round progress (47/50 events)
**Top right:** Total remaining today (897 events)

**Note:** Progress counts "events" not individual cards. Comparison group = 1 event.

### 4.2 Round Structure
- **Default:** 50 events per round (configurable in global settings)
- **Last round:** Can be <50 events (flexible)
- **Auto-save:** Progress saved per word (word-level persistence)
- **Resume:** On app restart, leftover cards re-arranged as new round
- **Incomplete comparison groups:** Break apart, treat individually on resume

### 4.3 Word Sorting Algorithm

#### Difficulty Classification

**New Cards:**
- Sort by CEFR level (A1 → C2)
- Within same level: Maintain import order (CSV row order / preset deck order)

**Old Cards (based on last 3 reviews only):**
- **Easy:** 7+ day interval, stable performance in last 3 reviews
- **Medium:** 3-7 day interval
- **Hard:** 1-3 day interval, OR any failure in last 3 reviews

#### Arrangement Pattern
**Within each round:**
- Easy → Medium → Hard (cyclical pattern)
- **If word has confusing group:** Show entire group together (not individual card)
- **Comparison only for old cards** (not new words)

**Example 50-event round:**
```
Events 1-5: Easy words
Events 6-10: Medium words
Events 11-15: Hard words
Event 16: Comparison group (3 confusing words) ← Counts as 1 event
Events 17-21: Easy words
... repeat cycle ...
```

### 4.4 New/Review Ratio
**Setting:** Slider with 5 positions
- 0% new (review only)
- 25% new / 75% review
- 50% new / 50% review
- 75% new / 25% review
- 100% new (no reviews)

**Location:** Global settings

---

## 5. Comparison Mode

### 5.1 Purpose
Practice confusing words side-by-side to strengthen differentiation.

### 5.2 When It Triggers
- During normal session when word has confusing group
- **Word-level check:** System checks each word for group membership
- **Group selection:** If word in multiple groups, pick less familiar group
  - **Measure:** Average "remember" score of last 3 reviews per group
  - Lower score = less familiar = priority
  - Tie-breaker: Random

### 5.3 Comparison Group Display
- 2 to unlimited cards
- Each card: Independent reveal/swipe
- **Progress counting:** Entire group = 1 event (47/50)
- **Audio:** First card auto-highlights + plays, click others to play
- **Animation:** Same quick card-in animation as single card (no special preview)

### 5.4 "Not Remember" Behavior in Comparison
- Card disappears after swipe (visual feedback)
- When card returns (10 min later), shows as **single card** (not re-grouped)
- Prevents complex group state management

### 5.5 Pure Comparison Mode
- Dedicated practice mode
- Auto-generated deck from all confusing groups
- Accessible from main menu as special deck

### 5.6 Confusing Word Group Editor

**Access:** Card settings → "Confusing word groups"

**Interface:**
1. Shows all groups current word belongs to
2. "+ Add Group" button
3. Select group to edit

**Group editing screen:**
- **Current members:** Listed with "×" to remove
- **System suggestions:** Top 5 similar words
  - Based on: Detection rules + user behavior analytics
  - Example label: "98% of users confuse these words"
  - After adding word: Refresh suggestions based on existing group pattern
- **Search bar:** Find words across all decks
  - Suggestions hidden while typing
  - Click "+" to add word to group

**Multi-group membership:** One word can be in multiple groups (e.g., prefix group + suffix group)

**Detection rules:** Documented separately

---

## 6. Spaced Repetition System

### 6.1 Base Algorithm
Anki SM-2 (modifications TBD)

### 6.2 Remember Flow
**User action:** Swipe up / Click "Remember"
**Scheduling:** Increasing intervals
- First: 1 day
- Then: 3 days → 7 days → 14 days → 30 days
**Next review:** Calculated by SM-2 algorithm

### 6.3 Not Remember Flow (10-Minute Rule)

**User action:** Swipe left / Click "Not Remember"

**Immediate effect:** 
- Mark word with end time (current time + 10 minutes)
- Save to storage (no RAM timer needed)
- Word-level refresh interval handles UI updates

#### Scenario A: Within Round
- Card marked at time T
- Card returns at T+10min (if round still active)
- Goes to next round if current round ends

#### Scenario B: All Rounds Complete, Timers Still Active

**Waiting screen:**
```
┌─────────────────────────────────┐
│  Next word comes in 05:00       │
│  (calculated: end_time - now)   │
│                                 │
│  [Skip]    [Skip All 08:00]     │
└─────────────────────────────────┘
```

**Real-time countdown:** Calculated dynamically (end_time - current_time), updates every second

**Skip button:** Shows current word immediately
- User reviews card normally (remember/not remember)
- System schedules based on user action
- Next waiting screen appears (if more queued)

**Skip All button:** Shows all queued words in sequence
- Countdown shows longest timer (08:00 = last word's end_time - now)
- All words appear one-by-one
- No more waiting screens
- Each word scheduled normally after review

**Timer persistence:**
- End times saved to storage (not RAM)
- On app restart/refresh: Check end_time vs current_time
- If expired → show card
- If not expired → show waiting screen

**Multi-device behavior:**
- No session conflicts
- Word-level saving allows parallel usage
- If same word shown on 2 devices → User can mark "remember" twice
- Duplicate actions don't affect progress (word state is same)

---

## 7. Audio System

### 7.1 Generation & Caching Strategy
**Priority:**
1. Browser built-in TTS (if quality sufficient)
2. Google Cloud TTS (fallback)
3. Cloud cache (save for all users)

**Pre-caching:**
- **Session start:** Show loading screen "Loading words..." while caching Round 1 audio
- **Near Round 1 end:** Start downloading Round 2 audio in background
- **Subsequent rounds:** Pre-cache next round while user finishes current

### 7.2 Features
- **Trigger:** Click on word itself (no speaker icon)
- **Auto-play:** On card appear (first card in comparison mode), toggle in settings
- **Manual replay:** Click word again, or press P key
- **Voice options:** Male / Female

---

## 8. Progress Tracking

### 8.1 Dashboard
- **Daily streak:** Consecutive days studied
- **Today's stats:** Cards reviewed, success rate
- **Total progress:** Mastered / Learning / To Review
- **Calendar heatmap:** GitHub-style activity visualization

### 8.2 Per-Deck Statistics
- Progress percentage
- Average success rate
- Card status breakdown

### 8.3 Session Summary
**Shown after completion:**
- Celebration animation (2 seconds)
- "X cards reviewed, Y% remembered, Z time spent"
- Encouragement message
- "Return to Menu" button

---

## 9. Onboarding

### Welcome Flow
1. **Tutorial (3 screens):**
   - Screen 1: Swipe gestures
   - Screen 2: Reveal answer, control panel
   - Screen 3: Comparison mode preview
2. **Quick-start decks:**
   - French A1 (50 words)
   - French A2 (100 words)
   - French B1 (150 words)
3. **"Try now" button** for immediate practice

---

## 10. Responsive Design

### Breakpoints
- **Small phones** (<768px): 1 card per row in comparison
- **Tablets** (768px-1024px): 2 cards per row
- **Desktop** (1024px-1440px): 3-4 cards per row (min 300px width)
- **Large screens** (>1440px): 4+ cards per row

### Layout Adaptations
- Control panel: Top bar (desktop) / Floating hamburger (mobile)
- Card sizing: Dynamic grid (desktop) / Vertical scroll (mobile)
- Touch targets: 44px minimum (mobile)

---

## Technical Architecture Notes

### State Management
**Key principle:** Word-level persistence, no complex session state

**Data storage:**
- Word progress: Local storage (client-side)
- Timer end times: Saved per word (end_time timestamp)
- No RAM timers (calculate dynamically on render)
- No session locking (multi-device safe)

### Performance Optimizations
1. **Audio pre-caching:** Round-by-round, background loading
2. **Word-level refresh:** Efficient state updates
3. **Dynamic font sizing:** Calculate on render, cached per card

### Multi-Device Architecture
- No session conflicts (word-level saves)
- No server-side session management needed
- Duplicate actions handled gracefully (idempotent operations)

---

## Future Enhancements (Backlog)

### Confirmed for Future
- **Word strength indicator:** Visual progress dots (●○○○○) near POS tag

### Deferred/Pass
- Smart break reminders
- Comparison group preview animation
- Session goal setting
- Pronunciation slow-mo

---

## Summary: MVP Scope

### ✅ In Scope
- Single card + comparison mode UI
- Click-to-play audio (no speaker icon)
- 10-min rule with skip functionality
- Word-level persistence (multi-device safe)
- Pre-caching audio strategy
- Confusing word groups (system + user)
- Spaced repetition (SM-2 base)
- CSV import with validation
- Responsive design (mobile + desktop)
- Basic progress tracking

### ⚠️ Needs External Documentation
- Confusing word detection rules (Refer to confusing_word_detect_rule.md)
- SM-2 algorithm modifications (refer to word_learning_SRS.md)

### 🚫 Out of Scope (v1.0)
- Break reminders
- Session time limits
- Advanced analytics
- Social features
- Mobile native apps (web-only for MVP)