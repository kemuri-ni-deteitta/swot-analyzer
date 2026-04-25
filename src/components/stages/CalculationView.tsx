import { useMemo } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { calculationService } from '../../services/calculationService'
import { getAllProfiles } from '../../services/formulaProfiles'
import './CalculationView.css'

export default function CalculationView() {
  const { currentProject, currentCalculation } = useProjectStore()

  if (!currentProject || !currentCalculation) {
    return (
      <div className="calculation-view">
        <h2>Взаимодействия</h2>
        <p>Выберите расчёт на этапе «Расчёты».</p>
      </div>
    )
  }

  const { factors, interactions, formulaProfileSnapshot: snapshot } = currentCalculation
  const allProfiles = getAllProfiles(currentProject.formulaProfiles ?? [])
  const profile = allProfiles.find(p => p.id === currentCalculation.formulaProfileId) ?? snapshot
  const isSeminarMode = profile.mode === 'seminar' ||
    (profile.mode === 'custom' && !!profile.interactionExpression)

  const interactionTotals = useMemo(() => {
    return calculationService.calculateInteractionTotals(factors, interactions)
  }, [factors, interactions])

  const quadrantTotals = useMemo(() => {
    return calculationService.calculateQuadrantTotals(factors)
  }, [factors])

  const QUADRANT_META = {
    S: { name: 'Сильные стороны' },
    W: { name: 'Слабые стороны' },
    O: { name: 'Возможности' },
    T: { name: 'Угрозы' },
  } as const

  return (
    <div className="calculation-view">
      <h2>Взаимодействия — {currentCalculation.name}</h2>
      <p className="calc-formula-label">
        Формула: <strong>{profile.name}</strong>
      </p>

      <div className="quadrant-cards">
        {(['S', 'W', 'O', 'T'] as const).map(t => (
          <div key={t} className={`quadrant-stat-card quadrant-stat-card--${t.toLowerCase()}`}>
            <div className="qsc-header">
              <span className="qsc-badge">{t}</span>
              <span className="qsc-name">{QUADRANT_META[t].name}</span>
            </div>
            <div className="qsc-row">
              <span className="qsc-row-label">Количество:</span>
              <span className="qsc-row-value">{factors.filter(f => f.type === t).length}</span>
            </div>
            {!isSeminarMode && (
              <div className="qsc-row">
                <span className="qsc-row-label">Сумма:</span>
                <span className="qsc-row-value qsc-row-value--sum">{quadrantTotals[t].toFixed(1)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {factors.length > 0 && (
        <div className="quadrant-bar-chart">
          {(() => {
            const entries = (['S', 'W', 'O', 'T'] as const).map(t => ({
              t,
              value: isSeminarMode
                ? factors.filter(f => f.type === t).length
                : quadrantTotals[t],
            }))
            const max = Math.max(...entries.map(e => e.value), 1)
            return entries.map(({ t, value }) => (
              <div key={t} className="qbc-row">
                <span className="qbc-label">{t}</span>
                <div className="qbc-track">
                  <div
                    className={`qbc-bar qbc-bar--${t.toLowerCase()}`}
                    style={{ width: `${(value / max) * 100}%` }}
                  />
                </div>
                <span className="qbc-value">
                  {isSeminarMode ? value : value.toFixed(1)}
                </span>
              </div>
            ))
          })()}
        </div>
      )}

      {isSeminarMode && (
        <div className="summary-card">
          <h3>Суммы взаимодействий</h3>
          <div className="interaction-totals">
            {(['SO', 'WT'] as const).map(q => (
              <div key={q} className="interaction-total-item">
                <span className="quadrant-label">{q}</span>
                <span className="quadrant-value">{interactionTotals[q].toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isSeminarMode && (
        <div className="simplified-notice">
          <p>
            В расширенном режиме оценки рассчитываются индивидуально для каждого фактора.
            Матрица взаимодействий не используется.
          </p>
          {factors.length > 0 && (
            <div className="success-message">
              ✅ Оценки рассчитаны. Можно переходить к визуализации.
            </div>
          )}
        </div>
      )}

      {factors.length === 0 && (
        <div className="empty-message">
          <p>Нет факторов. Вернитесь на этап «Ввод факторов».</p>
        </div>
      )}
    </div>
  )
}
