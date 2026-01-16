import { useEffect, useState } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { storageService } from '../../services/storageService'
import { Project } from '../../types'
import './ProjectHubView.css'

export default function ProjectHubView() {
  const { setCurrentProject, setCurrentStage } = useProjectStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [descriptionError, setDescriptionError] = useState(false)

  useEffect(() => {
    // Проверяем доступность API при монтировании
    console.log('ProjectHubView mounted')
    console.log('window.electronAPI available:', typeof window.electronAPI !== 'undefined')
    if (window.electronAPI) {
      console.log('electronAPI methods:', Object.keys(window.electronAPI))
    }
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      console.log('Loading projects...')
      if (!window.electronAPI) {
        console.warn('Electron API not available')
        setProjects([])
        setLoading(false)
        return
      }
      
      const loadedProjects = await storageService.loadProjects()
      console.log('Loaded projects:', loadedProjects)
      setProjects(loadedProjects)
    } catch (error) {
      console.error('Error loading projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Введите название проекта')
      return
    }

    if (!newProjectDescription.trim()) {
      setDescriptionError(true)
      setTimeout(() => setDescriptionError(false), 3000)
      return
    }

    try {
      console.log('Creating project:', newProjectName.trim())
      
      // Проверяем доступность Electron API
      if (!window.electronAPI) {
        console.error('Electron API not available!')
        alert('Ошибка: Electron API недоступен. Убедитесь, что приложение запущено через Electron.')
        return
      }

      const project = storageService.createProject(newProjectName.trim(), newProjectDescription.trim())
      console.log('Project created:', project)
      
      const saved = await storageService.saveProject(project)
      console.log('Save result:', saved)
      
      if (saved) {
        setNewProjectName('')
        setNewProjectDescription('')
        setDescriptionError(false)
        await loadProjects()
        await setCurrentProject(project)
        setCurrentStage(1)
      } else {
        alert('Не удалось сохранить проект. Проверьте консоль для деталей.')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
      alert(`Ошибка при создании проекта: ${message}`)
    }
  }

  const handleOpenProject = async (project: Project) => {
    await setCurrentProject(project)
    setCurrentStage(1)
  }

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Удалить проект?')) {
      await storageService.deleteProject(projectId)
      await loadProjects()
    }
  }

  return (
    <div className="project-hub">
      <h2>Проекты SWOT-анализа</h2>
      
      <div className="create-project">
        <div className="create-project-fields">
          <div className="field-group">
            <input
              type="text"
              placeholder="Название нового проекта"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              className="project-name-input"
            />
          </div>
          <div className="field-group">
            <textarea
              placeholder="Описание проекта"
              value={newProjectDescription}
              onChange={(e) => {
                setNewProjectDescription(e.target.value)
                if (e.target.value.trim()) {
                  setDescriptionError(false)
                }
              }}
              onBlur={() => {
                if (!newProjectDescription.trim()) {
                  setDescriptionError(true)
                }
              }}
              className={`project-description-input ${descriptionError ? 'error-input' : ''}`}
              rows={3}
            />
            {descriptionError && (
              <span className="error-message">⚠️ Необходимо ввести описание проекта</span>
            )}
          </div>
        </div>
        <button onClick={handleCreateProject} className="create-button">
          Создать проект
        </button>
      </div>

      {loading ? (
        <div className="loading">Загрузка проектов...</div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>Нет сохранённых проектов</p>
          <p className="hint">Создайте новый проект, чтобы начать SWOT-анализ</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project: Project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => handleOpenProject(project)}
            >
              <h3>{project.name}</h3>
              {project.description && <p>{project.description}</p>}
              <div className="project-meta">
                <span>Факторов: {project.factors.length}</span>
                <span>Стратегий: {project.strategies.length}</span>
              </div>
              <button
                className="delete-button"
                onClick={(e) => handleDeleteProject(project.id, e)}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
