const fs = require('fs').promises
const path = require('path')
const os = require('os')

function projectsPath() {
  // Сохраняем проекты в домашней директории пользователя
  // Linux/Mac: ~/SWOTProjects/
  // Windows: %USERPROFILE%\SWOTProjects\
  const homeDir = os.homedir()
  const projectsDir = path.join(homeDir, 'SWOTProjects')
  console.log('[fileService] Projects directory:', projectsDir)
  return projectsDir
}

async function ensureProjectsDir() {
  const dir = projectsPath()
  await fs.mkdir(dir, { recursive: true })
  return dir
}

async function listProjects() {
  const dir = await ensureProjectsDir()
  const files = await fs.readdir(dir)
  // Поддерживаем оба формата: .swot (новый) и .json (старый, для совместимости)
  return files.filter(f => f.endsWith('.swot') || f.endsWith('.json'))
}

async function loadProject(projectId) {
  const dir = await ensureProjectsDir()
  // Пробуем сначала .swot, потом .json (для совместимости)
  let filePath = path.join(dir, `${projectId}.swot`)
  let exists = false
  try {
    await fs.access(filePath)
    exists = true
  } catch {
    filePath = path.join(dir, `${projectId}.json`)
    try {
      await fs.access(filePath)
      exists = true
    } catch {
      throw new Error(`Project file not found: ${projectId}`)
    }
  }
  
  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

async function saveProject(project, useSWOTFormat = true) {
  try {
    const dir = await ensureProjectsDir()
    const extension = useSWOTFormat ? '.swot' : '.json'
    const filePath = path.join(dir, `${project.id}${extension}`)
    
    // Если сохраняем в .swot, используем специальный формат
    let content
    if (useSWOTFormat) {
      // Формат SWOT файла с заголовком
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
      // Старый формат JSON (для совместимости)
      content = JSON.stringify(project, null, 2)
    }
    
    await fs.writeFile(filePath, content, 'utf-8')
    console.log('Project saved:', filePath)
    
    // Удаляем старый .json файл, если он существует (миграция)
    if (useSWOTFormat) {
      const oldJsonPath = path.join(dir, `${project.id}.json`)
      try {
        await fs.unlink(oldJsonPath)
        console.log('Removed old .json file:', oldJsonPath)
      } catch {
        // Игнорируем, если файла нет
      }
    }
    
    return true
  } catch (error) {
    console.error('Error saving project:', error)
    throw error
  }
}

async function deleteProject(projectId) {
  const dir = await ensureProjectsDir()
  // Удаляем оба формата (если существуют)
  const swotPath = path.join(dir, `${projectId}.swot`)
  const jsonPath = path.join(dir, `${projectId}.json`)
  
  try {
    await fs.unlink(swotPath)
  } catch {
    // Игнорируем, если файла нет
  }
  
  try {
    await fs.unlink(jsonPath)
  } catch {
    // Игнорируем, если файла нет
  }
  
  return true
}

async function getProjects() {
  try {
    const fileNames = await listProjects()
    const dir = await ensureProjectsDir()
    const projects = []
    console.log('Found project files:', fileNames)
    
    for (const file of fileNames) {
      try {
        const content = await fs.readFile(path.join(dir, file), 'utf-8')
        const parsed = JSON.parse(content)
        
        // Если это новый формат .swot с заголовком
        if (parsed.header && parsed.header.signature === 'SWOT') {
          projects.push(parsed.project)
        } else {
          // Старый формат .json (для совместимости)
          projects.push(parsed)
        }
      } catch (err) {
        console.error('Failed to load project', file, err)
      }
    }
    
    console.log('Loaded projects count:', projects.length)
    return projects
  } catch (error) {
    console.error('Error getting projects:', error)
    return []
  }
}

module.exports = {
  ensureProjectsDir,
  projectsPath,
  listProjects,
  loadProject,
  saveProject,
  deleteProject,
  getProjects,
}
