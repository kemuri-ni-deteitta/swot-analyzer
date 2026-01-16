// Логируем, что preload скрипт начал выполняться
console.log('[preload] ========================================')
console.log('[preload] Preload script started!')
console.log('[preload] ========================================')

// Проверяем доступность Node.js модулей
try {
  console.log('[preload] Step 1: Loading electron module...')
  const { contextBridge } = require('electron')
  console.log('[preload] ✅ electron module loaded')
  
  console.log('[preload] Step 2: Loading path module...')
  const path = require('path')
  console.log('[preload] ✅ path module loaded:', typeof path)
  
  console.log('[preload] Step 3: Loading fs module...')
  const fs = require('fs')
  console.log('[preload] ✅ fs module loaded:', typeof fs)
  
  console.log('[preload] contextBridge available:', typeof contextBridge !== 'undefined')
  console.log('[preload] path module available:', typeof path !== 'undefined')
  console.log('[preload] fs module available:', typeof fs !== 'undefined')
  
  // Проверяем __dirname (двойное подчёркивание!)
  if (typeof __dirname === 'undefined') {
    console.error('[preload] CRITICAL ERROR: __dirname is not defined!')
    throw new Error('__dirname is not available in preload context')
  }
  console.log('[preload] __dirname:', __dirname)
  
  // Загружаем fileService
  let fileService
  try {
    console.log('[preload] Attempting to load fileService...')
    
    // Используем относительный путь (файл в той же директории)
    fileService = require('./fileService')
    console.log('[preload] ✅ fileService loaded successfully!')
    console.log('[preload] fileService methods:', Object.keys(fileService))
    
    // Проверяем, что методы доступны
    if (fileService && typeof fileService.saveProject === 'function') {
      console.log('[preload] ✅ saveProject method is available')
    } else {
      console.error('[preload] ❌ saveProject method is NOT available!')
      fileService = null
    }
  } catch (error) {
    console.error('[preload] ❌ Failed to load fileService:', error.message)
    console.error('[preload] Error stack:', error.stack)
    fileService = null
  }
  
  // Экспортируем fileService для использования ниже
  const fileServiceRef = fileService

  // Экспортируем API через contextBridge
  console.log('[preload] Exposing electronAPI to renderer...')
  
  if (!fileServiceRef) {
    console.error('[preload] ❌ fileService is null, API will not work!')
    console.error('[preload] This is a CRITICAL error!')
  } else {
    console.log('[preload] ✅ fileService is available, exposing API...')
  }
  
  contextBridge.exposeInMainWorld('electronAPI', {
    async getProjects() {
      if (!fileServiceRef) {
        console.error('[preload] fileService not available in getProjects')
        return []
      }
      try {
        console.log('[preload] Getting projects...')
        const projects = await fileServiceRef.getProjects()
        console.log('[preload] Got projects:', projects.length)
        return projects
      } catch (error) {
        console.error('[preload] Failed to get projects:', error)
        return []
      }
    },

    async saveProject(project, useSWOTFormat = true) {
      if (!fileServiceRef) {
        console.error('[preload] fileService not available in saveProject')
        throw new Error('File service not available')
      }
      try {
        console.log('[preload] Saving project:', project.id, project.name, useSWOTFormat ? '(.swot)' : '(.json)')
        const result = await fileServiceRef.saveProject(project, useSWOTFormat)
        console.log('[preload] ✅ Save result:', result)
        return result
      } catch (error) {
        console.error('[preload] ❌ Failed to save project:', error)
        throw error
      }
    },
    
    async openProjectFile() {
      // Запрос на открытие файла через IPC
      const { ipcRenderer } = require('electron')
      return new Promise((resolve) => {
        ipcRenderer.invoke('dialog:openProject').then((project) => {
          resolve(project)
        }).catch((error) => {
          console.error('[preload] Failed to open project file:', error)
          resolve(null)
        })
      })
    },
    
    async saveProjectAs(project) {
      // Запрос на сохранение файла через IPC
      const { ipcRenderer } = require('electron')
      return new Promise((resolve) => {
        ipcRenderer.invoke('dialog:saveProjectAs', project).then((result) => {
          resolve(result)
        }).catch((error) => {
          console.error('[preload] Failed to save project as:', error)
          resolve(false)
        })
      })
    },
    
    async saveExportedFile(blob, defaultFileName, filters) {
      const { ipcRenderer } = require('electron')
      return new Promise(async (resolve) => {
        try {
          // Конвертируем Blob в Buffer
          const arrayBuffer = await blob.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          
          // Запрашиваем путь для сохранения
          const result = await ipcRenderer.invoke('dialog:saveExportedFile', {
            defaultFileName,
            filters,
            buffer: buffer.toString('base64'),
            mimeType: blob.type,
          })
          
          resolve(result)
        } catch (error) {
          console.error('[preload] Failed to save exported file:', error)
          resolve(false)
        }
      })
    },

    async loadProject(projectId) {
      if (!fileServiceRef) {
        console.error('[preload] fileService not available in loadProject')
        return null
      }
      try {
        return await fileServiceRef.loadProject(projectId)
      } catch (error) {
        console.error(`[preload] Failed to load project ${projectId}:`, error)
        return null
      }
    },

    async deleteProject(projectId) {
      if (!fileServiceRef) {
        console.error('[preload] fileService not available in deleteProject')
        return false
      }
      try {
        await fileServiceRef.deleteProject(projectId)
        return true
      } catch (error) {
        console.error(`[preload] Failed to delete project ${projectId}:`, error)
        return false
      }
    },
  })
  
  console.log('[preload] ✅ electronAPI exposed to window.electronAPI')
  console.log('[preload] ========================================')
  
  // Подписываемся на события меню
  const { ipcRenderer } = require('electron')
  
  // Событие сохранения из меню
  ipcRenderer.on('menu-save-project', () => {
    console.log('[preload] Menu Save triggered')
    window.dispatchEvent(new CustomEvent('electron-menu-save'))
  })
  
  // Событие создания нового проекта из меню
  ipcRenderer.on('menu-new-project', () => {
    console.log('[preload] Menu New Project triggered')
    window.dispatchEvent(new CustomEvent('electron-menu-new'))
  })
  
  // Событие открытия проекта из меню
  ipcRenderer.on('menu-open-project', (event, project) => {
    console.log('[preload] Menu Open Project triggered')
    window.dispatchEvent(new CustomEvent('electron-menu-open', { detail: project }))
  })
  
  // Событие Save As из меню
  ipcRenderer.on('menu-save-project-as', () => {
    console.log('[preload] Menu Save As triggered')
    window.dispatchEvent(new CustomEvent('electron-menu-save-as'))
  })
  
} catch (error) {
  console.error('[preload] ❌ CRITICAL ERROR in preload script:', error)
  console.error('[preload] Error message:', error.message)
  console.error('[preload] Error stack:', error.stack)
}
