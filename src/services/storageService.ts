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
      console.log('[storageService] Saving project:', projectToSave.id, projectToSave.name, useSWOTFormat ? '(.swot)' : '(.json)')
      const result = await window.electronAPI.saveProject(projectToSave, useSWOTFormat)
      console.log('[storageService] Save result:', result)
      return result === true
    } catch (error) {
      console.error('[storageService] Failed to save project:', error)
      return false
    }
  },
  
  /**
   * Сохраняет проект в выбранный файл (Save As)
   */
  async saveProjectAs(project: Project): Promise<boolean> {
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
      return await window.electronAPI.saveProjectAs(projectToSave)
    } catch (error) {
      console.error('[storageService] Failed to save project as:', error)
      return false
    }
  },
  
  /**
   * Открывает проект из файла
   */
  async openProjectFromFile(): Promise<Project | null> {
    if (!window.electronAPI) {
      console.warn('[storageService] Electron API not available')
      return null
    }
    
    try {
      const project = await window.electronAPI.openProjectFile()
      return project ? this.migrateProject(project) : null
    } catch (error) {
      console.error('[storageService] Failed to open project file:', error)
      return null
    }
  },

  /**
   * Загружает один проект
   */
  async loadProject(projectId: string): Promise<Project | null> {
    if (!window.electronAPI) {
      console.warn('Electron API not available')
      return null
    }
    
    try {
      const project = await window.electronAPI.loadProject(projectId)
      return project ? this.migrateProject(project) : null
    } catch (error) {
      console.error('Failed to load project:', error)
      return null
    }
  },

  /**
   * Удаляет проект
   */
  async deleteProject(projectId: string): Promise<boolean> {
    if (!window.electronAPI) {
      console.warn('Electron API not available')
      return false
    }
    
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
    // Здесь можно добавить логику миграции при изменении схемы
    if (project.schemaVersion !== SCHEMA_VERSION) {
      // Миграция на новую версию
      console.log(`Migrating project from ${project.schemaVersion} to ${SCHEMA_VERSION}`)
    }
    
    return {
      ...project,
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
    }
  },
}
