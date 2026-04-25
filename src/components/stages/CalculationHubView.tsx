import { useState } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { Calculation } from '../../types'
import { BUILT_IN_FORMULA_PROFILES, getAllProfiles } from '../../services/formulaProfiles'
import './CalculationHubView.css'

export default function CalculationHubView() {
  const {
    currentProject,
    currentCalculation,
    switchCalculation,
    createCalculation,
    deleteCalculation,
    setCurrentStage,
    setShowFormulaEditor,
  } = useProjectStore()

  const [selectedFormulaId, setSelectedFormulaId] = useState(
    BUILT_IN_FORMULA_PROFILES[0].id
  )
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  if (!currentProject) {
    return (
      <div className="calc-hub">
        <h2>Расчёты</h2>
        <p>Выберите проект на этапе «Проекты».</p>
      </div>
    )
  }

  const allProfiles = getAllProfiles(currentProject.formulaProfiles)
  const calculations = [...currentProject.calculations].sort((a, b) => a.version - b.version)

  const handleOpen = (calc: Calculation) => {
    switchCalculation(calc.id)
    setCurrentStage(2)
  }

  const handleCreate = () => {
    createCalculation(selectedFormulaId)
    setCurrentStage(2)
  }

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString('ru-RU', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return s }
  }

  return (
    <div className="calc-hub">
      <div className="calc-hub-header">
        <div>
          <h2>Расчёты проекта: {currentProject.name}</h2>
          <p className="calc-hub-hint">
            Каждый расчёт содержит свои факторы, матрицу взаимодействий и стратегии.
            При смене формулы создаётся новая версия расчёта.
          </p>
        </div>
        <button className="ghost-btn" onClick={() => setShowFormulaEditor(true)}>
          Редактировать формулы
        </button>
      </div>

      <div className="calc-hub-create">
        <h3>Добавить расчёт</h3>
        <div className="calc-create-row">
          <label>
            Профиль формулы
            <select
              value={selectedFormulaId}
              onChange={e => setSelectedFormulaId(e.target.value)}
            >
              {allProfiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-btn" onClick={handleCreate}>
            + Добавить расчёт
          </button>
        </div>
      </div>

      {calculations.length === 0 ? (
        <div className="calc-hub-empty">
          <p>Нет ни одного расчёта. Создайте первый расчёт выше.</p>
        </div>
      ) : (
        <div className="calc-list">
          {calculations.map(calc => {
            const isActive = calc.id === currentCalculation?.id
            const profile =
              allProfiles.find(p => p.id === calc.formulaProfileId) ||
              calc.formulaProfileSnapshot
            return (
              <div
                key={calc.id}
                className={`calc-card ${isActive ? 'active' : ''}`}
                onClick={() => handleOpen(calc)}
              >
                <div className="calc-card-header">
                  <span className="calc-name">{calc.name}</span>
                  {isActive && <span className="calc-badge">Активный</span>}
                </div>
                <div className="calc-meta">
                  <span className="calc-formula">
                    Формула: <strong>{profile.name}</strong>
                  </span>
                </div>
                <div className="calc-stats">
                  <span>Факторов: {calc.factors.length}</span>
                  <span>Стратегий: {calc.strategies.length}</span>
                  <span>Взаимодействий: {calc.interactions.filter(i => (i.score ?? 0) > 0).length}</span>
                </div>
                <div className="calc-dates">
                  <span>Создан: {formatDate(calc.createdAt)}</span>
                  <span>Обновлён: {formatDate(calc.updatedAt)}</span>
                </div>
                <div className="calc-card-actions">
                  <button
                    className="primary-btn"
                    onClick={e => { e.stopPropagation(); handleOpen(calc) }}
                  >
                    Открыть
                  </button>
                  <button
                    className="ghost-btn danger-btn"
                    onClick={e => { e.stopPropagation(); setConfirmDeleteId(calc.id) }}
                  >
                    Удалить расчёт
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmDeleteId && (
        <div className="calc-confirm-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="calc-confirm-box" onClick={e => e.stopPropagation()}>
            <p>Вы точно хотите удалить этот расчёт?</p>
            <div className="calc-confirm-actions">
              <button
                className="ghost-btn danger-btn"
                onClick={() => { deleteCalculation(confirmDeleteId); setConfirmDeleteId(null) }}
              >
                Удалить
              </button>
              <button className="ghost-btn" onClick={() => setConfirmDeleteId(null)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
