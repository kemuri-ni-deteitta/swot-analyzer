import { useState, useEffect } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { useTheme } from '../contexts/ThemeContext'
import { storageService } from '../services/storageService'
import ProjectHubView from './stages/ProjectHubView'
import FactorsInputView from './stages/FactorsInputView'
import CalculationView from './stages/CalculationView'
import VisualizationView from './stages/VisualizationView'
import StrategiesView from './stages/StrategiesView'
import SummaryView from './stages/SummaryView'
import './MainWindow.css'

const STAGES = [
  { id: 0, component: ProjectHubView, title: 'Проекты' },
  { id: 1, component: FactorsInputView, title: 'Ввод факторов' },
  { id: 2, component: CalculationView, title: 'Расчёт и проверка' },
  { id: 3, component: VisualizationView, title: 'Визуализация' },
  { id: 4, component: StrategiesView, title: 'Стратегии' },
  { id: 5, component: SummaryView, title: 'Итог' },
]

export default function MainWindow() {
  const { currentStage, nextStage, prevStage, currentProject, setCurrentStage, setCurrentProject } = useProjectStore()
  const { theme, toggleTheme } = useTheme()
  const StageComponent = STAGES[currentStage].component
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Обработчик сохранения проекта
  const handleSaveProject = async () => {
    if (!currentProject) {
      setSaveMessage('Нет открытого проекта для сохранения')
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    setSaving(true)
    setSaveMessage(null)

    try {
      const saved = await storageService.saveProject(currentProject)
      if (saved) {
        setLastSaved(new Date())
        setSaveMessage('✓ Проект сохранён')
        setTimeout(() => {
          setSaveMessage(null)
          setSaving(false)
        }, 2000)
      } else {
        setSaveMessage('✗ Ошибка сохранения')
        setSaving(false)
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      console.error('Error saving project:', error)
      setSaveMessage('✗ Ошибка сохранения')
      setSaving(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  // Подписываемся на события меню Electron
  useEffect(() => {
    const handleMenuSave = () => {
      handleSaveProject()
    }

    const handleMenuNew = () => {
      // Переходим на этап 0 для создания нового проекта
      setCurrentStage(0)
    }

    const handleMenuOpen = (event: CustomEvent) => {
      const project = event.detail
      if (project) {
        setCurrentProject(project)
        setCurrentStage(1)
      }
    }

    const handleMenuSaveAs = async () => {
      if (!currentProject) {
        setSaveMessage('Нет активного проекта для сохранения.')
        setTimeout(() => setSaveMessage(null), 3000)
        return
      }
      
      setSaving(true)
      setSaveMessage('💾 Сохранение...')
      try {
        const saved = await storageService.saveProjectAs(currentProject)
        if (saved) {
          setSaveMessage('✓ Проект сохранён')
          setSaving(false)
          setTimeout(() => setSaveMessage(null), 3000)
        } else {
          setSaveMessage('')
          setSaving(false)
        }
      } catch (error) {
        console.error('Error saving project as:', error)
        setSaveMessage('✗ Ошибка сохранения')
        setSaving(false)
        setTimeout(() => setSaveMessage(null), 3000)
      }
    }

    window.addEventListener('electron-menu-save', handleMenuSave)
    window.addEventListener('electron-menu-new', handleMenuNew)
    window.addEventListener('electron-menu-open', handleMenuOpen as EventListener)
    window.addEventListener('electron-menu-save-as', handleMenuSaveAs)

    return () => {
      window.removeEventListener('electron-menu-save', handleMenuSave)
      window.removeEventListener('electron-menu-new', handleMenuNew)
      window.removeEventListener('electron-menu-open', handleMenuOpen as EventListener)
      window.removeEventListener('electron-menu-save-as', handleMenuSaveAs)
    }
  }, [currentProject, currentStage, setCurrentProject, setCurrentStage])

  // Отслеживаем изменения проекта для показа статуса сохранения
  useEffect(() => {
    if (!currentProject) {
      setLastSaved(null)
      return
    }

    // Показываем индикатор сохранения при изменении проекта
    const timeout = setTimeout(() => {
      setSaving(false)
      if (lastSaved) {
        setLastSaved(new Date())
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [currentProject?.updatedAt])

  return (
    <div className="main-window">
      {/* Верхняя панель */}
      <div className="top-bar">
        <div className="top-bar-left">
          <h1 className="app-title">SWOT Analyzer</h1>
          {currentProject && (
            <>
              <span className="project-name">
                {currentProject.name}
              </span>
              {saveMessage ? (
                <span className={`save-status ${saveMessage.startsWith('✓') ? 'success' : 'error'}`}>
                  {saveMessage}
                </span>
              ) : lastSaved ? (
                <span className="save-status" title={`Сохранено: ${lastSaved.toLocaleTimeString()}`}>
                  {saving ? '💾 Сохранение...' : '✓ Сохранено'}
                </span>
              ) : null}
            </>
          )}
        </div>
        <div className="top-bar-right">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>

      {/* Центральная рабочая область */}
      <div className="workspace">
        <StageComponent />
      </div>

      {/* Нижняя панель навигации */}
      <div className="bottom-bar">
        <button
          className="nav-button"
          onClick={prevStage}
          disabled={currentStage === 0}
        >
          ← Назад
        </button>
        <div className="stage-indicator">
          Этап {currentStage + 1} из {STAGES.length}: {STAGES[currentStage].title}
        </div>
        {currentStage < STAGES.length - 1 && (
          <button
            className="nav-button"
            onClick={nextStage}
          >
            Далее →
          </button>
        )}
        {currentStage === STAGES.length - 1 && (
          <div style={{ width: '120px' }}></div>
        )}
      </div>
    </div>
  )
}
