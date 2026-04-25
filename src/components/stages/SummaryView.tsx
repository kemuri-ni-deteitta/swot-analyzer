import { useMemo, useState } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { calculationService } from '../../services/calculationService'
import { getFactorTypeLabel } from '../../utils/factorTypes'
import { SWOTMatrix } from '../widgets/SWOTMatrix'
import { exportService } from '../../services/exportService'
import './SummaryView.css'

export default function SummaryView() {
  const { currentProject, currentCalculation } = useProjectStore()
  const [exporting, setExporting] = useState<'pdf' | 'word' | null>(null)

  const factors = currentCalculation?.factors ?? []
  const interactions = currentCalculation?.interactions ?? []
  const strategies = currentCalculation?.strategies ?? []
  const profile = currentCalculation?.formulaProfileSnapshot

  const isSeminarMode = profile
    ? profile.mode === 'seminar' || (profile.mode === 'custom' && !!profile.interactionExpression)
    : false

  const quadrantTotals = useMemo(() => calculationService.calculateQuadrantTotals(factors), [factors])
  const interactionTotals = useMemo(
    () => isSeminarMode ? calculationService.calculateInteractionTotals(factors, interactions) : null,
    [factors, interactions, isSeminarMode]
  )
  const categorySummary = useMemo(() => calculationService.calculateCategorySummary(factors), [factors])
  const topFactors = useMemo(() => calculationService.getTopFactors(factors, 10), [factors])

  const groupedStrategies = useMemo(() => ({
    SO: strategies.filter(s => s.type === 'SO'),
    WO: strategies.filter(s => s.type === 'WO'),
    ST: strategies.filter(s => s.type === 'ST'),
    WT: strategies.filter(s => s.type === 'WT'),
  }), [strategies])

  const factorTypeCounts = useMemo(() => ({
    S: factors.filter(f => f.type === 'S').length,
    W: factors.filter(f => f.type === 'W').length,
    O: factors.filter(f => f.type === 'O').length,
    T: factors.filter(f => f.type === 'T').length,
  }), [factors])

  if (!currentProject || !currentCalculation) {
    return (
      <div className="summary-view">
        <h2>Итог</h2>
        <p>Выберите расчёт на этапе «Расчёты».</p>
      </div>
    )
  }

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleDateString('ru-RU', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return s }
  }

  const handleExportPDF = async () => {
    if (!window.electronAPI) return
    setExporting('pdf')
    try {
      const blob = await exportService.exportToPDF(currentProject, currentCalculation)
      const fileName = `${currentProject.name}-${currentCalculation.name}-${new Date().toISOString().split('T')[0]}.pdf`
      const saved = await window.electronAPI.saveExportedFile(blob, fileName, [
        { name: 'PDF файлы', extensions: ['pdf'] },
        { name: 'Все файлы', extensions: ['*'] },
      ])
      if (saved) alert('Отчёт успешно экспортирован в PDF!')
    } catch (error) {
      alert('Ошибка при экспорте в PDF: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
    } finally {
      setExporting(null)
    }
  }

  const handleExportWord = async () => {
    if (!window.electronAPI) return
    setExporting('word')
    try {
      const blob = await exportService.exportToWord(currentProject, currentCalculation)
      const fileName = `${currentProject.name}-${currentCalculation.name}-${new Date().toISOString().split('T')[0]}.docx`
      const saved = await window.electronAPI.saveExportedFile(blob, fileName, [
        { name: 'Word документы', extensions: ['docx'] },
        { name: 'Все файлы', extensions: ['*'] },
      ])
      if (saved) alert('Отчёт успешно экспортирован в Word!')
    } catch (error) {
      alert('Ошибка при экспорте в Word: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="summary-view">
      <div className="summary-header">
        <h2>Итоговый отчёт</h2>
        <div className="export-buttons">
          <button className="export-btn export-pdf" onClick={handleExportPDF} disabled={exporting !== null}>
            {exporting === 'pdf' ? '⏳ Экспорт...' : '📄 Экспорт в PDF'}
          </button>
          <button className="export-btn export-word" onClick={handleExportWord} disabled={exporting !== null}>
            {exporting === 'word' ? '⏳ Экспорт...' : '📝 Экспорт в Word'}
          </button>
        </div>
      </div>

      <div className="summary-section">
        <h3>Информация о проекте и расчёте</h3>
        <div className="project-info">
          <div className="info-item"><span className="info-label">Проект:</span><span className="info-value">{currentProject.name}</span></div>
          {currentProject.description && (
            <div className="info-item"><span className="info-label">Описание:</span><span className="info-value">{currentProject.description}</span></div>
          )}
          <div className="info-item"><span className="info-label">Расчёт:</span><span className="info-value">{currentCalculation.name}</span></div>
          <div className="info-item"><span className="info-label">Активная формула:</span><span className="info-value">{profile?.name}</span></div>
          <div className="info-item"><span className="info-label">Создан:</span><span className="info-value">{formatDate(currentProject.createdAt)}</span></div>
          <div className="info-item"><span className="info-label">Обновлён:</span><span className="info-value">{formatDate(currentCalculation.updatedAt)}</span></div>
        </div>
      </div>

      <div className="summary-section">
        <h3>Статистика</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <div className="card-label">Факторов</div>
              <div className="card-value">{factors.length}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">🔗</div>
            <div className="card-content">
              <div className="card-label">Взаимодействий</div>
              <div className="card-value">{interactions.filter(i => (i.score ?? 0) > 0).length}</div>
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

      <div className="summary-section">
        <h3>Распределение факторов</h3>
        <div className="factor-types-summary">
          {(['S', 'W', 'O', 'T'] as const).map(t => (
            <div key={t} className="factor-type-summary-item">
              <span className={`type-badge type-${t.toLowerCase()}`}>{t}</span>
              <span className="type-name">
                {t === 'S' ? 'Сильные стороны' : t === 'W' ? 'Слабые стороны' : t === 'O' ? 'Возможности' : 'Угрозы'}
              </span>
              <span className="type-count">{factorTypeCounts[t]}</span>
              <span className="type-total">({quadrantTotals[t].toFixed(1)})</span>
            </div>
          ))}
        </div>
        {isSeminarMode && interactionTotals && (
          <div className="interaction-summary">
            <h4>Суммы взаимодействий</h4>
            <div className="interaction-sums">
              {(['SO', 'WT'] as const).map(q => (
                <div key={q} className="interaction-sum-item">
                  <span className="sum-label">{q}</span>
                  <span className="sum-value">{interactionTotals[q].toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {factors.length > 0 && (
        <div className="summary-section">
          <h3>SWOT матрица</h3>
          <SWOTMatrix factors={factors} interactions={interactions} isSeminarMode={isSeminarMode} />
        </div>
      )}

      {categorySummary.length > 0 && (
        <div className="summary-section">
          <h3>Топ категории по оценке</h3>
          <div className="category-list">
            {categorySummary.slice(0, 5).map((item, index) => (
              <div key={item.category} className="category-item">
                <span className="category-rank">#{index + 1}</span>
                <span className="category-name">{item.category}</span>
                <span className="category-score">{item.totalScore.toFixed(2)}</span>
                <span className="category-count">({item.factorCount} факт.)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {strategies.length > 0 && (
        <div className="summary-section">
          <h3>Стратегии</h3>
          <div className="strategies-summary-grid">
            {(['SO', 'WO', 'ST', 'WT'] as const).map(t => {
              const labels: Record<string, string> = { SO: 'Агрессивные', WO: 'Оборонительные', ST: 'Защитные', WT: 'Минимизация' }
              return (
                <div key={t} className="strategy-summary-card">
                  <div className={`strategy-summary-type ${t.toLowerCase()}`}>{t}</div>
                  <div className="strategy-summary-count">{groupedStrategies[t].length}</div>
                  <div className="strategy-summary-label">{labels[t]}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {topFactors.length > 0 && (
        <div className="summary-section">
          <h3>Топ-10 факторов</h3>
          <div className="top-factors-list">
            {topFactors.map((factor, index) => (
              <div key={factor.id} className="top-factor-item">
                <span className="factor-rank">#{index + 1}</span>
                <span className="factor-type-badge">{getFactorTypeLabel(factor.type)}</span>
                <span className="factor-text">{factor.text}</span>
                <span className="factor-category">{factor.category}</span>
                <span className="factor-score-value">{factor.score?.toFixed(2) ?? '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="summary-section">
        <h3>Рекомендации</h3>
        <div className="recommendations">
          {strategies.length === 0 && factors.length >= 5 && (
            <div className="recommendation-item info">
              <span className="rec-icon">💡</span>
              <div className="rec-content">
                <strong>Сгенерируйте стратегии</strong>
                <p>Перейдите на этап «Стратегии» для генерации.</p>
              </div>
            </div>
          )}
          {groupedStrategies.SO.length > 0 && (
            <div className="recommendation-item success">
              <span className="rec-icon">✅</span>
              <div className="rec-content">
                <strong>Приоритет: SO стратегии</strong>
                <p>{groupedStrategies.SO.length} агрессивная(ых) стратегия(ий) — лучшие возможности для роста.</p>
              </div>
            </div>
          )}
          {groupedStrategies.WT.length > 0 && (
            <div className="recommendation-item warning">
              <span className="rec-icon">⚠️</span>
              <div className="rec-content">
                <strong>Внимание: WT стратегии</strong>
                <p>{groupedStrategies.WT.length} стратегия(ий) минимизации рисков.</p>
              </div>
            </div>
          )}
          {factors.length === 0 && (
            <div className="recommendation-item info">
              <span className="rec-icon">📝</span>
              <div className="rec-content">
                <strong>Добавьте факторы</strong>
                <p>Начните анализ с добавления факторов на этапе «Ввод факторов».</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
