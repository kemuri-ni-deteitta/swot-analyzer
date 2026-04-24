# Техническая документация: Разработка Desktop приложения на Electron + React

## 📋 Содержание

1. [Актуальность](#актуальность)
2. [Введение](#введение)
3. [Обзор технологий](#обзор-технологий)
4. [Архитектура приложения](#архитектура-приложения)
5. [Структура проекта](#структура-проекта)
6. [Технические решения](#технические-решения)
7. [Интеграция Electron и React](#интеграция-electron-и-react)
8. [Управление состоянием](#управление-состоянием)
9. [Работа с файловой системой](#работа-с-файловой-системой)
10. [Сборка и распространение](#сборка-и-распространение)
11. [Производительность и оптимизация](#производительность-и-оптимизация)
12. [Заключение](#заключение)

---

## 🎯 Актуальность

### Проблематика

В современной разработке существует постоянная потребность в создании кроссплатформенных desktop приложений, которые:

- **Работают офлайн** — не требуют постоянного подключения к интернету
- **Имеют нативный вид** — выглядят как обычные приложения операционной системы
- **Используют веб-технологии** — позволяют использовать знакомые инструменты (HTML, CSS, JavaScript)
- **Кроссплатформенны** — работают на Windows, Linux, macOS без переписывания кода
- **Легко распространяются** — упаковываются в установщики для разных платформ

### Решение

**Electron** — это фреймворк, который позволяет создавать desktop приложения, используя веб-технологии (HTML, CSS, JavaScript/TypeScript) и при этом иметь доступ к нативным API операционной системы.

**React** — популярная библиотека для построения пользовательских интерфейсов, которая отлично интегрируется с Electron.

**Комбинация Electron + React** — современный и эффективный подход к разработке desktop приложений, который:

- Ускоряет разработку за счет переиспользования веб-технологий
- Позволяет создавать современные и отзывчивые интерфейсы
- Обеспечивает кроссплатформенность из коробки
- Имеет активное сообщество и множество готовых решений

---

## 📖 Введение

### О проекте

**SWOT Analyzer** — это desktop приложение для проведения SWOT-анализа проектов и бизнес-идей. Проект демонстрирует полный цикл разработки современного desktop приложения с использованием:

- **Electron** — для создания desktop оболочки
- **React 18** — для построения UI
- **TypeScript** — для типобезопасности
- **Vite** — для быстрой сборки
- **Zustand** — для управления состоянием
- **Recharts** — для визуализации данных

### Цель документации

Данная документация описывает:

- Выбор и обоснование технологического стека
- Архитектурные решения проекта
- Особенности интеграции Electron и React
- Практические примеры реализации ключевых функций
- Процесс сборки и распространения приложения

### Целевая аудитория

Документация предназначена для:

- Разработчиков, начинающих работу с Electron
- Программистов, желающих создать desktop приложение на React
- Команд, планирующих разработку кроссплатформенных приложений
- Студентов, изучающих современные подходы к разработке desktop ПО

---

## 🔧 Обзор технологий

### Electron

**Electron** — это фреймворк для создания нативных приложений с помощью веб-технологий, разработанный GitHub.

#### Основные компоненты:

1. **Main Process (Главный процесс)**
   - Точка входа приложения (`main.js`)
   - Управляет жизненным циклом приложения
   - Создает и управляет окнами приложения
   - Имеет доступ к Node.js API и нативным модулям
   - Может взаимодействовать с файловой системой, системными настройками и т.д.

2. **Renderer Process (Процесс рендеринга)**
   - Каждое окно приложения работает в отдельном процессе
   - Загружает и отображает HTML/CSS/JavaScript
   - Похож на обычную веб-страницу в браузере
   - Изолирован от главного процесса по соображениям безопасности

3. **Preload Script (Скрипт предзагрузки)**
   - Выполняется перед загрузкой веб-контента
   - Имеет доступ и к Node.js API, и к DOM
   - Использует `contextBridge` для безопасного экспорта API в renderer процесс
   - Является мостом между main и renderer процессами

#### Преимущества Electron:

- ✅ Кроссплатформенность (Windows, Linux, macOS)
- ✅ Использование знакомых веб-технологий
- ✅ Доступ к нативным API операционной системы
- ✅ Большое сообщество и экосистема
- ✅ Возможность использования любых веб-библиотек

#### Недостатки Electron:

- ⚠️ Большой размер приложения (включает Chromium и Node.js)
- ⚠️ Высокое потребление памяти
- ⚠️ Более медленный запуск по сравнению с нативными приложениями

### React 18

**React** — библиотека для построения пользовательских интерфейсов на основе компонентов.

#### Ключевые особенности:

- **Компонентный подход** — UI разбивается на переиспользуемые компоненты
- **Виртуальный DOM** — эффективное обновление интерфейса
- **Hooks** — современный способ работы с состоянием и побочными эффектами
- **JSX** — синтаксический сахар для описания UI

#### В проекте используется:

- Функциональные компоненты с Hooks
- Управление состоянием через Zustand
- Виртуализация списков для производительности
- Контексты для глобальных настроек (тема)

### TypeScript

**TypeScript** — типизированная надстройка над JavaScript.

#### Преимущества:

- Статическая типизация — обнаружение ошибок на этапе компиляции
- Автодополнение в IDE
- Рефакторинг с гарантией безопасности
- Лучшая документация кода через типы

#### В проекте:

- Строгая типизация всех компонентов и сервисов
- Интерфейсы для данных (Project, Factor, Strategy)
- Типы для Electron API
- Валидация через типы

### Vite

**Vite** — современный инструмент сборки для фронтенд-проектов.

#### Преимущества:

- ⚡ Мгновенный запуск dev-сервера
- 🔥 Быстрая Hot Module Replacement (HMR)
- 📦 Оптимизированная сборка для production
- 🎯 Поддержка TypeScript из коробки

#### Конфигурация в проекте:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Важно для Electron
  build: {
    outDir: 'dist',
  },
})
```

### Zustand

**Zustand** — легковесная библиотека для управления состоянием.

#### Преимущества:

- Простота использования
- Минимальный boilerplate
- Хорошая производительность
- TypeScript поддержка

#### Пример использования в проекте:

```typescript
// src/store/useProjectStore.ts
import { create } from 'zustand'

interface ProjectState {
  currentProject: Project | null
  currentStage: Stage
  setCurrentProject: (project: Project | null) => Promise<void>
  // ...
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  currentStage: 0,
  setCurrentProject: async (project) => {
    set({ currentProject: project })
    // ...
  },
}))
```

### Recharts

**Recharts** — библиотека для создания графиков и диаграмм на React.

#### Использование:

- Столбчатые диаграммы для визуализации данных
- Графики распределения факторов
- Интеграция с React компонентами

### Дополнительные библиотеки

- **@tanstack/react-virtual** — виртуализация больших списков
- **docx** — генерация Word документов
- **jspdf** + **html2canvas** — генерация PDF отчетов
- **zod** — валидация данных (зарезервировано для будущего использования)

---

## 🏗 Архитектура приложения

### Общая архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │  main.js                                          │  │
│  │  - Управление окнами                              │  │
│  │  - IPC handlers                                   │  │
│  │  - Меню приложения                                │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  preload.js                                       │  │
│  │  - contextBridge                                  │  │
│  │  - Экспорт API в renderer                        │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  fileService.js                                   │  │
│  │  - Работа с файловой системой                    │  │
│  │  - CRUD операции с проектами                     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │ IPC
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 Electron Renderer Process               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  React Application (index.html)                  │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  Components (UI Layer)                     │ │  │
│  │  │  - MainWindow                               │ │  │
│  │  │  - Stages (0-5)                            │ │  │
│  │  │  - Widgets                                 │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  Store (State Management)                  │ │  │
│  │  │  - useProjectStore (Zustand)               │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  Services (Business Logic)                  │ │  │
│  │  │  - calculationService                       │ │  │
│  │  │  - strategyService                          │ │  │
│  │  │  - storageService                           │ │  │
│  │  │  - exportService                            │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Паттерн MVVM (адаптированный для React)

Проект использует адаптированный паттерн MVVM:

- **View** — React компоненты (UI)
- **ViewModel** — Zustand store (управление состоянием)
- **Model** — TypeScript типы и интерфейсы
- **Service** — бизнес-логика (расчеты, генерация стратегий)
- **Repository** — работа с данными (storageService)

### Поток данных

```
User Action (Click/Input)
    ↓
React Component
    ↓
Zustand Store Action
    ↓
Service (Business Logic)
    ↓
Storage Service
    ↓
Electron API (IPC)
    ↓
Main Process (fileService)
    ↓
File System
```

### Изоляция процессов

Electron обеспечивает изоляцию между процессами:

1. **Main Process** — имеет полный доступ к Node.js API
2. **Renderer Process** — изолирован, работает как веб-страница
3. **Preload Script** — мост между процессами через `contextBridge`

Это обеспечивает безопасность: веб-контент не имеет прямого доступа к файловой системе.

---

## 📁 Структура проекта

### Полная структура

```
swotReact/
├── electron/                    # Electron main process
│   ├── main.js                 # Главный процесс, управление окнами
│   ├── preload.js              # Preload скрипт, экспорт API
│   └── fileService.js          # Сервис работы с файлами
│
├── src/                        # React приложение
│   ├── components/            # React компоненты
│   │   ├── MainWindow.tsx     # Главное окно приложения
│   │   ├── stages/            # Компоненты этапов (0-5)
│   │   │   ├── ProjectHubView.tsx
│   │   │   ├── FactorsInputView.tsx
│   │   │   ├── CalculationView.tsx
│   │   │   ├── VisualizationView.tsx
│   │   │   ├── StrategiesView.tsx
│   │   │   └── SummaryView.tsx
│   │   └── widgets/           # Переиспользуемые виджеты
│   │       ├── FactorForm.tsx
│   │       ├── FactorTable.tsx
│   │       └── SWOTMatrix.tsx
│   │
│   ├── store/                 # Zustand stores
│   │   └── useProjectStore.ts # Глобальное состояние
│   │
│   ├── services/              # Бизнес-логика
│   │   ├── calculationService.ts  # Расчеты оценок
│   │   ├── strategyService.ts     # Генерация стратегий
│   │   ├── storageService.ts       # Работа с данными
│   │   └── exportService.ts        # Экспорт отчетов
│   │
│   ├── types/                 # TypeScript типы
│   │   ├── index.ts           # Основные типы
│   │   └── electron.d.ts      # Типы Electron API
│   │
│   ├── utils/                 # Утилиты
│   │   ├── factorTypes.ts     # Утилиты для типов факторов
│   │   └── swotFileFormat.ts  # Формат .swot файлов
│   │
│   ├── contexts/              # React контексты
│   │   └── ThemeContext.tsx   # Управление темой
│   │
│   ├── App.tsx                # Корневой компонент
│   ├── main.tsx               # Точка входа React
│   └── index.css              # Глобальные стили
│
├── public/                     # Статические файлы
├── resources/                  # Ресурсы (иконки, стили)
│
├── dist/                       # Собранное React приложение
├── dist-electron/              # Собранное Electron приложение
│
├── package.json                # Зависимости и скрипты
├── tsconfig.json               # Конфигурация TypeScript
├── vite.config.ts              # Конфигурация Vite
└── electron-builder config     # Конфигурация сборки
```

### Описание ключевых директорий

#### `electron/`

Содержит код главного процесса Electron:

- **main.js** — точка входа, создание окон, обработка IPC
- **preload.js** — безопасный экспорт API в renderer процесс
- **fileService.js** — работа с файловой системой (Node.js модуль)

#### `src/components/`

React компоненты приложения:

- **stages/** — компоненты для каждого этапа приложения
- **widgets/** — переиспользуемые UI компоненты

#### `src/services/`

Бизнес-логика приложения:

- Изолирована от UI
- Легко тестируется
- Переиспользуема

#### `src/store/`

Управление глобальным состоянием через Zustand:

- Централизованное состояние
- Простые actions
- TypeScript типизация

---

## 💡 Технические решения

### 1. Интеграция Electron и React

#### Проблема

React приложение работает в renderer процессе, который изолирован и не имеет доступа к Node.js API. Нужен способ безопасной коммуникации между React и Electron main процессом.

#### Решение

Использование **IPC (Inter-Process Communication)** через `contextBridge`:

```javascript
// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron')
const fileService = require('./fileService')

contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: async (project, useSWOTFormat) => {
    return await fileService.saveProject(project, useSWOTFormat)
  },
  loadProject: async (projectId) => {
    return await fileService.loadProject(projectId)
  },
  // ...
})
```

```typescript
// src/types/electron.d.ts
export interface ElectronAPI {
  saveProject(project: any, useSWOTFormat?: boolean): Promise<boolean>
  loadProject(projectId: string): Promise<any | null>
  // ...
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
```

```typescript
// src/services/storageService.ts
export const storageService = {
  async saveProject(project: Project): Promise<boolean> {
    if (!window.electronAPI) return false
    return await window.electronAPI.saveProject(project, true)
  },
}
```

#### Преимущества:

- ✅ Безопасность — renderer процесс не имеет прямого доступа к Node.js
- ✅ Типобезопасность — TypeScript интерфейсы для API
- ✅ Изоляция — четкое разделение между процессами

### 2. Управление состоянием

#### Выбор Zustand

**Zustand** выбран вместо Redux по следующим причинам:

- Меньше boilerplate кода
- Проще в использовании
- Хорошая производительность
- Отличная TypeScript поддержка
- Не требует провайдеров

#### Структура store:

```typescript
interface ProjectState {
  // State
  currentProject: Project | null
  currentStage: Stage
  
  // Actions
  setCurrentProject: (project: Project | null) => Promise<void>
  setCurrentStage: (stage: Stage) => void
  addFactor: (factor: Factor) => void
  // ...
}
```

#### Использование в компонентах:

```typescript
function MyComponent() {
  const { currentProject, addFactor } = useProjectStore()
  // ...
}
```

### 3. Работа с файловой системой

#### Архитектура

```
React Component
    ↓
storageService (React)
    ↓
window.electronAPI (Preload)
    ↓
IPC (Electron)
    ↓
fileService (Main Process)
    ↓
Node.js fs module
    ↓
File System
```

#### Реализация

**Main Process (fileService.js):**
```javascript
const fs = require('fs').promises
const path = require('path')
const os = require('os')

function projectsPath() {
  const homeDir = os.homedir()
  return path.join(homeDir, 'SWOTProjects')
}

async function saveProject(project, useSWOTFormat = true) {
  const dir = await ensureProjectsDir()
  const fileName = `${project.id}.${useSWOTFormat ? 'swot' : 'json'}`
  const filePath = path.join(dir, fileName)
  
  let content
  if (useSWOTFormat) {
    content = JSON.stringify({
      header: { signature: 'SWOT', formatVersion: 1, appVersion: '1.0.0' },
      project: project,
    }, null, 2)
  } else {
    content = JSON.stringify(project, null, 2)
  }
  
  await fs.writeFile(filePath, content, 'utf-8')
  return true
}
```

**Preload (preload.js):**
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: async (project, useSWOTFormat) => {
    return await fileService.saveProject(project, useSWOTFormat)
  },
})
```

**React Service (storageService.ts):**
```typescript
export const storageService = {
  async saveProject(project: Project, useSWOTFormat = true): Promise<boolean> {
    if (!window.electronAPI) return false
    return await window.electronAPI.saveProject(project, useSWOTFormat)
  },
}
```

### 4. Автоматическое сохранение

#### Реализация

При каждом изменении проекта автоматически вызывается сохранение:

```typescript
// src/store/useProjectStore.ts
addFactor: (factor) => {
  const project = get().currentProject
  if (!project) return
  
  const newProject = {
    ...project,
    factors: [...project.factors, factor],
    updatedAt: new Date().toISOString(),
  }
  set({ currentProject: newProject })
  get().calculateScores()
  storageService.saveProject(newProject).catch(console.error) // Автосохранение
},
```

#### Преимущества:

- Пользователь не теряет данные
- Не нужно помнить о сохранении
- Простота использования

### 5. Виртуализация списков

#### Проблема

При большом количестве факторов (200+) рендеринг всех элементов может быть медленным.

#### Решение

Использование `@tanstack/react-virtual`:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: filtered.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 40,
  overscan: 5,
})

const virtualRows = rowVirtualizer.getVirtualItems()

{virtualRows.map(virtualRow => {
  const factor = filtered[virtualRow.index]
  return (
    <div
      key={factor.id}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      {/* Содержимое строки */}
    </div>
  )
})}
```

#### Результат:

- Рендерится только видимые элементы
- Плавная прокрутка даже при 1000+ элементах
- Низкое потребление памяти

### 6. Экспорт отчетов

#### PDF экспорт

Использование HTML → Canvas → PDF:

```typescript
// 1. Создание HTML контента
const htmlContent = `<!DOCTYPE html>...`

// 2. Создание временного DOM элемента
const tempDiv = document.createElement('div')
tempDiv.innerHTML = htmlContent
document.body.appendChild(tempDiv)

// 3. Конвертация в Canvas
const canvas = await html2canvas(tempDiv, {
  scale: 2,
  useCORS: true,
})

// 4. Создание PDF из Canvas
const imgData = canvas.toDataURL('image/png')
const pdf = new jsPDF({ format: 'a4' })
pdf.addImage(imgData, 'PNG', 0, 0, 210, imgHeight)
```

#### Word экспорт

Использование библиотеки `docx`:

```typescript
import { Document, Packer, Paragraph, Table } from 'docx'

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ text: 'Заголовок', heading: HeadingLevel.TITLE }),
      new Table({ rows: [...] }),
      // ...
    ],
  }],
})

const blob = await Packer.toBlob(doc)
```

### 7. Кастомный формат файлов

#### Структура .swot файла

```json
{
  "header": {
    "signature": "SWOT",
    "formatVersion": 1,
    "appVersion": "1.0.0"
  },
  "project": {
    "id": "project-123",
    "name": "Название",
    "factors": [...],
    "strategies": [...]
  }
}
```

#### Преимущества:

- Легко определить формат файла
- Возможность миграции данных при обновлении версии
- Обратная совместимость со старым форматом .json

---

## 🔌 Интеграция Electron и React

### Настройка разработки

#### 1. Конфигурация Vite

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: './', // Важно! Относительные пути для Electron
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
})
```

#### 2. Загрузка React в Electron

```javascript
// electron/main.js
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,        // Безопасность
      contextIsolation: true,        // Изоляция контекста
      sandbox: false,                // Для доступа к Node.js в preload
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // В режиме разработки
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // В production
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}
```

#### 3. Preload скрипт

```javascript
// electron/preload.js
const { contextBridge } = require('electron')
const fileService = require('./fileService')

contextBridge.exposeInMainWorld('electronAPI', {
  // Экспорт методов
  saveProject: async (project, useSWOTFormat) => {
    return await fileService.saveProject(project, useSWOTFormat)
  },
})
```

### IPC коммуникация

#### От Main к Renderer

```javascript
// main.js
mainWindow.webContents.send('menu-save-project')
```

```javascript
// preload.js
ipcRenderer.on('menu-save-project', () => {
  window.dispatchEvent(new CustomEvent('electron-menu-save'))
})
```

```typescript
// React компонент
useEffect(() => {
  const handleMenuSave = () => {
    handleSaveProject()
  }
  window.addEventListener('electron-menu-save', handleMenuSave)
  return () => window.removeEventListener('electron-menu-save', handleMenuSave)
}, [])
```

#### От Renderer к Main

```typescript
// React
const result = await window.electronAPI.saveProject(project)
```

```javascript
// preload.js
saveProject: async (project, useSWOTFormat) => {
  return await fileService.saveProject(project, useSWOTFormat)
}
```

---

## 📦 Управление состоянием

### Архитектура Zustand Store

```typescript
// src/store/useProjectStore.ts
import { create } from 'zustand'
import { Project, Factor, Stage } from '../types'

interface ProjectState {
  // State
  currentProject: Project | null
  currentStage: Stage
  
  // Actions
  setCurrentProject: (project: Project | null) => Promise<void>
  setCurrentStage: (stage: Stage) => void
  addFactor: (factor: Factor) => void
  updateFactor: (id: string, updates: Partial<Factor>) => void
  deleteFactor: (id: string) => void
  calculateScores: () => void
  generateStrategies: (topCount?: number) => void
  nextStage: () => void
  prevStage: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial state
  currentProject: null,
  currentStage: 0,
  
  // Actions
  setCurrentProject: async (project) => {
    set({ currentProject: project })
    if (project) {
      get().calculateScores()
      await storageService.saveProject(project)
    }
  },
  
  addFactor: (factor) => {
    const project = get().currentProject
    if (!project) return
    
    const newProject = {
      ...project,
      factors: [...project.factors, factor],
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: newProject })
    get().calculateScores()
    storageService.saveProject(newProject).catch(console.error)
  },
  
  // ...
}))
```

### Использование в компонентах

```typescript
// Компонент
import { useProjectStore } from '../store/useProjectStore'

function MyComponent() {
  const { currentProject, addFactor, currentStage } = useProjectStore()
  
  const handleAdd = () => {
    addFactor(newFactor)
  }
  
  return (
    <div>
      <p>Этап: {currentStage + 1}</p>
      <p>Факторов: {currentProject?.factors.length ?? 0}</p>
    </div>
  )
}
```

### Преимущества подхода

- ✅ Простота — минимум кода
- ✅ Производительность — обновляются только затронутые компоненты
- ✅ Типобезопасность — полная поддержка TypeScript
- ✅ Тестируемость — легко тестировать actions

---

## 💾 Работа с файловой системой

### Архитектура

```
┌─────────────────┐
│ React Component │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ storageService  │ (React)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ window.electron │ (Preload)
│ API             │
└────────┬────────┘
         │ IPC
         ▼
┌─────────────────┐
│ fileService     │ (Main Process)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ File System     │
└─────────────────┘
```

### Реализация

#### Main Process (fileService.js)

```javascript
const fs = require('fs').promises
const path = require('path')
const os = require('os')

// Определение пути к проектам
function projectsPath() {
  const homeDir = os.homedir()
  return path.join(homeDir, 'SWOTProjects')
}

// Создание директории если не существует
async function ensureProjectsDir() {
  const dir = projectsPath()
  await fs.mkdir(dir, { recursive: true })
  return dir
}

// Сохранение проекта
async function saveProject(project, useSWOTFormat = true) {
  const dir = await ensureProjectsDir()
  const extension = useSWOTFormat ? 'swot' : 'json'
  const filePath = path.join(dir, `${project.id}.${extension}`)
  
  let content
  if (useSWOTFormat) {
    content = JSON.stringify({
      header: {
        signature: 'SWOT',
        formatVersion: 1,
        appVersion: project.appVersion || '1.0.0',
      },
      project: project,
    }, null, 2)
  } else {
    content = JSON.stringify(project, null, 2)
  }
  
  await fs.writeFile(filePath, content, 'utf-8')
  return true
}

// Загрузка проекта
async function loadProject(projectId) {
  const dir = projectsPath()
  const filePathSWOT = path.join(dir, `${projectId}.swot`)
  const filePathJSON = path.join(dir, `${projectId}.json`)
  
  let filePath
  try {
    await fs.access(filePathSWOT)
    filePath = filePathSWOT
  } catch {
    try {
      await fs.access(filePathJSON)
      filePath = filePathJSON
    } catch {
      throw new Error(`Project not found: ${projectId}`)
    }
  }
  
  const content = await fs.readFile(filePath, 'utf-8')
  const parsed = JSON.parse(content)
  
  // Поддержка нового формата .swot
  if (parsed.header && parsed.header.signature === 'SWOT') {
    return parsed.project
  }
  return parsed
}

module.exports = {
  saveProject,
  loadProject,
  getProjects,
  deleteProject,
}
```

#### Preload (preload.js)

```javascript
const { contextBridge } = require('electron')
const fileService = require('./fileService')

contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: async (project, useSWOTFormat = true) => {
    return await fileService.saveProject(project, useSWOTFormat)
  },
  
  loadProject: async (projectId) => {
    return await fileService.loadProject(projectId)
  },
  
  getProjects: async () => {
    return await fileService.getProjects()
  },
  
  deleteProject: async (projectId) => {
    return await fileService.deleteProject(projectId)
  },
})
```

#### React Service (storageService.ts)

```typescript
export const storageService = {
  async saveProject(project: Project, useSWOTFormat = true): Promise<boolean> {
    if (!window.electronAPI) {
      console.warn('Electron API not available')
      return false
    }
    
    try {
      const projectToSave = {
        ...project,
        updatedAt: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
        appVersion: APP_VERSION,
      }
      
      return await window.electronAPI.saveProject(projectToSave, useSWOTFormat)
    } catch (error) {
      console.error('Failed to save project:', error)
      return false
    }
  },
  
  async loadProject(projectId: string): Promise<Project | null> {
    if (!window.electronAPI) return null
    
    try {
      const project = await window.electronAPI.loadProject(projectId)
      return project ? this.migrateProject(project) : null
    } catch (error) {
      console.error('Failed to load project:', error)
      return null
    }
  },
}
```

### Обработка ошибок

- Проверка доступности Electron API
- Try-catch блоки для всех асинхронных операций
- Логирование ошибок в консоль
- Возврат понятных сообщений об ошибках

---

## 🚀 Сборка и распространение

### Процесс сборки

#### 1. Сборка React приложения

```bash
npm run build
```

Это выполняет:
- Компиляцию TypeScript (`tsc`)
- Сборку через Vite (`vite build`)
- Результат в папке `dist/`

#### 2. Сборка Electron приложения

```bash
npm run electron:build:win
```

Это выполняет:
- Сборку React приложения
- Упаковку через `electron-builder`
- Создание установщика Windows

### Конфигурация electron-builder

```json
// package.json
{
  "build": {
    "appId": "com.swotanalyzer.app",
    "productName": "SWOT Analyzer",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": [{
        "target": "nsis",
        "arch": ["x64"]
      }],
      "requestedExecutionLevel": "asInvoker"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

### Результат сборки

После сборки в `dist-electron/` создается:
- **Установщик:** `SWOT Analyzer Setup 1.0.0.exe`
- **Распакованная версия:** `win-unpacked/`

### Размер приложения

- **Установщик:** ~100-150 MB
- **Распакованное:** ~200-250 MB

Это нормально для Electron приложений, так как они включают:
- Chromium (~100 MB)
- Node.js runtime (~50 MB)
- Зависимости приложения (~50-100 MB)

---

## ⚡ Производительность и оптимизация

### Оптимизации в проекте

#### 1. Виртуализация списков

Для больших списков факторов используется виртуализация:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: factors.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 40,
  overscan: 5,
})
```

**Результат:** Рендерится только видимые элементы, даже при 1000+ факторах.

#### 2. Мемоизация вычислений

Использование `useMemo` для дорогих вычислений:

```typescript
const topFactors = useMemo(() => {
  return calculationService.getTopFactors(factors, 10)
}, [factors])
```

**Результат:** Пересчет только при изменении зависимостей.

#### 3. Оптимизация перерисовок

Zustand автоматически оптимизирует перерисовки компонентов.

#### 4. Ленивая загрузка

Компоненты этапов загружаются по требованию.

### Рекомендации по оптимизации

1. **Code Splitting** — разделение кода на чанки
2. **Tree Shaking** — удаление неиспользуемого кода
3. **Минификация** — сжатие JavaScript и CSS
4. **Кэширование** — кэш для часто используемых данных

---

## 📚 Заключение

### Итоги

Проект **SWOT Analyzer** демонстрирует современный подход к разработке desktop приложений:

- ✅ Использование веб-технологий для desktop
- ✅ Кроссплатформенность из коробки
- ✅ Современный стек (React, TypeScript, Vite)
- ✅ Безопасная архитектура (изоляция процессов)
- ✅ Производительность (виртуализация, мемоизация)
- ✅ Простота распространения (electron-builder)

### Ключевые выводы

1. **Electron + React** — мощная комбинация для desktop разработки
2. **TypeScript** — критически важен для больших проектов
3. **Архитектура** — правильное разделение на слои упрощает поддержку
4. **Безопасность** — изоляция процессов через contextBridge
5. **Производительность** — виртуализация и мемоизация решают проблемы масштабирования

### Дальнейшее развитие

Возможные улучшения:

- Добавление автообновлений
- Поддержка плагинов
- Интеграция с облачными сервисами
- Мультиязычность (i18n)
- Расширенная аналитика

---

## 📖 Дополнительные ресурсы

### Официальная документация

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vite.dev/guide)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)

### Полезные статьи

- [Electron Security Best Practices](https://www.electronjs.org/docs/tutorial/security)
- [Building a Desktop App with Electron and React](https://www.electronjs.org/docs/tutorial/quick-start)
- [TypeScript in Electron](https://www.electronjs.org/docs/latest/tutorial/typescript)

---

**Версия документации:** 1.0.0  
**Дата:** 2026-01-16  
**Автор:** Разработчик SWOT Analyzer
