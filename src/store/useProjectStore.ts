import { create } from 'zustand'
import { Project, Factor, Stage } from '../types'
import { calculationService } from '../services/calculationService'
import { strategyService } from '../services/strategyService'
import { storageService } from '../services/storageService'

interface ProjectState {
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
  currentProject: null,
  currentStage: 0,

  setCurrentProject: async (project) => {
    set({ currentProject: project })
    if (project) {
      get().calculateScores()
      // Автосохранение при загрузке проекта
      await storageService.saveProject(project)
    }
  },

  setCurrentStage: (stage) => {
    set({ currentStage: stage })
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
    // Автосохранение
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
    // Автосохранение
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
    // Автосохранение
    storageService.saveProject(newProject).catch(console.error)
  },

  calculateScores: () => {
    const project = get().currentProject
    if (!project) return
    
    const factorsWithScores = calculationService.calculateFactorScores(project.factors)
    const newProject = {
      ...project,
      factors: factorsWithScores,
    }
    set({ currentProject: newProject })
    // Автосохранение
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
    // Автосохранение
    storageService.saveProject(newProject).catch(console.error)
  },

  nextStage: () => {
    const current = get().currentStage
    if (current < 5) {
      set({ currentStage: (current + 1) as Stage })
    }
  },

  prevStage: () => {
    const current = get().currentStage
    if (current > 0) {
      set({ currentStage: (current - 1) as Stage })
    }
  },
}))
