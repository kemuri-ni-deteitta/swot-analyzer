export type FactorType = 'S' | 'W' | 'O' | 'T'

export interface Factor {
  id: string
  type: FactorType
  text: string
  category: string
  significance: number // 1-5
  impact: number // 1-5
  probability?: number // 1-5, required for O/T
  score?: number // calculated
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
