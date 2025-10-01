# Research: Anki-like Word Recite App

**Feature**: 001-anki-like-word  
**Date**: 2024-09-30  
**Status**: Complete  

## Technical Stack Decisions

### Vue 3 + Composition API
**Decision**: Use Vue 3 with Composition API for reactive state management  
**Rationale**: 
- Excellent TypeScript support and modern reactive patterns
- Composition API provides better logic reuse and organization
- Strong ecosystem with Vite for fast development
- Smaller bundle size compared to React for this use case  
**Alternatives considered**: React with hooks, Svelte  
**Rejected because**: React has larger bundle overhead, Svelte has smaller ecosystem for UI components

### Vite Build Tool
**Decision**: Use Vite as build tool and dev server  
**Rationale**:
- Extremely fast hot reload during development
- Modern ESM-based architecture
- Built-in Vue 3 support with optimal configuration
- Tree-shaking and code splitting out of the box  
**Alternatives considered**: Webpack, Rollup  
**Rejected because**: Webpack is slower for development, Rollup lacks dev server features

### Tailwind CSS + shadcn-vue
**Decision**: Tailwind CSS for utility-first styling + shadcn-vue for pre-built components  
**Rationale**:
- Rapid prototyping with utility classes
- Consistent design system without custom CSS
- shadcn-vue provides accessible, customizable components
- Mobile-first responsive design built-in  
**Alternatives considered**: Vuetify, Quasar, custom CSS  
**Rejected because**: Vuetify is opinionated Material Design, Quasar is heavier, custom CSS slows iteration

## Audio Strategy Research

### Browser Audio API
**Decision**: Use Web Audio API with HTML5 audio fallback  
**Rationale**:
- Web Audio API provides precise control for pronunciation playback
- Can pre-load and cache audio files efficiently
- Supports dynamic audio generation if needed  
**Implementation approach**:
- Primary: Use `Audio()` constructor for simplicity
- Cache audio blobs in memory during session
- Pre-load next round audio in background

### Text-to-Speech Fallback
**Decision**: Use browser SpeechSynthesis API as backup  
**Rationale**:
- Built into modern browsers, no external dependencies
- Works offline once initialized
- Acceptable quality for prototype validation  
**Limitations noted**: Voice consistency varies by browser/OS

## State Management Research

### Pinia for Global State
**Decision**: Use Pinia for deck, progress, and session state  
**Rationale**:
- Official Vue store library with excellent DX
- TypeScript support and devtools integration
- Modular store design fits our domain entities  
**Store structure**:
- `decks` store: Deck management and word data
- `progress` store: Learning statistics and word scheduling
- `session` store: Current study session state

### LocalStorage for Persistence
**Decision**: Use LocalStorage with JSON serialization  
**Rationale**:
- Simple persistence without backend complexity
- Synchronous API fits prototype needs
- 5MB+ storage sufficient for vocabulary progress  
**Backup strategy**: Export/import functionality for data portability

## Spaced Repetition Algorithm

### SM-2 Algorithm Implementation
**Decision**: Implement simplified SM-2 for prototype  
**Rationale**:
- Well-documented algorithm with proven effectiveness
- Simpler than SM-15/17 while maintaining core benefits
- Easy to tune parameters during testing  
**Parameters**:
- Initial interval: 1 day
- Success multiplier: 2.5 (configurable)
- Failure penalty: Reset to 1 day

### 10-Minute Rule Implementation
**Decision**: Use setTimeout with localStorage backup  
**Rationale**:
- Immediate feedback without complex scheduling
- Falls back to persistent timers if app closed
- Simple to implement and debug  

## Performance Optimizations

### Virtual Scrolling for Large Decks
**Decision**: Implement virtual scrolling for deck lists >100 items  
**Rationale**:
- Maintains smooth scrolling with thousands of words
- Reduces memory usage for large vocabularies  
**Library**: Use `@tanstack/vue-virtual` for performance

### Audio Pre-loading Strategy
**Decision**: Pre-load next 10 cards during current card display  
**Rationale**:
- Balances memory usage with user experience
- Prevents audio loading delays during study flow  
**Implementation**: Background fetch with AbortController for cleanup

## Mobile Responsiveness Research

### Touch Gesture Implementation
**Decision**: Use native touch events with gesture detection  
**Rationale**:
- More responsive than library-based solutions
- Full control over swipe thresholds and animation timing
- Smaller bundle size  
**Gesture thresholds**:
- Minimum swipe distance: 50px
- Maximum time: 300ms
- Velocity threshold: 0.3px/ms

### Responsive Breakpoints
**Decision**: Follow Tailwind's standard breakpoints with custom comparison mode rules  
**Breakpoints**:
- `sm`: 640px (1 card in comparison)
- `md`: 768px (2 cards in comparison)
- `lg`: 1024px (3 cards in comparison)
- `xl`: 1280px (4+ cards in comparison)

## Development Workflow

### Testing Strategy
**Decision**: Vitest + Vue Test Utils for unit/component tests  
**Rationale**:
- Fast test execution with Vite integration
- Excellent Vue component testing support
- Built-in mocking and snapshot capabilities  
**Test coverage targets**: >80% for composables, >60% for components

### Development Environment
**Decision**: Hot reload with state persistence during development  
**Implementation**: 
- Vite HMR preserves store state across component updates
- LocalStorage provides state persistence across page reloads
- Mock data generators for consistent testing

## Risk Mitigations

### Audio Loading Failures
**Mitigation**: Graceful fallback to text-only mode with error notifications  
**Implementation**: Try audio load → timeout after 3s → continue without audio

### LocalStorage Quota Exceeded  
**Mitigation**: Automatic cleanup of oldest progress data  
**Implementation**: Keep last 30 days of progress, archive older data to downloadable JSON

### Performance on Low-End Devices
**Mitigation**: Reduced animation and simplified comparison mode  
**Detection**: Use `navigator.hardwareConcurrency` and performance timing APIs

---

**Research Status**: ✅ Complete - All technical decisions documented and justified
**Next Phase**: Phase 1 - Design & Contracts