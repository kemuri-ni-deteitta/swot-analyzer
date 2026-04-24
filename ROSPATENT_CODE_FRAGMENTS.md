# Фрагменты кода программы «SWOT Analyzer»

---

## 1. Типы данных и интерфейсы (`src/types/index.ts`)

```typescript
export type FactorType = 'S' | 'W' | 'O' | 'T'

export interface Factor {
  id: string
  type: FactorType
  text: string
  category: string
  significance: number // 1-5
  impact: number // 1-5
  probability?: number // 0-1, обязательно для O/T
  score?: number // вычисляемое поле
}

export interface Strategy {
  id: string
  type: 'SO' | 'WO' | 'ST' | 'WT'
  title: string
  description: string
  factors: Factor[]
}

export interface Project {
  id: string
  name: string
  description?: string
  factors: Factor[]
  strategies: Strategy[]
  createdAt: string
  updatedAt: string
  schemaVersion: string
  appVersion: string
}

export interface QuadrantTotals {
  S: number
  W: number
  O: number
  T: number
}

export interface CategorySummary {
  category: string
  totalScore: number
  factorCount: number
}

export type Stage = 0 | 1 | 2 | 3 | 4 | 5

export interface ValidationError {
  factorId: string
  field: string
  message: string
}
```

---

## 2. Сервис расчётов (`src/services/calculationService.ts`)

```typescript
import { Factor, QuadrantTotals, CategorySummary } from '../types'

export const calculationService = {
  /**
   * Рассчитывает score для факторов
   * S/W: score = significance × impact
   * O/T: score = significance × impact × probability
   */
  calculateFactorScores(factors: Factor[]): Factor[] {
    return factors.map(factor => {
      let score: number

      if (factor.type === 'S' || factor.type === 'W') {
        score = factor.significance * factor.impact
      } else {
        // O или T
        const probability = factor.probability ?? 1
        score = Math.round(factor.significance * factor.impact * probability * 100) / 100
      }

      return { ...factor, score }
    })
  },

  /**
   * Рассчитывает суммы по квадрантам
   */
  calculateQuadrantTotals(factors: Factor[]): QuadrantTotals {
    const totals: QuadrantTotals = { S: 0, W: 0, O: 0, T: 0 }

    factors.forEach(factor => {
      if (factor.score) {
        totals[factor.type] += factor.score
      }
    })

    return totals
  },

  /**
   * Рассчитывает сводку по категориям
   */
  calculateCategorySummary(factors: Factor[]): CategorySummary[] {
    const categoryMap = new Map<string, { totalScore: number; factorCount: number }>()

    factors.forEach(factor => {
      const existing = categoryMap.get(factor.category) || { totalScore: 0, factorCount: 0 }
      categoryMap.set(factor.category, {
        totalScore: existing.totalScore + (factor.score || 0),
        factorCount: existing.factorCount + 1,
      })
    })

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        totalScore: data.totalScore,
        factorCount: data.factorCount,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
  },

  /**
   * Получает топ-N факторов по score
   */
  getTopFactors(factors: Factor[], count: number = 10): Factor[] {
    return [...factors]
      .filter(f => f.score !== undefined)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, count)
  },
}
```

---

## 3. Сервис генерации стратегий (`src/services/strategyService.ts`)

```typescript
import { Factor, Strategy } from '../types'
import { calculationService } from './calculationService'

export const strategyService = {
  /**
   * Генерирует стратегии SO/WO/ST/WT на основе топ факторов
   */
  generateStrategies(factors: Factor[], topCount: number = 5): Strategy[] {
    const topFactors = calculationService.getTopFactors(factors, topCount)

    const strengths = topFactors.filter(f => f.type === 'S')
    const weaknesses = topFactors.filter(f => f.type === 'W')
    const opportunities = topFactors.filter(f => f.type === 'O')
    const threats = topFactors.filter(f => f.type === 'T')

    const strategies: Strategy[] = []
    const maxFactorsPerType = 3

    // SO стратегии (Strengths + Opportunities)
    if (strengths.length > 0 && opportunities.length > 0) {
      strategies.push({
        id: `so-${Date.now()}-${Math.random()}`,
        type: 'SO',
        title: 'Использовать сильные стороны для возможностей',
        description: this.generateStrategyDescription(strengths, opportunities),
        factors: [...strengths.slice(0, maxFactorsPerType), ...opportunities.slice(0, maxFactorsPerType)],
      })
    }

    // WO стратегии (Weaknesses + Opportunities)
    if (weaknesses.length > 0 && opportunities.length > 0) {
      strategies.push({
        id: `wo-${Date.now()}-${Math.random()}`,
        type: 'WO',
        title: 'Преодолеть слабости через возможности',
        description: this.generateStrategyDescription(weaknesses, opportunities),
        factors: [...weaknesses.slice(0, maxFactorsPerType), ...opportunities.slice(0, maxFactorsPerType)],
      })
    }

    // ST стратегии (Strengths + Threats)
    if (strengths.length > 0 && threats.length > 0) {
      strategies.push({
        id: `st-${Date.now()}-${Math.random()}`,
        type: 'ST',
        title: 'Использовать сильные стороны против угроз',
        description: this.generateStrategyDescription(strengths, threats),
        factors: [...strengths.slice(0, maxFactorsPerType), ...threats.slice(0, maxFactorsPerType)],
      })
    }

    // WT стратегии (Weaknesses + Threats)
    if (weaknesses.length > 0 && threats.length > 0) {
      strategies.push({
        id: `wt-${Date.now()}-${Math.random()}`,
        type: 'WT',
        title: 'Минимизировать слабости и угрозы',
        description: this.generateStrategyDescription(weaknesses, threats),
        factors: [...weaknesses.slice(0, maxFactorsPerType), ...threats.slice(0, maxFactorsPerType)],
      })
    }

    return strategies
  },

  /**
   * Генерирует описание стратегии на основе факторов
   */
  generateStrategyDescription(factors1: Factor[], factors2: Factor[]): string {
    const f1Text = factors1.map(f => f.text).join(', ')
    const f2Text = factors2.map(f => f.text).join(', ')

    if (factors1.length === 0 || factors2.length === 0) {
      return `Комбинация факторов: ${f1Text || f2Text}`
    }

    return `Комбинация факторов: ${f1Text} и ${f2Text}`
  },

  /**
   * Получает подробное описание типа стратегии
   */
  getStrategyTypeDescription(type: 'SO' | 'WO' | 'ST' | 'WT'): string {
    const descriptions = {
      SO: 'Агрессивная стратегия: используйте внутренние сильные стороны для максимального использования внешних возможностей. Это стратегия роста и экспансии.',
      WO: 'Оборонительная стратегия: используйте внешние возможности для преодоления внутренних слабостей. Фокус на улучшении и развитии.',
      ST: 'Защитная стратегия: используйте внутренние сильные стороны для защиты от внешних угроз. Стратегия стабильности и защиты позиций.',
      WT: 'Стратегия минимизации: минимизируйте влияние комбинации слабостей и угроз. Критическая стратегия выживания.',
    }
    return descriptions[type]
  },

  /**
   * Рассчитывает приоритет стратегии на основе score факторов
   */
  calculateStrategyPriority(strategy: Strategy): number {
    const totalScore = strategy.factors.reduce((sum, f) => sum + (f.score || 0), 0)
    return totalScore
  },

  /**
   * Анализирует доступность факторов для генерации стратегий
   */
  analyzeFactorAvailability(factors: Factor[], topCount: number): {
    topFactors: Factor[]
    strengths: number
    weaknesses: number
    opportunities: number
    threats: number
    canGenerateSO: boolean
    canGenerateWO: boolean
    canGenerateST: boolean
    canGenerateWT: boolean
    missingTypes: string[]
  } {
    const topFactors = calculationService.getTopFactors(factors, topCount)

    const strengths = topFactors.filter(f => f.type === 'S')
    const weaknesses = topFactors.filter(f => f.type === 'W')
    const opportunities = topFactors.filter(f => f.type === 'O')
    const threats = topFactors.filter(f => f.type === 'T')

    const canGenerateSO = strengths.length > 0 && opportunities.length > 0
    const canGenerateWO = weaknesses.length > 0 && opportunities.length > 0
    const canGenerateST = strengths.length > 0 && threats.length > 0
    const canGenerateWT = weaknesses.length > 0 && threats.length > 0

    const missingTypes: string[] = []
    if (strengths.length === 0 && weaknesses.length === 0) {
      missingTypes.push('нет внутренних факторов (S или W)')
    }
    if (opportunities.length === 0 && threats.length === 0) {
      missingTypes.push('нет внешних факторов (O или T)')
    }

    return {
      topFactors,
      strengths: strengths.length,
      weaknesses: weaknesses.length,
      opportunities: opportunities.length,
      threats: threats.length,
      canGenerateSO,
      canGenerateWO,
      canGenerateST,
      canGenerateWT,
      missingTypes,
    }
  },
}
```

---

## 4. Сервис валидации (`src/services/validationService.ts`)

```typescript
import { Factor, Project, ValidationError } from '../types'

export const validationService = {
  /**
   * Валидирует один фактор
   */
  validateFactor(factor: Factor): ValidationError[] {
    const errors: ValidationError[] = []

    // type обязателен
    if (!factor.type || !['S', 'W', 'O', 'T'].includes(factor.type)) {
      errors.push({
        factorId: factor.id,
        field: 'type',
        message: 'Тип фактора обязателен (S/W/O/T)',
      })
    }

    // text обязателен
    if (!factor.text || factor.text.trim() === '') {
      errors.push({
        factorId: factor.id,
        field: 'text',
        message: 'Текст фактора обязателен',
      })
    }

    // category обязателен
    if (!factor.category || factor.category.trim() === '') {
      errors.push({
        factorId: factor.id,
        field: 'category',
        message: 'Категория обязательна',
      })
    }

    // significance: 1..5
    if (factor.significance < 1 || factor.significance > 5) {
      errors.push({
        factorId: factor.id,
        field: 'significance',
        message: 'Значимость должна быть от 1 до 5',
      })
    }

    // impact: 1..5
    if (factor.impact < 1 || factor.impact > 5) {
      errors.push({
        factorId: factor.id,
        field: 'impact',
        message: 'Влияние должно быть от 1 до 5',
      })
    }

    // probability обязательна для O/T и должна быть 0..1
    if (factor.type === 'O' || factor.type === 'T') {
      if (factor.probability === undefined || factor.probability === null) {
        errors.push({
          factorId: factor.id,
          field: 'probability',
          message: 'Вероятность обязательна для возможностей и угроз',
        })
      } else if (factor.probability < 0 || factor.probability > 1) {
        errors.push({
          factorId: factor.id,
          field: 'probability',
          message: 'Вероятность должна быть от 0 до 1',
        })
      }
    }

    return errors
  },

  /**
   * Валидирует весь проект
   */
  validateProject(project: Project): Record<string, string[]> {
    const errors: Record<string, string[]> = {}

    project.factors.forEach(factor => {
      const factorErrors = this.validateFactor(factor)
      if (factorErrors.length > 0) {
        errors[factor.id] = factorErrors.map(e => e.message)
      }
    })

    return errors
  },
}
```

---

## 5. Сервис хранения данных (`src/services/storageService.ts`)

```typescript
import { Project } from '../types'

const APP_VERSION = '1.0.0'
const SCHEMA_VERSION = '1.0.0'

export const storageService = {
  /**
   * Создаёт новый проект
   */
  createProject(name: string, description?: string): Project {
    const now = new Date().toISOString()
    return {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      factors: [],
      strategies: [],
      createdAt: now,
      updatedAt: now,
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
    }
  },

  /**
   * Загружает все проекты
   */
  async loadProjects(): Promise<Project[]> {
    if (!window.electronAPI) {
      console.warn('Electron API not available')
      return []
    }
    try {
      const projects = await window.electronAPI.getProjects()
      return projects.map(this.migrateProject)
    } catch (error) {
      console.error('Failed to load projects:', error)
      return []
    }
  },

  /**
   * Сохраняет проект
   */
  async saveProject(project: Project, useSWOTFormat: boolean = true): Promise<boolean> {
    if (!window.electronAPI) return false

    try {
      const projectToSave = {
        ...project,
        updatedAt: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
        appVersion: APP_VERSION,
      }
      const result = await window.electronAPI.saveProject(projectToSave, useSWOTFormat)
      return result === true
    } catch (error) {
      console.error('[storageService] Failed to save project:', error)
      return false
    }
  },

  /**
   * Открывает проект из файла
   */
  async openProjectFromFile(): Promise<Project | null> {
    if (!window.electronAPI) return null
    try {
      const project = await window.electronAPI.openProjectFile()
      return project ? this.migrateProject(project) : null
    } catch (error) {
      console.error('[storageService] Failed to open project file:', error)
      return null
    }
  },

  /**
   * Удаляет проект
   */
  async deleteProject(projectId: string): Promise<boolean> {
    if (!window.electronAPI) return false
    try {
      return await window.electronAPI.deleteProject(projectId)
    } catch (error) {
      console.error('Failed to delete project:', error)
      return false
    }
  },

  /**
   * Мигрирует проект на новую версию схемы
   */
  migrateProject(project: any): Project {
    if (project.schemaVersion !== SCHEMA_VERSION) {
      console.log(`Migrating project from ${project.schemaVersion} to ${SCHEMA_VERSION}`)
    }
    return {
      ...project,
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
    }
  },
}
```

---

## 6. Глобальное хранилище состояния (`src/store/useProjectStore.ts`)

```typescript
import { create } from 'zustand'
import { Project, Factor, Stage } from '../types'
import { calculationService } from '../services/calculationService'
import { strategyService } from '../services/strategyService'
import { storageService } from '../services/storageService'

interface ProjectState {
  currentProject: Project | null
  currentStage: Stage

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
  currentProject: null,
  currentStage: 0,

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

  updateFactor: (id, updates) => {
    const project = get().currentProject
    if (!project) return

    const newProject = {
      ...project,
      factors: project.factors.map(f =>
        f.id === id ? { ...f, ...updates } : f
      ),
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: newProject })
    get().calculateScores()
    storageService.saveProject(newProject).catch(console.error)
  },

  deleteFactor: (id) => {
    const project = get().currentProject
    if (!project) return

    const newProject = {
      ...project,
      factors: project.factors.filter(f => f.id !== id),
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: newProject })
    get().calculateScores()
    storageService.saveProject(newProject).catch(console.error)
  },

  calculateScores: () => {
    const project = get().currentProject
    if (!project) return

    const factorsWithScores = calculationService.calculateFactorScores(project.factors)
    const newProject = { ...project, factors: factorsWithScores }
    set({ currentProject: newProject })
    storageService.saveProject(newProject).catch(console.error)
  },

  generateStrategies: (topCount = 5) => {
    const project = get().currentProject
    if (!project) return

    const strategies = strategyService.generateStrategies(project.factors, topCount)
    const newProject = {
      ...project,
      strategies,
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: newProject })
    storageService.saveProject(newProject).catch(console.error)
  },

  nextStage: () => {
    const current = get().currentStage
    if (current < 5) set({ currentStage: (current + 1) as Stage })
  },

  prevStage: () => {
    const current = get().currentStage
    if (current > 0) set({ currentStage: (current - 1) as Stage })
  },
}))
```

---

## 7. Компонент формы добавления фактора (`src/components/widgets/FactorForm.tsx`)

```typescript
import { useState } from 'react'
import { Factor, FactorType } from '../../types'
import { getFactorTypeShortLabel } from '../../utils/factorTypes'

type Props = {
  onSubmit: (factor: Factor) => void
}

const factorTypes: FactorType[] = ['S', 'W', 'O', 'T']

const defaultState = {
  type: 'S' as FactorType,
  text: '',
  category: '',
  significance: 3,
  impact: 3,
  probability: 0.5,
}

export function FactorForm({ onSubmit }: Props) {
  const [state, setState] = useState(defaultState)
  const [categoryError, setCategoryError] = useState(false)
  const [textError, setTextError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.text.trim() || !state.category.trim()) {
      if (!state.category.trim()) setCategoryError(true)
      if (!state.text.trim()) setTextError(true)
      return
    }

    const factor: Factor = {
      id: crypto.randomUUID(),
      type: state.type,
      text: state.text.trim(),
      category: state.category.trim(),
      significance: Number(state.significance),
      impact: Number(state.impact),
      probability:
        state.type === 'O' || state.type === 'T' ? Number(state.probability) : undefined,
    }
    onSubmit(factor)
    setState(defaultState)
  }

  const update = <K extends keyof typeof state>(key: K, value: any) => {
    if (key === 'significance' || key === 'impact') {
      const numValue = Number(value)
      if (isNaN(numValue) || numValue < 1) value = 1
      else if (numValue > 5) value = 5
      else value = Math.round(numValue)
    } else if (key === 'probability') {
      const numValue = Number(value)
      if (isNaN(numValue) || numValue < 0) value = 0
      else if (numValue > 1) value = 1
      else value = Math.round(numValue * 100) / 100
    }
    setState(prev => ({ ...prev, [key]: value }))
  }

  return (
    <form className="factor-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Тип
          <select
            value={state.type}
            onChange={e => update('type', e.target.value as FactorType)}
          >
            {factorTypes.map(type => (
              <option key={type} value={type}>
                {getFactorTypeShortLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Категория
          <input
            type="text"
            value={state.category}
            onChange={e => update('category', e.target.value)}
            placeholder="Категория"
            className={categoryError ? 'error-input' : ''}
            required
          />
          {categoryError && (
            <span className="error-message">Необходимо ввести категорию</span>
          )}
        </label>

        <label>
          Значимость (1-5)
          <input
            type="number"
            min={1}
            max={5}
            value={state.significance}
            onChange={e => update('significance', e.target.value)}
          />
        </label>

        <label>
          Влияние (1-5)
          <input
            type="number"
            min={1}
            max={5}
            value={state.impact}
            onChange={e => update('impact', e.target.value)}
          />
        </label>

        {(state.type === 'O' || state.type === 'T') && (
          <label>
            Вероятность (0-1)
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={state.probability}
              onChange={e => update('probability', e.target.value)}
            />
          </label>
        )}
      </div>

      <div className="form-row">
        <label className="flex-1">
          Текст фактора
          <input
            type="text"
            value={state.text}
            onChange={e => update('text', e.target.value)}
            placeholder="Опишите фактор"
            className={textError ? 'error-input' : ''}
            required
          />
          {textError && (
            <span className="error-message">Необходимо ввести текст фактора</span>
          )}
        </label>
        <button type="submit" className="primary-btn">
          Добавить
        </button>
      </div>
    </form>
  )
}
```

---

## 8. Компонент SWOT-матрицы (`src/components/widgets/SWOTMatrix.tsx`)

```typescript
import { useMemo } from 'react'
import { Factor } from '../../types'
import { calculationService } from '../../services/calculationService'

type Props = {
  factors: Factor[]
}

export function SWOTMatrix({ factors }: Props) {
  const totals = useMemo(() => {
    return calculationService.calculateQuadrantTotals(factors)
  }, [factors])

  const factorsByType = useMemo(() => ({
    S: factors.filter(f => f.type === 'S'),
    W: factors.filter(f => f.type === 'W'),
    O: factors.filter(f => f.type === 'O'),
    T: factors.filter(f => f.type === 'T'),
  }), [factors])

  const topFactorsByType = useMemo(() => ({
    S: calculationService.getTopFactors(factorsByType.S, 3),
    W: calculationService.getTopFactors(factorsByType.W, 3),
    O: calculationService.getTopFactors(factorsByType.O, 3),
    T: calculationService.getTopFactors(factorsByType.T, 3),
  }), [factorsByType])

  return (
    <div className="swot-matrix">
      <h3>SWOT Матрица</h3>
      <div className="matrix-grid">
        <div className="quadrant quadrant-strengths">
          <div className="quadrant-header">
            <span className="quadrant-label">S</span>
            <span className="quadrant-title">Strengths — Сильные стороны</span>
          </div>
          <div className="quadrant-total">Σ = {totals.S.toFixed(1)}</div>
          <ul>
            {topFactorsByType.S.map(factor => (
              <li key={factor.id}>{factor.text}</li>
            ))}
          </ul>
        </div>

        <div className="quadrant quadrant-weaknesses">
          <div className="quadrant-header">
            <span className="quadrant-label">W</span>
            <span className="quadrant-title">Weaknesses — Слабые стороны</span>
          </div>
          <div className="quadrant-total">Σ = {totals.W.toFixed(1)}</div>
          <ul>
            {topFactorsByType.W.map(factor => (
              <li key={factor.id}>{factor.text}</li>
            ))}
          </ul>
        </div>

        <div className="quadrant quadrant-opportunities">
          <div className="quadrant-header">
            <span className="quadrant-label">O</span>
            <span className="quadrant-title">Opportunities — Возможности</span>
          </div>
          <div className="quadrant-total">Σ = {totals.O.toFixed(1)}</div>
          <ul>
            {topFactorsByType.O.map(factor => (
              <li key={factor.id}>{factor.text}</li>
            ))}
          </ul>
        </div>

        <div className="quadrant quadrant-threats">
          <div className="quadrant-header">
            <span className="quadrant-label">T</span>
            <span className="quadrant-title">Threats — Угрозы</span>
          </div>
          <div className="quadrant-total">Σ = {totals.T.toFixed(1)}</div>
          <ul>
            {topFactorsByType.T.map(factor => (
              <li key={factor.id}>{factor.text}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
```

---

## 9. Формат файла проекта `.swot` (`src/utils/swotFileFormat.ts`)

```typescript
export interface SWOTFileHeader {
  signature: string    // "SWOT"
  formatVersion: number
  appVersion: string
}

export interface SWOTFile {
  header: SWOTFileHeader
  project: any
}

const FILE_SIGNATURE = 'SWOT'
const FORMAT_VERSION = 1

/**
 * Создаёт содержимое файла .swot из проекта
 */
export function serializeProject(project: any, appVersion: string): string {
  const file: SWOTFile = {
    header: {
      signature: FILE_SIGNATURE,
      formatVersion: FORMAT_VERSION,
      appVersion: appVersion,
    },
    project: project,
  }
  return JSON.stringify(file, null, 2)
}

/**
 * Парсит содержимое файла .swot и возвращает проект
 */
export function deserializeProject(content: string): {
  project: any
  isValid: boolean
  error?: string
} {
  try {
    const file: SWOTFile = JSON.parse(content)

    if (!file.header || file.header.signature !== FILE_SIGNATURE) {
      return {
        project: null,
        isValid: false,
        error: 'Неверный формат файла: отсутствует сигнатура SWOT',
      }
    }

    if (file.header.formatVersion > FORMAT_VERSION) {
      return {
        project: null,
        isValid: false,
        error: `Файл создан в более новой версии приложения`,
      }
    }

    return { project: file.project, isValid: true }
  } catch (error) {
    return {
      project: null,
      isValid: false,
      error: `Ошибка парсинга файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
    }
  }
}

/**
 * Проверяет, является ли файл валидным .swot файлом
 */
export function isValidSWOTFile(content: string): boolean {
  try {
    const file = JSON.parse(content)
    return file.header?.signature === FILE_SIGNATURE
  } catch {
    return false
  }
}
```

---

## 10. Главное окно приложения (`src/components/MainWindow.tsx`)

```typescript
import { useState, useEffect } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { useTheme } from '../contexts/ThemeContext'
import { storageService } from '../services/storageService'
import ProjectHubView from './stages/ProjectHubView'
import FactorsInputView from './stages/FactorsInputView'
import CalculationView from './stages/CalculationView'
import VisualizationView from './stages/VisualizationView'
import StrategiesView from './stages/StrategiesView'
import SummaryView from './stages/SummaryView'

const STAGES = [
  { id: 0, component: ProjectHubView,    title: 'Проекты'          },
  { id: 1, component: FactorsInputView,  title: 'Ввод факторов'    },
  { id: 2, component: CalculationView,   title: 'Расчёт и проверка' },
  { id: 3, component: VisualizationView, title: 'Визуализация'     },
  { id: 4, component: StrategiesView,    title: 'Стратегии'        },
  { id: 5, component: SummaryView,       title: 'Итог'             },
]

export default function MainWindow() {
  const { currentStage, nextStage, prevStage, currentProject,
          setCurrentStage, setCurrentProject } = useProjectStore()
  const { theme, toggleTheme } = useTheme()
  const StageComponent = STAGES[currentStage].component
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handleSaveProject = async () => {
    if (!currentProject) return
    setSaving(true)
    const saved = await storageService.saveProject(currentProject)
    if (saved) {
      setLastSaved(new Date())
      setSaveMessage('✓ Проект сохранён')
    } else {
      setSaveMessage('✗ Ошибка сохранения')
    }
    setSaving(false)
    setTimeout(() => setSaveMessage(null), 2000)
  }

  // Подписка на события меню Electron
  useEffect(() => {
    const handleMenuSave = () => handleSaveProject()
    const handleMenuNew  = () => setCurrentStage(0)
    const handleMenuOpen = (event: CustomEvent) => {
      const project = event.detail
      if (project) {
        setCurrentProject(project)
        setCurrentStage(1)
      }
    }

    window.addEventListener('electron-menu-save', handleMenuSave)
    window.addEventListener('electron-menu-new', handleMenuNew)
    window.addEventListener('electron-menu-open', handleMenuOpen as EventListener)

    return () => {
      window.removeEventListener('electron-menu-save', handleMenuSave)
      window.removeEventListener('electron-menu-new', handleMenuNew)
      window.removeEventListener('electron-menu-open', handleMenuOpen as EventListener)
    }
  }, [currentProject, setCurrentProject, setCurrentStage])

  return (
    <div className="main-window">
      <div className="top-bar">
        <div className="top-bar-left">
          <h1 className="app-title">SWOT Analyzer</h1>
          {currentProject && (
            <span className="project-name">{currentProject.name}</span>
          )}
          {saveMessage && (
            <span className={`save-status ${saveMessage.startsWith('✓') ? 'success' : 'error'}`}>
              {saveMessage}
            </span>
          )}
        </div>
        <div className="top-bar-right">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>

      <div className="workspace">
        <StageComponent />
      </div>

      <div className="bottom-bar">
        <button className="nav-button" onClick={prevStage} disabled={currentStage === 0}>
          ← Назад
        </button>
        <div className="stage-indicator">
          Этап {currentStage + 1} из {STAGES.length}: {STAGES[currentStage].title}
        </div>
        {currentStage < STAGES.length - 1 && (
          <button className="nav-button" onClick={nextStage}>
            Далее →
          </button>
        )}
      </div>
    </div>
  )
}
```
