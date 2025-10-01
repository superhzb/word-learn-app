# Quickstart Scenarios: Anki-like Word Recite App

**Feature**: 001-anki-like-word  
**Date**: 2024-09-30  
**Purpose**: Integration test scenarios for validating core functionality

## Quick Start Demo Flow

### Scenario 1: New User First Experience
**Duration**: 2-3 minutes  
**Purpose**: Validate onboarding and basic functionality  

**Steps**:
1. **App Launch**
   - Open app in browser
   - Verify welcome screen appears
   - Check that no existing data is loaded

2. **Initial Setup**
   - Select "French A1" preset deck (50 words)
   - Confirm deck is enabled by default
   - Verify deck shows: "50 new cards, 0 reviews"

3. **First Study Session**
   - Tap "Start Learning"
   - Observe loading screen: "Loading words..."
   - First card appears with French word
   - Tap word to play audio (verify audio works)
   - Tap "Reveal Answer" 
   - See English translation and hint
   - Swipe up or tap "Remember"

4. **Session Continuation**
   - Complete 5-10 cards using mix of remember/not-remember
   - Verify progress indicator updates (5/50)
   - Verify forgotten cards are scheduled for 10-minute retry
   - Continue until first "not-remember" card reappears

5. **Session Completion**
   - Complete first round or manually end session
   - See celebration animation
   - Review session summary statistics
   - Return to main menu

**Expected Results**:
- Smooth onboarding experience
- Audio playback works consistently  
- Progress tracking is accurate
- 10-minute rule functions correctly
- Session statistics are meaningful

---

### Scenario 2: Comparison Mode Validation
**Duration**: 3-4 minutes  
**Purpose**: Validate confusing word detection and comparison mode

**Prerequisites**: Complete Scenario 1 or have existing progress

**Steps**:
1. **Setup Confusing Words**
   - Navigate to a word card (e.g., "chien")
   - Open Settings → "Confusing word groups"
   - Add "chat" and "cheval" to create similarity group
   - Save the group

2. **Trigger Comparison Mode**
   - Start new study session
   - Continue until "chien" appears in session
   - Verify entire group (chien, chat, cheval) displays together
   - Observe 2x2 or horizontal layout on current device

3. **Comparison Interaction**
   - Verify first card ("chien") is auto-highlighted
   - Verify audio plays for highlighted card
   - Tap different card to switch highlight and audio
   - Reveal answers for each card independently
   - Mark each card individually (remember/not-remember)

4. **Progress Tracking**
   - Verify progress shows comparison group as single event
   - Check that forgotten cards follow 10-minute rule individually
   - Confirm session continues after comparison group

**Expected Results**:
- Comparison mode activates when confusing words appear
- Multi-card layout works on current device size
- Audio and highlighting work correctly
- Individual card tracking within groups
- Progress counting is accurate (group = 1 event)

---

### Scenario 3: CSV Import and Custom Deck
**Duration**: 2-3 minutes  
**Purpose**: Validate deck creation and import functionality

**Test Data** (CSV format):
```csv
word,translation,part_of_speech,hint
bonjour,hello,interjection,common greeting
merci,thank you,interjection,polite expression
eau,water,noun,essential liquid
rouge,red,adjective,color like blood
```

**Steps**:
1. **Import Preparation**
   - Navigate to deck management
   - Select "Import from CSV"
   - Copy test CSV data above

2. **Import Process**
   - Paste CSV content into import field
   - Verify preview shows 4 valid rows, 0 errors
   - See sample cards with correct translations
   - Confirm import and name deck "Test Import"

3. **Deck Validation**
   - Navigate back to main menu
   - Verify "Test Import" deck appears in deck list
   - Check deck shows "4 new cards, 0 reviews"
   - Ensure deck is enabled by default

4. **Study Imported Deck**
   - Disable other decks, enable only "Test Import"
   - Start learning session
   - Verify all 4 words appear correctly
   - Test audio playback for each word (TTS fallback)
   - Complete session and verify statistics

**Expected Results**:
- CSV parsing correctly identifies columns
- Import validation catches errors appropriately
- Custom deck integrates with main workflow
- All imported words function in study mode
- TTS audio works as fallback

---

### Scenario 4: Mobile Responsiveness
**Duration**: 2-3 minutes  
**Purpose**: Validate mobile interface and touch interactions

**Device Testing**: Resize browser to mobile width (< 768px) or test on mobile device

**Steps**:
1. **Mobile Layout Validation**
   - Open app at mobile screen size
   - Verify single-column layout in comparison mode
   - Check that control panel uses bottom hamburger menu
   - Confirm touch targets are adequately sized (44px+)

2. **Touch Gesture Testing**
   - Start study session
   - Test swipe up for "Remember" (should work)
   - Test swipe left for "Not Remember" (should work)
   - Verify swipe gestures have appropriate feedback

3. **Comparison Mode on Mobile**
   - Trigger comparison group (use Scenario 2 setup)
   - Verify cards display vertically stacked
   - Confirm swipe gestures are disabled in comparison
   - Test button-only interaction in comparison mode

4. **Settings and Navigation**
   - Open hamburger menu (bottom-right floating button)
   - Test all menu options are accessible
   - Verify settings panel fits mobile screen
   - Test navigation back to main menu

**Expected Results**:
- Mobile layout is fully functional
- Touch gestures work smoothly
- Comparison mode adapts to mobile constraints
- All functionality accessible via touch
- Performance remains smooth on mobile

---

### Scenario 5: Progress Persistence and Recovery
**Duration**: 3-4 minutes  
**Purpose**: Validate data persistence and session recovery

**Steps**:
1. **Create Progress Data**
   - Complete several study sessions (15-20 cards)
   - Mix of remember/not-remember results
   - Ensure some cards have retry timers active

2. **Persistence Testing**
   - Refresh browser page (simulates app restart)
   - Verify main menu shows updated card counts
   - Check that progress statistics are maintained
   - Start new session and verify scheduling is correct

3. **Session Recovery**
   - Start study session and complete 5-10 cards
   - Close browser tab (simulates app interruption)
   - Reopen app and navigate to continue session
   - Verify session state is restored correctly
   - Check that retry timers are still active and accurate

4. **Data Export/Import**
   - Export progress data to JSON file
   - Clear browser data (localStorage)
   - Import the exported data
   - Verify all decks, progress, and settings restored

**Expected Results**:
- Progress survives page refreshes
- Session recovery works after interruption  
- Data export/import maintains integrity
- Retry timers persist across restarts
- No data loss in normal usage

---

## Performance Benchmarks

### Load Time Targets
- **Initial app load**: < 2 seconds
- **Study session start**: < 1 second  
- **Card transitions**: < 300ms
- **Audio playback start**: < 500ms

### Memory Usage Targets
- **Base app**: < 10MB
- **Audio cache**: < 50MB
- **Progress data**: < 1MB per 1000 cards

### Interaction Targets
- **Touch response**: < 100ms
- **Swipe recognition**: < 200ms
- **Animation smoothness**: 60 FPS

---

## Validation Checklist

### Core Functionality
- [ ] New user onboarding works smoothly
- [ ] Basic study session flow functions correctly
- [ ] Audio playback works (files + TTS fallback)
- [ ] Spaced repetition scheduling is accurate
- [ ] 10-minute retry rule functions properly

### Advanced Features  
- [ ] Comparison mode activates and functions correctly
- [ ] CSV import handles valid and invalid data
- [ ] Custom deck creation and management works
- [ ] Confusing word group creation functions
- [ ] Progress statistics are accurate and meaningful

### Technical Requirements
- [ ] Mobile responsiveness across breakpoints
- [ ] Touch gestures work appropriately
- [ ] Data persistence survives app restarts
- [ ] Performance meets stated targets
- [ ] Memory usage stays within limits

### User Experience
- [ ] Interface is intuitive for first-time users
- [ ] Loading states provide appropriate feedback
- [ ] Error states are handled gracefully
- [ ] Animations enhance rather than distract
- [ ] Overall flow feels smooth and responsive

---

**Quickstart Status**: ✅ Complete - All integration scenarios and benchmarks defined  
**Total Test Time**: ~15-20 minutes for complete validation  
**Next**: Generate task breakdown from these scenarios