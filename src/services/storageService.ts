import { Project, Calculation, Factor, Strategy } from '../types'
import { BUILT_IN_FORMULA_PROFILES, DEFAULT_FORMULA_ID } from './formulaProfiles'

const APP_VERSION = '2.0.0'
const SCHEMA_VERSION = '2.0.0'

function makeCalculationFromLegacy(
  factors: Factor[],
  strategies: Strategy[],
  projectCreatedAt: string
): Calculation {
  const simplifiedProfile = BUILT_IN_FORMULA_PROFILES.find(p => p.id === 'simplified')!
  const now = projectCreatedAt || new Date().toISOString()
  return {
    id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Расчёт v1',
    version: 1,
    formulaProfileId: 'simplified',
    formulaProfileSnapshot: simplifiedProfile,
    factors,
    interactions: [],
    strategies,
    createdAt: now,
    updatedAt: now,
  }
}

export const storageService = {
  createProject(name: string, description?: string): Project {
    const now = new Date().toISOString()
    const defaultProfile = BUILT_IN_FORMULA_PROFILES.find(p => p.id === DEFAULT_FORMULA_ID)!
    const firstCalc: Calculation = {
      id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Расчёт v1',
      version: 1,
      formulaProfileId: DEFAULT_FORMULA_ID,
      formulaProfileSnapshot: defaultProfile,
      factors: [],
      interactions: [],
      strategies: [],
      createdAt: now,
      updatedAt: now,
    }
    return {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      calculations: [firstCalc],
      activeCalculationId: firstCalc.id,
      formulaProfiles: [],
      createdAt: now,
      updatedAt: now,
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
    }
  },

  createCalculation(project: Project, formulaProfileId?: string): Calculation {
    const profileId = formulaProfileId ?? DEFAULT_FORMULA_ID
    const profile =
      BUILT_IN_FORMULA_PROFILES.find(p => p.id === profileId) ||
      project.formulaProfiles.find(p => p.id === profileId) ||
      BUILT_IN_FORMULA_PROFILES.find(p => p.id === DEFAULT_FORMULA_ID)!
    const maxVersion = project.calculations.reduce((m, c) => Math.max(m, c.version), 0)
    const version = maxVersion + 1
    const now = new Date().toISOString()
    return {
      id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Расчёт v${version}`,
      version,
      formulaProfileId: profile.id,
      formulaProfileSnapshot: profile,
      factors: [],
      interactions: [],
      strategies: [],
      createdAt: now,
      updatedAt: now,
    }
  },

  async loadProjects(): Promise<Project[]> {
    if (!window.electronAPI) {
      console.warn('Electron API not available')
      return []
    }
    try {
      const projects = await window.electronAPI.getProjects()
      return projects.map((p: any) => this.migrateProject(p))
    } catch (error) {
      console.error('Failed to load projects:', error)
      return []
    }
  },

  async saveProject(project: Project, useSWOTFormat = true): Promise<boolean> {
    if (!window.electronAPI) {
      console.warn('[storageService] Electron API not available')
      return false
    }
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

  async saveProjectAs(project: Project): Promise<boolean> {
    if (!window.electronAPI) return false
    try {
      const projectToSave = {
        ...project,
        updatedAt: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
        appVersion: APP_VERSION,
      }
      return await window.electronAPI.saveProjectAs(projectToSave)
    } catch (error) {
      console.error('[storageService] Failed to save project as:', error)
      return false
    }
  },

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

  async deleteProject(projectId: string): Promise<boolean> {
    if (!window.electronAPI) return false
    try {
      return await window.electronAPI.deleteProject(projectId)
    } catch (error) {
      console.error('Failed to delete project:', error)
      return false
    }
  },

  migrateProject(project: any): Project {
    // Legacy format: project has .factors and .strategies but no .calculations
    if (!project.calculations || project.calculations.length === 0) {
      const factors: Factor[] = Array.isArray(project.factors) ? project.factors : []
      const strategies: Strategy[] = Array.isArray(project.strategies) ? project.strategies : []

      // Ensure impact field exists on legacy factors
      const migratedFactors = factors.map((f: any) => ({
        ...f,
        impact: f.impact ?? 3,
      }))

      const legacyCalc = makeCalculationFromLegacy(
        migratedFactors,
        strategies,
        project.createdAt
      )

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        calculations: [legacyCalc],
        activeCalculationId: legacyCalc.id,
        formulaProfiles: [],
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: project.updatedAt || new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
        appVersion: APP_VERSION,
      }
    }

    // Ensure each calculation has required fields
    const calculations: Calculation[] = (project.calculations || []).map((c: any) => ({
      ...c,
      interactions: c.interactions || [],
      strategies: c.strategies || [],
      formulaProfiles: undefined,
      formulaProfileSnapshot:
        c.formulaProfileSnapshot ||
        BUILT_IN_FORMULA_PROFILES.find(p => p.id === c.formulaProfileId) ||
        BUILT_IN_FORMULA_PROFILES[0],
    }))

    return {
      ...project,
      calculations,
      formulaProfiles: project.formulaProfiles || [],
      activeCalculationId: project.activeCalculationId || calculations[0]?.id || null,
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
    }
  },
}
