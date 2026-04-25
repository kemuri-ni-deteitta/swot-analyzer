import { create } from 'zustand'
import { Project, Calculation, Factor, Interaction, Strategy, FormulaProfile, Stage } from '../types'
import { calculationService } from '../services/calculationService'
import { strategyService } from '../services/strategyService'
import { storageService } from '../services/storageService'
import { BUILT_IN_FORMULA_PROFILES } from '../services/formulaProfiles'

interface ProjectState {
  currentProject: Project | null
  currentCalculation: Calculation | null
  currentStage: Stage
  showFormulaEditor: boolean

  setCurrentProject: (project: Project | null) => Promise<void>
  setCurrentCalculation: (calculation: Calculation | null) => void
  setCurrentStage: (stage: Stage) => void
  setShowFormulaEditor: (show: boolean) => void

  createCalculation: (formulaProfileId?: string) => void
  switchCalculation: (calculationId: string) => void

  addFactor: (factor: Factor) => void
  updateFactor: (id: string, updates: Partial<Factor>) => void
  deleteFactor: (id: string) => void

  updateInteraction: (internalFactorId: string, externalFactorId: string, aij: number) => void

  calculateScores: () => void
  generateStrategies: (topCount?: number) => void

  deleteCalculation: (calculationId: string) => void

  saveFormulaProfile: (profile: FormulaProfile) => void
  deleteFormulaProfile: (profileId: string) => void
  changeCalculationFormula: (newProfileId: string) => void

  nextStage: () => void
  prevStage: () => void
}

function syncInteractions(factors: Factor[], existing: Interaction[]): Interaction[] {
  const internalFactors = factors.filter(f => f.type === 'S' || f.type === 'W')
  const externalFactors = factors.filter(f => f.type === 'O' || f.type === 'T')

  const result: Interaction[] = []
  for (const internal of internalFactors) {
    for (const external of externalFactors) {
      const existing_ = existing.find(
        i => i.internalFactorId === internal.id && i.externalFactorId === external.id
      )
      result.push(
        existing_ ?? {
          id: `int-${internal.id}-${external.id}`,
          internalFactorId: internal.id,
          externalFactorId: external.id,
          aij: 0,
        }
      )
    }
  }
  return result
}

function applyScores(calc: Calculation): Calculation {
  const profile = calc.formulaProfileSnapshot
  const updatedInteractions = calculationService.calculateInteractionScores(
    calc.factors, calc.interactions, profile
  )
  const updatedFactors = calculationService.calculateFactorScores(
    calc.factors, updatedInteractions, profile
  )
  return { ...calc, factors: updatedFactors, interactions: updatedInteractions }
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  currentCalculation: null,
  currentStage: 0,
  showFormulaEditor: false,

  setCurrentProject: async (project) => {
    if (!project) {
      set({ currentProject: null, currentCalculation: null })
      return
    }
    const activeCalc = project.calculations.find(c => c.id === project.activeCalculationId)
      ?? project.calculations[0]
      ?? null
    const syncedCalc = activeCalc
      ? applyScores({ ...activeCalc, interactions: syncInteractions(activeCalc.factors, activeCalc.interactions) })
      : null
    const updatedProject = syncedCalc
      ? {
          ...project,
          calculations: project.calculations.map(c =>
            c.id === syncedCalc.id ? syncedCalc : c
          ),
        }
      : project
    set({ currentProject: updatedProject, currentCalculation: syncedCalc })
    await storageService.saveProject(updatedProject)
  },

  setCurrentCalculation: (calculation) => {
    set({ currentCalculation: calculation })
    const project = get().currentProject
    if (!project || !calculation) return
    const updatedProject = {
      ...project,
      activeCalculationId: calculation.id,
      calculations: project.calculations.map(c =>
        c.id === calculation.id ? calculation : c
      ),
    }
    set({ currentProject: updatedProject })
  },

  setCurrentStage: (stage) => set({ currentStage: stage }),

  setShowFormulaEditor: (show) => set({ showFormulaEditor: show }),

  createCalculation: (formulaProfileId) => {
    const project = get().currentProject
    if (!project) return
    const newCalc = storageService.createCalculation(project, formulaProfileId)
    const updatedProject = {
      ...project,
      calculations: [...project.calculations, newCalc],
      activeCalculationId: newCalc.id,
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: updatedProject, currentCalculation: newCalc })
    storageService.saveProject(updatedProject).catch(console.error)
  },

  switchCalculation: (calculationId) => {
    const project = get().currentProject
    if (!project) return
    const calc = project.calculations.find(c => c.id === calculationId)
    if (!calc) return
    const synced = applyScores({ ...calc, interactions: syncInteractions(calc.factors, calc.interactions) })
    const updatedProject = {
      ...project,
      activeCalculationId: calculationId,
      calculations: project.calculations.map(c => c.id === calculationId ? synced : c),
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: updatedProject, currentCalculation: synced })
    storageService.saveProject(updatedProject).catch(console.error)
  },

  addFactor: (factor) => {
    const { currentProject, currentCalculation } = get()
    if (!currentProject || !currentCalculation) return

    const newFactors = [...currentCalculation.factors, factor]
    const newInteractions = syncInteractions(newFactors, currentCalculation.interactions)
    const updatedCalc = applyScores({
      ...currentCalculation,
      factors: newFactors,
      interactions: newInteractions,
      updatedAt: new Date().toISOString(),
    })
    const updatedProject = {
      ...currentProject,
      calculations: currentProject.calculations.map(c =>
        c.id === updatedCalc.id ? updatedCalc : c
      ),
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: updatedProject, currentCalculation: updatedCalc })
    storageService.saveProject(updatedProject).catch(console.error)
  },

  updateFactor: (id, updates) => {
    const { currentProject, currentCalculation } = get()
    if (!currentProject || !currentCalculation) return

    const newFactors = currentCalculation.factors.map(f =>
      f.id === id ? { ...f, ...updates } : f
    )
    const updatedCalc = applyScores({
      ...currentCalculation,
      factors: newFactors,
      interactions: syncInteractions(newFactors, currentCalculation.interactions),
      updatedAt: new Date().toISOString(),
    })
    const updatedProject = {
      ...currentProject,
      calculations: currentProject.calculations.map(c =>
        c.id === updatedCalc.id ? updatedCalc : c
      ),
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: updatedProject, currentCalculation: updatedCalc })
    storageService.saveProject(updatedProject).catch(console.error)
  },

  deleteFactor: (id) => {
    const { currentProject, currentCalculation } = get()
    if (!currentProject || !currentCalculation) return

    const newFactors = currentCalculation.factors.filter(f => f.id !== id)
    const newInteractions = syncInteractions(newFactors, currentCalculation.interactions)
    const updatedCalc = applyScores({
      ...currentCalculation,
      factors: newFactors,
      interactions: newInteractions,
      updatedAt: new Date().toISOString(),
    })
    const updatedProject = {
      ...currentProject,
      calculations: currentProject.calculations.map(c =>
        c.id === updatedCalc.id ? updatedCalc : c
      ),
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: updatedProject, currentCalculation: updatedCalc })
    storageService.saveProject(updatedProject).catch(console.error)
  },

  updateInteraction: (internalFactorId, externalFactorId, aij) => {
    const { currentProject, currentCalculation } = get()
    if (!currentProject || !currentCalculation) return

    const newInteractions = currentCalculation.interactions.map(i =>
      i.internalFactorId === internalFactorId && i.externalFactorId === externalFactorId
        ? { ...i, aij }
        : i
    )
    const updatedCalc = applyScores({
      ...currentCalculation,
      interactions: newInteractions,
      updatedAt: new Date().toISOString(),
    })
    const updatedProject = {
      ...currentProject,
      calculations: currentProject.calculations.map(c =>
        c.id === updatedCalc.id ? updatedCalc : c
      ),
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: updatedProject, currentCalculation: updatedCalc })
    storageService.saveProject(updatedProject).catch(console.error)
  },

  calculateScores: () => {
    const { currentProject, currentCalculation } = get()
    if (!currentProject || !currentCalculation) return
    const updatedCalc = applyScores(currentCalculation)
    const updatedProject = {
      ...currentProject,
      calculations: currentProject.calculations.map(c =>
        c.id === updatedCalc.id ? updatedCalc : c
      ),
    }
    set({ currentProject: updatedProject, currentCalculation: updatedCalc })
    storageService.saveProject(updatedProject).catch(console.error)
  },

  generateStrategies: (topCount = 5) => {
    const { currentProject, currentCalculation } = get()
    if (!currentProject || !currentCalculation) return
    const profile = currentCalculation.formulaProfileSnapshot
    const strategies: Strategy[] = strategyService.generateStrategies(
      currentCalculation.factors,
      currentCalculation.interactions,
      profile,
      topCount
    )
    const updatedCalc = {
      ...currentCalculation,
      strategies,
      updatedAt: new Date().toISOString(),
    }
    const updatedProject = {
      ...currentProject,
      calculations: currentProject.calculations.map(c =>
        c.id === updatedCalc.id ? updatedCalc : c
      ),
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: updatedProject, currentCalculation: updatedCalc })
    storageService.saveProject(updatedProject).catch(console.error)
  },

  deleteCalculation: (calculationId) => {
    const { currentProject, currentCalculation } = get()
    if (!currentProject) return
    const remaining = currentProject.calculations.filter(c => c.id !== calculationId)
    let newCurrentCalc = currentCalculation
    let newActiveId = currentProject.activeCalculationId
    if (currentCalculation?.id === calculationId) {
      newCurrentCalc = remaining[0] ?? null
      newActiveId = newCurrentCalc?.id ?? null
    }
    const updatedProject = {
      ...currentProject,
      calculations: remaining,
      activeCalculationId: newActiveId,
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: updatedProject, currentCalculation: newCurrentCalc })
    storageService.saveProject(updatedProject).catch(console.error)
  },

  saveFormulaProfile: (profile) => {
    const project = get().currentProject
    if (!project) return
    const existing = project.formulaProfiles.find(p => p.id === profile.id)
    const updatedProfiles = existing
      ? project.formulaProfiles.map(p => (p.id === profile.id ? profile : p))
      : [...project.formulaProfiles, profile]
    const updatedProject = {
      ...project,
      formulaProfiles: updatedProfiles,
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: updatedProject })
    storageService.saveProject(updatedProject).catch(console.error)
  },

  deleteFormulaProfile: (profileId) => {
    const project = get().currentProject
    if (!project) return
    const updatedProject = {
      ...project,
      formulaProfiles: project.formulaProfiles.filter(p => p.id !== profileId),
      updatedAt: new Date().toISOString(),
    }
    set({ currentProject: updatedProject })
    storageService.saveProject(updatedProject).catch(console.error)
  },

  changeCalculationFormula: (newProfileId) => {
    const { currentProject, currentCalculation } = get()
    if (!currentProject || !currentCalculation) return
    const allProfiles = [
      ...BUILT_IN_FORMULA_PROFILES,
      ...currentProject.formulaProfiles,
    ]
    const profile = allProfiles.find(p => p.id === newProfileId)
    if (!profile) return

    const maxVersion = currentProject.calculations.reduce((m, c) => Math.max(m, c.version), 0)
    const newVersion = maxVersion + 1
    const now = new Date().toISOString()
    const newCalc: Calculation = {
      id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Расчёт v${newVersion}`,
      version: newVersion,
      formulaProfileId: newProfileId,
      formulaProfileSnapshot: profile,
      factors: [],
      interactions: [],
      strategies: [],
      createdAt: now,
      updatedAt: now,
    }
    const updatedProject = {
      ...currentProject,
      calculations: [...currentProject.calculations, newCalc],
      activeCalculationId: newCalc.id,
      updatedAt: now,
    }
    set({ currentProject: updatedProject, currentCalculation: newCalc })
    storageService.saveProject(updatedProject).catch(console.error)
  },

  nextStage: () => {
    const current = get().currentStage
    if (current < 6) set({ currentStage: (current + 1) as Stage })
  },

  prevStage: () => {
    const current = get().currentStage
    if (current > 0) set({ currentStage: (current - 1) as Stage })
  },
}))
