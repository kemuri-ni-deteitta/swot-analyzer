export type FactorType = 'S' | 'W' | 'O' | 'T'

export interface Factor {
  id: string
  type: FactorType
  text: string
  category: string
  significance: number // 1-5 (Ai for S/W, Kj for O/T)
  impact?: number // 1-5, only used in simplified formula
  probability?: number // 0-1, required for O/T
  score?: number // computed
  customFieldValues?: Record<string, number>
}

export interface Interaction {
  id: string
  internalFactorId: string // S or W factor id
  externalFactorId: string // O or T factor id
  aij: number // kept for file-format compatibility; not used in calculation
  score?: number // computed: Ai × Kj × Pj
}

export interface Strategy {
  id: string
  type: 'SO' | 'WO' | 'ST' | 'WT'
  title: string
  description: string
  factors: Factor[]
  interactionScore?: number
}

export type FormulaMode = 'seminar' | 'simplified' | 'custom'

export interface FormulaField {
  key: string
  label: string
  type: 'number'
  min?: number
  max?: number
  defaultValue?: number
  step?: number
  appliesTo?: FactorType[]
}

export interface FormulaProfile {
  id: string
  name: string
  mode: FormulaMode
  description?: string
  isBuiltIn: boolean
  factorExpression?: string
  interactionExpression?: string
  customFields?: FormulaField[]
  createdAt: string
  updatedAt: string
}

export interface Calculation {
  id: string
  name: string
  version: number
  formulaProfileId: string
  formulaProfileSnapshot: FormulaProfile
  factors: Factor[]
  interactions: Interaction[]
  strategies: Strategy[]
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  calculations: Calculation[]
  activeCalculationId: string | null
  formulaProfiles: FormulaProfile[]
  // Legacy fields kept for migration
  factors?: Factor[]
  strategies?: Strategy[]
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

export interface InteractionTotals {
  SO: number
  WT: number
}

export interface CategorySummary {
  category: string
  totalScore: number
  factorCount: number
}

export type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface ValidationError {
  factorId: string
  field: string
  message: string
}
