
# Implementation Plan: Anki-like Word Recite App

**Branch**: `001-anki-like-word` | **Date**: 2024-09-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-anki-like-word/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Spaced repetition vocabulary learning app with mobile-first design, audio pronunciation, confusing word comparison mode, and progress tracking. Pure frontend implementation using Vue 3 + Vite + Tailwind CSS + shadcn-vue with dummy data for quick prototyping.

## Technical Context
**Language/Version**: JavaScript ES2022, Vue 3 Composition API  
**Primary Dependencies**: Vue 3, Vite, Tailwind CSS, shadcn-vue  
**Storage**: LocalStorage for progress persistence, dummy JSON data for vocabulary  
**Testing**: Vitest, Vue Test Utils  
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+)  
**Project Type**: single - pure frontend SPA  
**Performance Goals**: <2s initial load, <300ms card transitions, smooth 60fps animations  
**Constraints**: Offline-capable, mobile-first responsive design, touch-friendly interactions  
**Scale/Scope**: 1000+ vocabulary words, 10+ decks, session-based progress tracking

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**No constitution file found** - proceeding with standard development practices:
- ✅ Test-driven development approach
- ✅ Component-based architecture 
- ✅ Responsive design principles
- ✅ Performance and accessibility standards

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── components/           # Vue components
│   ├── ui/              # shadcn-vue components
│   ├── cards/           # Word card components
│   ├── decks/           # Deck management components
│   ├── session/         # Study session components
│   └── common/          # Shared components
├── composables/         # Vue composables
│   ├── useSpacedRepetition.js
│   ├── useAudioPlayer.js
│   ├── useWordCards.js
│   └── useProgress.js
├── stores/              # Pinia stores
│   ├── decks.js
│   ├── progress.js
│   └── session.js
├── data/                # Dummy data
│   ├── decks/
│   └── words/
├── utils/               # Utility functions
├── router/              # Vue Router
├── assets/              # Static assets
└── main.js              # App entry point

tests/
├── components/          # Component tests
├── composables/         # Composable tests
└── integration/         # E2E tests

public/                  # Static files
├── audio/               # Audio files
└── index.html

docs/                    # Project documentation
```

**Structure Decision**: Single project structure chosen as this is a pure frontend SPA with no backend services required. All functionality will be client-side with dummy data for quick prototyping.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs:
  - **Contract tests**: One test suite per service (DeckService, SessionService, AudioService)
  - **Component tests**: Word card, comparison mode, session management, deck management
  - **Integration tests**: Based on quickstart scenarios (5 main scenarios)
  - **Implementation tasks**: Vue components, composables, stores, utilities
  - **Setup tasks**: Project initialization, dependencies, configuration

**Ordering Strategy**:
- **Setup Phase**: Project init, Vite config, Tailwind setup, shadcn-vue installation
- **Test Phase [P]**: Contract tests, component tests (can run in parallel)
- **Core Phase**: Data models, composables, stores, basic components
- **Integration Phase**: Complex components, routing, session management
- **Polish Phase [P]**: Styling, animations, performance optimization, documentation

**Estimated Task Count**: 35-40 numbered tasks
- Setup: 5 tasks
- Tests: 12 tasks [P]
- Core: 15 tasks
- Integration: 8 tasks  
- Polish: 5 tasks [P]

**Key Dependencies**:
- All contract tests [P] can run in parallel (independent services)
- Component tests depend on basic setup completion
- Implementation tasks follow TDD order: tests → implementation
- Integration scenarios require core functionality complete

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach described (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS  
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (None required)

**Deliverables Created**:
- [x] research.md - Technical stack research and decisions
- [x] data-model.md - Complete entity definitions and relationships
- [x] contracts/deck-service.md - Deck management service interface
- [x] contracts/session-service.md - Study session and spaced repetition interface
- [x] contracts/audio-service.md - Audio playback and caching interface
- [x] quickstart.md - Integration test scenarios and benchmarks
- [x] .github/copilot-instructions.md - Updated agent context

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
