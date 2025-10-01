# Tasks: Anki-like Word Recite App

**Input**: Design documents from `/specs/001-anki-like-word/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Found: Vue 3 + Vite + Tailwind CSS + shadcn-vue frontend SPA
   → Extract: JavaScript ES2022, Vitest testing, LocalStorage persistence
2. Load design documents:
   → data-model.md: 6 entities (WordCard, Deck, ProgressEntry, etc.)
   → contracts/: 3 services (DeckService, SessionService, AudioService)
   → quickstart.md: 5 integration test scenarios
3. Generate tasks by category:
   → Setup: Vite project, dependencies, shadcn-vue configuration
   → Tests: Contract tests for 3 services, 5 integration scenarios
   → Core: Vue components, composables, Pinia stores
   → Integration: Audio system, spaced repetition, comparison mode
   → Polish: Styling, animations, performance optimization
4. Apply task rules:
   → Different files marked [P] for parallel execution
   → Tests before implementation (TDD approach)
   → Sequential dependencies noted
5. Number tasks T001-T040 with clear file paths
6. Generate dependency relationships
7. All contracts have tests, all entities have models
8. Return: SUCCESS (40 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- File paths relative to repository root
- Vue 3 SPA structure: `src/`, `tests/`, `public/`

## Phase 3.1: Setup

- [x] **T001** Create Vue 3 project structure with Vite in repository root
- [x] **T002** Initialize package.json with Vue 3, Vite, Tailwind CSS, and Vitest dependencies
- [x] **T003** [P] Configure Vite build tool with Vue plugin in `vite.config.js`
- [x] **T004** [P] Setup Tailwind CSS configuration in `tailwind.config.js`
- [x] **T005** [P] Install and configure shadcn-vue component library
- [x] **T006** [P] Configure Vitest testing framework in `vitest.config.js`
- [x] **T007** [P] Setup ESLint and Prettier for code formatting

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (Parallel - Different Services)
- [x] **T008** [P] Contract test for DeckService methods in `tests/contracts/deck-service.test.js`
- [x] **T009** [P] Contract test for SessionService methods in `tests/contracts/session-service.test.js`
- [x] **T010** [P] Contract test for AudioService methods in `tests/contracts/audio-service.test.js`

### Component Tests (Parallel - Different Components)
- [x] **T011** [P] Component test for WordCard in `tests/components/WordCard.test.js`
- [x] **T012** [P] Component test for ComparisonMode in `tests/components/ComparisonMode.test.js`
- [x] **T013** [P] Component test for StudySession in `tests/components/StudySession.test.js`
- [ ] **T014** [P] Component test for DeckManager in `tests/components/DeckManager.test.js`

### Integration Tests (Parallel - Different Scenarios)
- [ ] **T015** [P] Integration test for "New User First Experience" in `tests/integration/new-user-flow.test.js`
- [ ] **T016** [P] Integration test for "Comparison Mode Validation" in `tests/integration/comparison-mode.test.js`
- [ ] **T017** [P] Integration test for "CSV Import and Custom Deck" in `tests/integration/csv-import.test.js`
- [ ] **T018** [P] Integration test for "Mobile Responsiveness" in `tests/integration/mobile-responsive.test.js`
- [ ] **T019** [P] Integration test for "Progress Persistence" in `tests/integration/progress-persistence.test.js`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models and Types (Parallel - Different Entities)
- [x] **T020** [P] WordCard model with validation in `src/types/WordCard.js`
- [x] **T021** [P] Deck model with validation in `src/types/Deck.js`
- [x] **T022** [P] ProgressEntry model with validation in `src/types/ProgressEntry.js`
- [x] **T023** [P] StudySession model with validation in `src/types/StudySession.js`
- [x] **T024** [P] ConfusingWordGroup model in `src/types/ConfusingWordGroup.js`

### Composables (Business Logic)
- [ ] **T025** [P] useSpacedRepetition composable in `src/composables/useSpacedRepetition.js`
- [ ] **T026** [P] useAudioPlayer composable in `src/composables/useAudioPlayer.js`
- [ ] **T027** [P] useWordCards composable in `src/composables/useWordCards.js`
- [ ] **T028** [P] useProgress composable in `src/composables/useProgress.js`

### Pinia Stores (State Management)
- [x] **T029** DecksStore implementation in `src/stores/decks.js`
- [x] **T030** ProgressStore implementation in `src/stores/progress.js`
- [ ] **T031** SessionStore implementation in `src/stores/session.js`

## Phase 3.4: Integration

### Core Vue Components
- [x] **T032** WordCard component implementation in `src/components/cards/WordCard.vue`
- [x] **T033** ComparisonMode component in `src/components/cards/ComparisonMode.vue`
- [ ] **T034** StudySession component in `src/components/session/StudySession.vue`
- [ ] **T035** DeckManager component in `src/components/decks/DeckManager.vue`

### Services Implementation
- [x] **T036** DeckService implementation in `src/services/DeckService.js`
- [x] **T037** SessionService with spaced repetition in `src/services/SessionService.js`
- [x] **T038** AudioService with caching in `src/services/AudioService.js`

## Phase 3.5: Polish

### UI and Performance (Parallel - Independent Improvements)
- [ ] **T039** [P] Implement responsive design breakpoints and mobile gestures in CSS
- [ ] **T040** [P] Add loading states, animations, and error handling across components

## Dependencies

**Critical Sequencing:**
- **Setup** (T001-T007) → **Tests** (T008-T019) → **Core** (T020-T031) → **Integration** (T032-T038) → **Polish** (T039-T040)

**Within Phases:**
- Tests (T008-T019): All can run in parallel - different files, no dependencies
- Models (T020-T024): All can run in parallel - different entities
- Composables (T025-T028): All can run in parallel - different business domains
- Stores depend on models: T029-T031 require T020-T024 complete
- Components depend on stores: T032-T035 require T029-T031 complete
- Services depend on stores and composables: T036-T038 require T025-T031 complete

**Blocking Relationships:**
- T025 (spaced repetition) blocks T037 (SessionService)
- T026 (audio player) blocks T038 (AudioService)
- T027 (word cards) blocks T036 (DeckService)
- T029-T031 (stores) block T032-T035 (components)

## Parallel Execution Examples

### Phase 3.2: Launch All Contract Tests Together
```bash
# These can all run simultaneously:
npm test tests/contracts/deck-service.test.js
npm test tests/contracts/session-service.test.js  
npm test tests/contracts/audio-service.test.js
```

### Phase 3.3: Launch All Model Creation Together
```bash
# These can all run simultaneously:
Task: "WordCard model with validation in src/types/WordCard.js"
Task: "Deck model with validation in src/types/Deck.js"
Task: "ProgressEntry model with validation in src/types/ProgressEntry.js"
Task: "StudySession model with validation in src/types/StudySession.js"
Task: "ConfusingWordGroup model in src/types/ConfusingWordGroup.js"
```

### Phase 3.3: Launch All Composables Together (After Models Complete)
```bash
# These can all run simultaneously:
Task: "useSpacedRepetition composable in src/composables/useSpacedRepetition.js"
Task: "useAudioPlayer composable in src/composables/useAudioPlayer.js"
Task: "useWordCards composable in src/composables/useWordCards.js"
Task: "useProgress composable in src/composables/useProgress.js"
```

## Dummy Data Requirements

**Created during setup phase:**
- `src/data/decks/french-a1.json` - 50 basic French words
- `src/data/decks/french-a2.json` - 100 intermediate French words  
- `src/data/words/confusing-groups.json` - Pre-defined similar word groups
- `public/audio/` - Sample audio files for testing

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T008-T010)
- [x] All entities have model tasks (T020-T024)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Integration tests cover all quickstart scenarios (T015-T019)
- [x] TDD approach: failing tests → implementation → passing tests

## Notes
- **[P] tasks** = different files, no dependencies, can run simultaneously
- **Verify tests fail** before implementing (red-green-refactor cycle)
- **Commit after each task** for incremental progress tracking
- **Vue 3 + Vite** enables fast hot reload during development
- **shadcn-vue** provides accessible, tested UI components
- **LocalStorage** enables offline functionality and quick prototyping

---

**Task Generation Status**: ✅ Complete - 40 numbered tasks ready for implementation
**Total Estimated Time**: 15-20 hours for complete implementation
**Next Command**: `/implement` to execute all tasks in dependency order