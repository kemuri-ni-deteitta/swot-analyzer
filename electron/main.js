const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs').promises
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Глобальная переменная для главного окна (для диалогов)
let mainWindowInstance = null

function createWindow() {
  // В dev режиме __dirname указывает на electron/, в production - на dist-electron/
  const preloadPath = path.join(__dirname, 'preload.js')
  
  console.log('[main] Preload path:', preloadPath)
  console.log('[main] __dirname:', __dirname)
  console.log('[main] isDev:', isDev)
  
  // Проверяем существование файла
  const fs = require('fs')
  if (fs.existsSync(preloadPath)) {
    console.log('[main] Preload file exists: YES')
  } else {
    console.error('[main] Preload file exists: NO!')
    console.error('[main] Looking for preload at:', preloadPath)
  }

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,  // Отключаем sandbox для доступа к Node.js модулям
      preload: preloadPath,
    },
  })
  
  mainWindowInstance = mainWindow
  
  // Логируем события preload
  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('[main] Preload error:', preloadPath, error)
  })
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[main] Failed to load:', errorCode, errorDescription)
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
    
    // Логируем, когда страница загрузилась
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Page loaded, checking electronAPI...')
      mainWindow.webContents.executeJavaScript(`
        console.log('window.electronAPI available:', typeof window.electronAPI !== 'undefined')
        if (window.electronAPI) {
          console.log('electronAPI methods:', Object.keys(window.electronAPI))
        }
      `)
    })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
  
  // Обработка drag & drop файлов
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })
  
  // Разрешаем drag & drop файлов
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(`
      document.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.stopPropagation()
      })
      
      document.addEventListener('drop', async (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        const files = Array.from(e.dataTransfer.files)
        const swotFiles = files.filter(f => f.name.endsWith('.swot') || f.name.endsWith('.json'))
        
        if (swotFiles.length > 0) {
          const file = swotFiles[0]
          const text = await file.text()
          try {
            const parsed = JSON.parse(text)
            let project
            if (parsed.header && parsed.header.signature === 'SWOT') {
              project = parsed.project
            } else {
              project = parsed
            }
            
            window.dispatchEvent(new CustomEvent('electron-menu-open', { detail: project }))
          } catch (error) {
            alert('Ошибка при открытии файла: ' + error.message)
          }
        }
      })
    `)
  })
}

// Создаём меню приложения
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-new-project')
            }
          },
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: async (item, focusedWindow) => {
            if (!focusedWindow) return
            
            try {
              const result = await dialog.showOpenDialog(focusedWindow, {
                title: 'Открыть проект SWOT',
                filters: [
                  { name: 'SWOT проекты', extensions: ['swot'] },
                  { name: 'JSON файлы', extensions: ['json'] },
                  { name: 'Все файлы', extensions: ['*'] },
                ],
                properties: ['openFile'],
              })
              
              if (!result.canceled && result.filePaths.length > 0) {
                const filePath = result.filePaths[0]
                const content = await fs.readFile(filePath, 'utf-8')
                const parsed = JSON.parse(content)
                
                // Если это новый формат .swot
                let project
                if (parsed.header && parsed.header.signature === 'SWOT') {
                  project = parsed.project
                } else {
                  // Старый формат .json
                  project = parsed
                }
                
                // Отправляем проект в renderer
                focusedWindow.webContents.send('menu-open-project', project)
              }
            } catch (error) {
              console.error('Error opening project file:', error)
              dialog.showErrorBox('Ошибка', `Не удалось открыть файл: ${error.message}`)
            }
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-save-project')
            }
          },
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-save-project-as')
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize', label: 'Minimize' },
        { role: 'close', label: 'Close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About SWOT Analyzer',
          click: () => {
            // Можно добавить диалог "О программе"
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Обработка открытия файла через командную строку или двойной клик
app.on('open-file', async (event, filePath) => {
  event.preventDefault()
  
  if (mainWindowInstance) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      
      let project
      if (parsed.header && parsed.header.signature === 'SWOT') {
        project = parsed.project
      } else {
        project = parsed
      }
      
      mainWindowInstance.webContents.send('menu-open-project', project)
      mainWindowInstance.focus()
    } catch (error) {
      console.error('Error opening file:', error)
      if (mainWindowInstance) {
        dialog.showErrorBox('Ошибка', `Не удалось открыть файл: ${error.message}`)
      }
    }
  }
})

// IPC handlers для диалогов
ipcMain.handle('dialog:openProject', async () => {
  if (!mainWindowInstance) return null
  
  try {
    const result = await dialog.showOpenDialog(mainWindowInstance, {
      title: 'Открыть проект SWOT',
      filters: [
        { name: 'SWOT проекты', extensions: ['swot'] },
        { name: 'JSON файлы', extensions: ['json'] },
        { name: 'Все файлы', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    
    const filePath = result.filePaths[0]
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    
    // Если это новый формат .swot
    if (parsed.header && parsed.header.signature === 'SWOT') {
      return parsed.project
    }
    // Старый формат .json
    return parsed
  } catch (error) {
    console.error('Error opening project file:', error)
    throw error
  }
})

ipcMain.handle('dialog:saveProjectAs', async (event, project) => {
  if (!mainWindowInstance) return false
  
  try {
    const result = await dialog.showSaveDialog(mainWindowInstance, {
      title: 'Сохранить проект как',
      defaultPath: `${project.name || 'project'}.swot`,
      filters: [
        { name: 'SWOT проекты', extensions: ['swot'] },
        { name: 'JSON файлы', extensions: ['json'] },
        { name: 'Все файлы', extensions: ['*'] },
      ],
    })
    
    if (result.canceled || !result.filePath) {
      return false
    }
    
    const useSWOTFormat = result.filePath.endsWith('.swot')
    
    let content
    if (useSWOTFormat) {
      const swotFile = {
        header: {
          signature: 'SWOT',
          formatVersion: 1,
          appVersion: project.appVersion || '1.0.0',
        },
        project: project,
      }
      content = JSON.stringify(swotFile, null, 2)
    } else {
      content = JSON.stringify(project, null, 2)
    }
    
    await fs.writeFile(result.filePath, content, 'utf-8')
    return true
  } catch (error) {
    console.error('Error saving project file:', error)
    throw error
  }
})

ipcMain.handle('dialog:saveExportedFile', async (event, { defaultFileName, filters, buffer, mimeType }) => {
  if (!mainWindowInstance) return false
  
  try {
    const result = await dialog.showSaveDialog(mainWindowInstance, {
      title: 'Сохранить отчёт',
      defaultPath: defaultFileName,
      filters: filters,
    })
    
    if (result.canceled || !result.filePath) {
      return false
    }
    
    // Конвертируем base64 обратно в Buffer
    const fileBuffer = Buffer.from(buffer, 'base64')
    await fs.writeFile(result.filePath, fileBuffer)
    return true
  } catch (error) {
    console.error('Error saving exported file:', error)
    throw error
  }
})

app.whenReady().then(() => {
  createMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
