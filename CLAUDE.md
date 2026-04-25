# CLAUDE.md — swotReact

## Project Overview

Offline Electron desktop app for SWOT analysis.

Users create projects, manage factors, calculate scores, generate strategies, and export reports (PDF/Word).

No backend, no API, no database.

---

## Core Constraints

- Offline only — no HTTP, APIs, or external services
- Electron app — no Node.js access from renderer
- All filesystem operations go through `window.electronAPI`
- Local file storage only (`~/SWOTProjects` or `%USERPROFILE%\SWOTProjects`)
- No test suite — do not assume tests exist
- Do not convert to web/SaaS/client-server architecture

---

## Language Rules

All user-facing text must remain in Russian:
- UI
- validation messages
- errors
- exports (PDF/DOCX)
- strategy descriptions

Code and comments may be in English.

---

## Tech Stack

- React 18 + TypeScript
- Electron 28
- Zustand (state)
- Vite (build)
- Recharts (charts)
- jsPDF + html2canvas (PDF)
- docx (Word)
- electron-builder (packaging)

---

## Architecture

```
React → Zustand → storageService → window.electronAPI → Electron (preload/main) → filesystem
```

Rules:

- `window.electronAPI` is the only bridge
- No direct Node.js usage in React
- No REST/backend layer

---

## Project Structure

```
src/
  components/      UI + stages
  store/           Zustand store
  services/        business logic
  types/           core types
  utils/           helpers + swot format

electron/
  main.js
  preload.js
  fileService.js
```

---

## Storage & File Format

- Projects stored as `.swot` or `.json`
- `.swot` = JSON with header wrapper
- Stored in user home directory
- `.swot` parsing duplicated in:
  - renderer (`swotFileFormat.ts`)
  - Electron (`main.js`, `fileService.js`)

⚠️ If format changes → update ALL locations

Versioning:
- `FORMAT_VERSION`
- `SCHEMA_VERSION`
- Migration is NOT implemented → changes can break old data

---

## Domain Model (important parts)

- `Project` → contains factors + strategies
- `Factor` → input data + computed score
- `Strategy` → generated from factors

⚠️ Strategy IDs are NOT stable (Date.now + random)

---

## Scoring & Strategy Rules

- S/W: `significance × impact`
- O/T: `significance × impact × probability`
- Missing probability → fallback to `1`

Strategies:
- Generated from top-N factors
- Max 1 per type (SO/WO/ST/WT)
- Regeneration replaces all strategies

---

## Development Commands

```bash
npm run electron:dev
npm run electron:build
npm run electron:build:win
npm run electron:build:linux
```

---

## Coding Rules

- Never mutate state — use immutable updates
- Always update `updatedAt`
- Always call `calculateScores()` after factor changes
- Use `@/` imports inside `src/`
- Services must stay stateless

---

## IPC Rules

If adding a method:

1. `main.js`
2. `preload.js`
3. `electron.d.ts`
4. `storageService.ts`

All must stay in sync.

---

## Sensitive Areas

### Auto-save

- Every change triggers save
- `calculateScores()` also saves → double write

### File format

- `.swot` logic duplicated → easy to break

### Migration

- Not implemented → schema changes are risky

### IPC

- Breaking contract = runtime crash

---

## Safe Change Workflow

### Changing data model

- Update types
- Update validation
- Update scoring
- Update migration
- Update `.swot` parsing (ALL places)

### Adding IPC

- main.js
- preload.js
- electron.d.ts
- storageService

---

## What to Inspect First

- `useProjectStore.ts`
- `storageService.ts`
- `main.js` / `preload.js`
- `swotFileFormat.ts`

---

## Out of Scope

- backend / API
- database
- auth
- cloud sync
- tests (unless requested)

---

## Before Finishing

- UI text is Russian
- state is immutable
- IPC is consistent
- file format not broken