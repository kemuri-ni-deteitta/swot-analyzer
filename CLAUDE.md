# CLAUDE.md — swotReact

## Project Overview

Desktop SWOT analysis tool. Users input factors, score them, generate strategies, visualize results, and export reports in PDF and Word formats.

The application is built with React + Electron. It has no network backend, no REST API, and no database.

---

## Core Constraints

- **Offline only.** No HTTP calls, no APIs, no remote services.
- **Electron desktop app.** The renderer process cannot use Node.js directly. All filesystem access goes through `window.electronAPI` via `contextBridge`.
- **Local file storage only.** Projects are stored as `.swot` or legacy `.json` files in the user home directory.
- **No existing test suite.** Do not assume test commands exist. Only add test infrastructure if explicitly requested.
- **No linting config.** No ESLint, Prettier, or Biome configuration exists.
- **Do not redesign this into a web, SaaS, client-server, or database-first application unless explicitly requested.**

---

## Language Rules

All user-facing text must remain in Russian unless explicitly requested otherwise.

This includes:

- UI labels
- button text
- menu items
- page titles
- modal titles
- validation messages
- error messages shown to the user
- strategy descriptions
- factor labels shown to users
- export content
- PDF reports
- Word reports

Internal code, identifiers, technical comments, and developer-facing documentation may be in English.

---

## Tech Stack

- React 18 + TypeScript 5.3
- Electron 28
- Electron main process: CommonJS
- Renderer process: ESM via Vite
- Zustand 4 for global state
- Vite 5 for build/dev
- `@/` path alias maps to `src/`
- Recharts 2 for charts
- `@tanstack/react-virtual` 3 for list virtualization
- jsPDF 4 + html2canvas 1 for PDF export
- docx 9 for Word export
- Zod 3 is available but used sparingly
- electron-builder 24 for packaging

Packaging targets:

- Windows: NSIS x64
- Linux: AppImage + deb
- macOS: not configured

---

## Architecture

```text
React renderer
  └─ useProjectStore (Zustand)
       └─ storageService
            └─ window.electronAPI (contextBridge)
                  └─ electron/preload.js
                       ├─ fileService.js
                       └─ ipcRenderer dialogs via ipcMain
```

Architecture rules:

- `window.electronAPI` is the only bridge between renderer and main process.
- React components must not access Node.js APIs directly.
- Filesystem access must stay in Electron main/preload/fileService layer.
- Renderer-side services should call `window.electronAPI` through `storageService`.
- Do not add REST API, HTTP server, WebSocket, or database layer unless explicitly requested.

Electron menu flow:

- Menu actions are sent from main process to renderer via IPC.
- Preload re-dispatches them as `CustomEvent` on `window`.
- `MainWindow.tsx` listens for:
  - `electron-menu-new`
  - `electron-menu-open`
  - `electron-menu-save`
  - `electron-menu-save-as`

Drag-and-drop of `.swot` / `.json` files onto the window is handled in `electron/main.js` and dispatched as `electron-menu-open`.

---

## Project Structure

```text
src/
├── main.tsx / App.tsx          React entry points
├── components/
│   ├── MainWindow.tsx          Stage router + Electron menu event listener
│   ├── NavigationBar.tsx       Navigation controls
│   ├── stages/                 Six workflow stage views
│   │   ├── ProjectHubView.tsx     Stage 0: project list/create/open
│   │   ├── FactorsInputView.tsx   Stage 1: factor CRUD
│   │   ├── CalculationView.tsx    Stage 2: scores + validation display
│   │   ├── VisualizationView.tsx  Stage 3: charts + SWOT matrix
│   │   ├── StrategiesView.tsx     Stage 4: strategy generation
│   │   └── SummaryView.tsx        Stage 5: export
│   └── widgets/
│       ├── FactorForm.tsx      Add/edit factor form
│       ├── FactorTable.tsx     Virtualized factor list
│       └── SWOTMatrix.tsx      2×2 matrix display
├── store/
│   └── useProjectStore.ts      Single Zustand store for project state
├── services/
│   ├── calculationService.ts   Scoring formulas
│   ├── strategyService.ts      Strategy generation
│   ├── storageService.ts       Calls window.electronAPI; creates/migrates projects
│   ├── exportService.ts        PDF and Word export
│   └── validationService.ts    Factor validation rules
├── types/
│   ├── index.ts                Core TypeScript types
│   └── electron.d.ts           window.electronAPI typings
├── utils/
│   ├── factorTypes.ts          Factor type labels
│   └── swotFileFormat.ts       .swot serialization/deserialization
└── contexts/
    └── ThemeContext.tsx        Light/dark theme persisted to localStorage

electron/
├── main.js                     Main process: window, menu, IPC handlers, drag-drop
├── preload.js                  contextBridge; exposes window.electronAPI
└── fileService.js              Node.js filesystem operations
```

---

## Storage and File Format Rules

Projects are stored in:

```text
Linux/macOS: ~/SWOTProjects/
Windows:     %USERPROFILE%\SWOTProjects\
```

The path is created with `os.homedir()` and `path.join(homeDir, 'SWOTProjects')`.

File rules:

- Preferred file format: `{project.id}.swot`
- Legacy compatibility format: `{project.id}.json`
- `loadProject` tries `.swot` first, then falls back to `.json`
- On save as `.swot`, the old `.json` file for the same project ID is automatically deleted
- `getProjects` skips corrupted files and continues loading other projects

`.swot` format:

```json
{
  "header": {
    "signature": "SWOT",
    "formatVersion": 1,
    "appVersion": "1.0.0"
  },
  "project": {}
}
```

Important file format rules:

- `.swot` parsing logic is duplicated in three places:
  - `src/utils/swotFileFormat.ts`
  - `electron/main.js`
  - `electron/fileService.js`
- If the `.swot` format changes, all three locations must be updated.
- `FORMAT_VERSION = 1` is defined in `swotFileFormat.ts`.
- `SCHEMA_VERSION = '1.0.0'` and `APP_VERSION = '1.0.0'` are defined in `storageService.ts`.
- Do not increment `FORMAT_VERSION`, `SCHEMA_VERSION`, or `APP_VERSION` without understanding migration impact.
- Current migration stubs log messages but do not perform real data transformation.

---

## Main Domain Entities

```typescript
type FactorType = 'S' | 'W' | 'O' | 'T'

interface Factor {
  id: string
  type: FactorType
  text: string
  category: string
  significance: number  // 1–5
  impact: number        // 1–5
  probability?: number  // 0–1, required for O/T only
  score?: number        // computed, never set manually
}

interface Strategy {
  id: string            // Date.now() + Math.random(); not stable across sessions
  type: 'SO' | 'WO' | 'ST' | 'WT'
  title: string
  description: string
  factors: Factor[]
}

interface Project {
  id: string
  name: string
  description?: string
  factors: Factor[]
  strategies: Strategy[]
  createdAt: string     // ISO string
  updatedAt: string     // ISO string
  schemaVersion: string
  appVersion: string
}
```

---

## Scoring and Strategy Rules

Scoring is implemented in `src/services/calculationService.ts`.

Rules:

- S/W factors: `score = significance × impact`
- O/T factors: `score = round(significance × impact × probability, 2)`
- Maximum score is 25
- If `probability` is missing for an O/T factor, scoring falls back to `probability ?? 1`
- Validation still flags missing probability for O/T factors
- `calculateFactorScores` returns new `Factor` objects and must not mutate in place

Strategy generation is implemented in `src/services/strategyService.ts`.

Rules:

- Top-N factors are selected globally by score
- Supported N values: 5, 7, 10
- Factors are then split by type
- At most one strategy is generated per type: SO, WO, ST, WT
- A strategy type is skipped if either required quadrant is absent from the selected top-N factors
- Max 3 factors per quadrant per strategy
- Strategy descriptions are generated by concatenating factor text values
- Regenerating strategies replaces the entire `project.strategies` array
- Strategy IDs use `Date.now() + Math.random()` and are not stable across regenerations

---

## Development Commands

```bash
npm run dev                  # Vite dev server only, no Electron window
npm run electron:dev         # Vite dev server + Electron app
npm run build                # TypeScript + Vite build
npm run electron:build       # Build and package for current platform
npm run electron:build:win   # Build Windows NSIS installer, x64
npm run electron:build:linux # Build Linux AppImage + deb
npm run preview              # Preview production web build
```

Electron behavior:

- In dev mode, Electron loads `http://localhost:5173`
- In production, Electron loads `dist/index.html`
- DevTools open automatically in dev mode

No test command currently exists.

---

## Coding Conventions

General:

- Keep changes local and incremental.
- Do not perform broad rewrites unless explicitly requested.
- Do not introduce new dependencies unless necessary.
- Preserve the existing architecture and file boundaries.

Imports:

- Inside `src/`, use the `@/` alias.
- Avoid deep relative imports like `../../`.

State:

- Use immutable updates.
- Never mutate `project`, `factors`, or `strategies` in place.
- Use spread-based updates such as `{ ...project, factors: [...] }`.
- Update `updatedAt` when changing factors or strategies.
- Call `calculateScores()` after any factor change.

Services:

- Services are plain stateless objects.
- Do not convert services into classes or stateful singletons.
- Every `storageService` method must guard with `if (!window.electronAPI)` and return a safe fallback.

Electron:

- Files in `electron/` use CommonJS.
- Use `require` / `module.exports` in Electron main/preload/service files.
- Do not use ES module syntax in `electron/` unless the project configuration is explicitly changed.

UI:

- Keep user-facing text in Russian.
- Do not translate UI labels or export text into English.
- Keep the UI focused on SWOT analysis workflow and reporting.

---

## Sensitive Areas

### Auto-save double-write

Factor mutations call `calculateScores()`, and `calculateScores()` also calls `saveProject()`.

This currently causes two filesystem writes per factor edit.

Do not add additional nested `saveProject()` calls inside scoring or helper functions that are already called from mutations.

### IPC contract

`window.electronAPI` is defined across multiple files that must stay in sync:

1. `electron/preload.js`
2. `src/types/electron.d.ts`
3. `electron/main.js`
4. `src/services/storageService.ts`

Adding, removing, or renaming an API method requires updating all relevant files.

### Schema and file format versioning

Changing persisted project shape is risky.

Do not add fields to `Project` or `Factor` without considering:

- `src/types/index.ts`
- validation logic
- calculation logic
- migration logic
- `.swot` parsing in renderer and Electron files
- compatibility with existing saved projects

### PDF export

`exportToPDF` appends a temporary `<div>` to `document.body` for rendering.

If stage view HTML structure changes, verify that the PDF output still renders correctly, especially Cyrillic text and layout.

### Virtualized factor table

`FactorTable.tsx` uses `@tanstack/react-virtual`.

Virtualization may depend on stable item heights. Be careful when introducing dynamic row heights.

### Strategy IDs

Strategy IDs are generated with `Date.now() + Math.random()`.

Do not build features that depend on strategy IDs being stable across sessions or regenerations.

---

## Safe Change Workflow

### When modifying factor fields or persisted project schema

1. Update `src/types/index.ts`
2. Update `validationService.ts` if the field needs validation
3. Update `calculationService.ts` if the field affects scoring
4. Update UI components that create or edit factors
5. Update `storageService.migrateProject()` with real migration logic if existing files need transformation
6. If persisted project schema changes, update `SCHEMA_VERSION`
7. If the `.swot` wrapper/header format changes, update `FORMAT_VERSION`
8. If the `.swot` format changes, update parsing in:
   - `src/utils/swotFileFormat.ts`
   - `electron/main.js`
   - `electron/fileService.js`

### When adding a new IPC channel

1. Add `ipcMain.handle(...)` or event wiring in `electron/main.js`
2. Add the method to `contextBridge.exposeInMainWorld` in `electron/preload.js`
3. Add the method signature to `ElectronAPI` in `src/types/electron.d.ts`
4. Add a wrapper method to `storageService.ts`
5. Include the `!window.electronAPI` guard and safe fallback

### When adding a new stage or menu action

Follow the existing menu pattern:

1. Main process sends an IPC event
2. Preload forwards it as a `CustomEvent`
3. `MainWindow.tsx` listens and updates application state

Do not introduce a second event pattern unless explicitly requested.

---

## What to Inspect First

Depending on the task, inspect these files first:

- `src/types/index.ts` — before touching data shapes
- `src/store/useProjectStore.ts` — before touching state, autosave, or project mutation flow
- `src/services/storageService.ts` — before touching persistence or project creation/loading
- `src/utils/swotFileFormat.ts` — before touching `.swot` serialization
- `electron/main.js` — before touching Electron window, menu, IPC handlers, drag-drop, or dialogs
- `electron/preload.js` — before touching `window.electronAPI`
- `src/types/electron.d.ts` — before changing Electron API typings
- `electron/fileService.js` — before touching filesystem behavior
- `src/services/calculationService.ts` — before touching scoring
- `src/services/strategyService.ts` — before touching strategy generation
- `src/services/validationService.ts` — before touching factor validation
- `src/services/exportService.ts` — before touching PDF or Word export

---

## Out of Scope

Do not add these unless explicitly requested:

- REST API
- HTTP server
- WebSocket
- remote backend
- cloud synchronization
- database for projects
- SQLite
- IndexedDB project storage
- localStorage-based project storage
- authentication
- user accounts
- multiplayer/collaboration
- macOS build configuration
- test infrastructure
- CI/CD pipeline
- code signing or notarization setup

`localStorage` may be used only for lightweight UI preferences, such as theme.

---

## Before Finishing a Task

Before considering work done:

- Confirm all user-facing strings are in Russian
- Confirm `@/` imports are used inside `src/`
- Confirm project objects are not mutated in place
- Confirm `updatedAt` is refreshed when project data changes
- If factor/project types changed, confirm migration logic and version constants were handled correctly
- If IPC changed, confirm `main.js`, `preload.js`, `electron.d.ts`, and `storageService.ts` are all updated
- If `.swot` format changed, confirm renderer utility and Electron-side parsers are all updated
- If PDF/Word export-related UI changed, verify export layout still works
- Remove unused imports and dead code
- If commands, architecture, or project structure changed, update this file