import { useMemo, useState } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { calculationService } from '../../services/calculationService'
import { getFactorTypeLabel } from '../../utils/factorTypes'
import { SWOTMatrix } from '../widgets/SWOTMatrix'
import { exportService } from '../../services/exportService'
import './SummaryView.css'

export default function SummaryView() {
  const { currentProject } = useProjectStore()
  const factors = currentProject?.factors ?? []
  const strategies = currentProject?.strategies ?? []
  const [exporting, setExporting] = useState<'pdf' | 'word' | null>(null)

  const quadrantTotals = useMemo(() => {
    return calculationService.calculateQuadrantTotals(factors)
  }, [factors])

  const categorySummary = useMemo(() => {
    return calculationService.calculateCategorySummary(factors)
  }, [factors])

  const topFactors = useMemo(() => {
    return calculationService.getTopFactors(factors, 10)
  }, [factors])

  const groupedStrategies = useMemo(() => {
    return {
      SO: strategies.filter(s => s.type === 'SO'),
      WO: strategies.filter(s => s.type === 'WO'),
      ST: strategies.filter(s => s.type === 'ST'),
      WT: strategies.filter(s => s.type === 'WT'),
    }
  }, [strategies])

  const factorTypeCounts = useMemo(() => {
    return {
      S: factors.filter(f => f.type === 'S').length,
      W: factors.filter(f => f.type === 'W').length,
      O: factors.filter(f => f.type === 'O').length,
      T: factors.filter(f => f.type === 'T').length,
    }
  }, [factors])

  if (!currentProject) {
    return (
      <div className="summary-view">
        <h2>Итог</h2>
        <p>Выберите или создайте проект на этапе 0 (Project Hub).</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const handleExportPDF = async () => {
    if (!currentProject || !window.electronAPI) return
    
    setExporting('pdf')
    try {
      const blob = await exportService.exportToPDF(currentProject)
      const fileName = `${currentProject.name || 'swot-report'}-${new Date().toISOString().split('T')[0]}.pdf`
      
      const saved = await window.electronAPI.saveExportedFile(
        blob,
        fileName,
        [
          { name: 'PDF файлы', extensions: ['pdf'] },
          { name: 'Все файлы', extensions: ['*'] },
        ]
      )
      
      if (saved) {
        alert('Отчёт успешно экспортирован в PDF!')
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      alert('Ошибка при экспорте в PDF: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
    } finally {
      setExporting(null)
    }
  }

  const handleExportWord = async () => {
    if (!currentProject || !window.electronAPI) return
    
    setExporting('word')
    try {
      const blob = await exportService.exportToWord(currentProject)
      const fileName = `${currentProject.name || 'swot-report'}-${new Date().toISOString().split('T')[0]}.docx`
      
      const saved = await window.electronAPI.saveExportedFile(
        blob,
        fileName,
        [
          { name: 'Word документы', extensions: ['docx'] },
          { name: 'Все файлы', extensions: ['*'] },
        ]
      )
      
      if (saved) {
        alert('Отчёт успешно экспортирован в Word!')
      }
    } catch (error) {
      console.error('Error exporting to Word:', error)
      alert('Ошибка при экспорте в Word: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="summary-view">
      <div className="summary-header">
        <h2>Итоговый отчёт</h2>
        {currentProject && (
          <div className="export-buttons">
            <button
              className="export-btn export-pdf"
              onClick={handleExportPDF}
              disabled={exporting !== null}
            >
              {exporting === 'pdf' ? '⏳ Экспорт...' : '📄 Экспорт в PDF'}
            </button>
            <button
              className="export-btn export-word"
              onClick={handleExportWord}
              disabled={exporting !== null}
            >
              {exporting === 'word' ? '⏳ Экспорт...' : '📝 Экспорт в Word'}
            </button>
          </div>
        )}
      </div>

      {/* Информация о проекте */}
      <div className="summary-section">
        <h3>Информация о проекте</h3>
        <div className="project-info">
          <div className="info-item">
            <span className="info-label">Название:</span>
            <span className="info-value">{currentProject.name}</span>
          </div>
          {currentProject.description && (
            <div className="info-item">
              <span className="info-label">Описание:</span>
              <span className="info-value">{currentProject.description}</span>
            </div>
          )}
          <div className="info-item">
            <span className="info-label">Создан:</span>
            <span className="info-value">{formatDate(currentProject.createdAt)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Обновлён:</span>
            <span className="info-value">{formatDate(currentProject.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="summary-section">
        <h3>Общая статистика</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <div className="card-label">Всего факторов</div>
              <div className="card-value">{factors.length}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">🎯</div>
            <div className="card-content">
              <div className="card-label">Стратегий</div>
              <div className="card-value">{strategies.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Распределение по типам */}
      <div className="summary-section">
        <h3>Распределение факторов по типам</h3>
        <div className="factor-types-summary">
          <div className="factor-type-summary-item">
            <span className="type-badge type-s">S</span>
            <span className="type-name">Сильные стороны</span>
            <span className="type-count">{factorTypeCounts.S}</span>
            <span className="type-total">({quadrantTotals.S.toFixed(1)})</span>
          </div>
          <div className="factor-type-summary-item">
            <span className="type-badge type-w">W</span>
            <span className="type-name">Слабые стороны</span>
            <span className="type-count">{factorTypeCounts.W}</span>
            <span className="type-total">({quadrantTotals.W.toFixed(1)})</span>
          </div>
          <div className="factor-type-summary-item">
            <span className="type-badge type-o">O</span>
            <span className="type-name">Возможности</span>
            <span className="type-count">{factorTypeCounts.O}</span>
            <span className="type-total">({quadrantTotals.O.toFixed(1)})</span>
          </div>
          <div className="factor-type-summary-item">
            <span className="type-badge type-t">T</span>
            <span className="type-name">Угрозы</span>
            <span className="type-count">{factorTypeCounts.T}</span>
            <span className="type-total">({quadrantTotals.T.toFixed(1)})</span>
          </div>
        </div>
      </div>

      {/* SWOT матрица */}
      {factors.length > 0 && (
        <div className="summary-section">
          <h3>SWOT матрица</h3>
          <div className="swot-matrix-container">
            <SWOTMatrix factors={factors} />
          </div>
        </div>
      )}

      {/* Топ категории */}
      {categorySummary.length > 0 && (
        <div className="summary-section">
          <h3>Топ категории по оценке</h3>
          <div className="category-list">
            {categorySummary.slice(0, 5).map((item, index) => (
              <div key={item.category} className="category-item">
                <span className="category-rank">#{index + 1}</span>
                <span className="category-name">{item.category}</span>
                <span className="category-score">{item.totalScore.toFixed(1)}</span>
                <span className="category-count">({item.factorCount} факт.)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Стратегии */}
      {strategies.length > 0 && (
        <div className="summary-section">
          <h3>Сгенерированные стратегии</h3>
          <div className="strategies-summary-grid">
            <div className="strategy-summary-card">
              <div className="strategy-summary-type so">SO</div>
              <div className="strategy-summary-count">{groupedStrategies.SO.length}</div>
              <div className="strategy-summary-label">Агрессивные</div>
            </div>
            <div className="strategy-summary-card">
              <div className="strategy-summary-type wo">WO</div>
              <div className="strategy-summary-count">{groupedStrategies.WO.length}</div>
              <div className="strategy-summary-label">Оборонительные</div>
            </div>
            <div className="strategy-summary-card">
              <div className="strategy-summary-type st">ST</div>
              <div className="strategy-summary-count">{groupedStrategies.ST.length}</div>
              <div className="strategy-summary-label">Защитные</div>
            </div>
            <div className="strategy-summary-card">
              <div className="strategy-summary-type wt">WT</div>
              <div className="strategy-summary-count">{groupedStrategies.WT.length}</div>
              <div className="strategy-summary-label">Минимизация</div>
            </div>
          </div>
        </div>
      )}

      {/* Топ факторы */}
      {topFactors.length > 0 && (
        <div className="summary-section">
          <h3>Топ-10 факторов по оценке</h3>
          <div className="top-factors-list">
            {topFactors.map((factor, index) => (
              <div key={factor.id} className="top-factor-item">
                <span className="factor-rank">#{index + 1}</span>
                <span className="factor-type-badge">{getFactorTypeLabel(factor.type)}</span>
                <span className="factor-text">{factor.text}</span>
                <span className="factor-category">{factor.category}</span>
                <span className="factor-score-value">{factor.score?.toFixed(1) ?? '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Рекомендации */}
      <div className="summary-section">
        <h3>Рекомендации</h3>
        <div className="recommendations">
          {strategies.length === 0 && factors.length >= 5 && (
            <div className="recommendation-item info">
              <span className="rec-icon">💡</span>
              <div className="rec-content">
                <strong>Сгенерируйте стратегии</strong>
                <p>У вас достаточно факторов для генерации стратегий. Перейдите на этап 4.</p>
              </div>
            </div>
          )}
          {groupedStrategies.SO.length > 0 && (
            <div className="recommendation-item success">
              <span className="rec-icon">✅</span>
              <div className="rec-content">
                <strong>Приоритет: SO стратегии</strong>
                <p>У вас есть {groupedStrategies.SO.length} агрессивная(ых) стратегия(ий) - это лучшие возможности для роста.</p>
              </div>
            </div>
          )}
          {groupedStrategies.WT.length > 0 && (
            <div className="recommendation-item warning">
              <span className="rec-icon">⚠️</span>
              <div className="rec-content">
                <strong>Внимание: WT стратегии</strong>
                <p>У вас есть {groupedStrategies.WT.length} стратегия(ий) минимизации рисков - требуют немедленного внимания.</p>
              </div>
            </div>
          )}
          {factors.length === 0 && (
            <div className="recommendation-item info">
              <span className="rec-icon">📝</span>
              <div className="rec-content">
                <strong>Добавьте факторы</strong>
                <p>Начните анализ с добавления факторов на этапе 1.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
