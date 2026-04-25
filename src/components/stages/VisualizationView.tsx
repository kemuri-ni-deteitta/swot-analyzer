import { useMemo } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { calculationService } from '../../services/calculationService'
import { SWOTMatrix } from '../widgets/SWOTMatrix'
import { ScoreMatrix } from '../widgets/ScoreMatrix'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getFactorTypeLabel } from '../../utils/factorTypes'
import './VisualizationView.css'

export default function VisualizationView() {
  const { currentCalculation } = useProjectStore()

  const factors = currentCalculation?.factors ?? []
  const interactions = currentCalculation?.interactions ?? []
  const profile = currentCalculation?.formulaProfileSnapshot

  const isSeminarMode = profile
    ? profile.mode === 'seminar' || (profile.mode === 'custom' && !!profile.interactionExpression)
    : false

  const interactionTotals = useMemo(() => {
    if (!profile || !isSeminarMode) return null
    return calculationService.calculateInteractionTotals(factors, interactions)
  }, [factors, interactions, profile, isSeminarMode])

  const quadrantTotals = useMemo(() => {
    return calculationService.calculateQuadrantTotals(factors)
  }, [factors])

  const categorySummary = useMemo(() => {
    return calculationService.calculateCategorySummary(factors)
  }, [factors])

  const topFactors = useMemo(() => {
    return calculationService.getTopFactors(factors, 10)
  }, [factors])

  const sFactors = useMemo(() => factors.filter(f => f.type === 'S'), [factors])
  const wFactors = useMemo(() => factors.filter(f => f.type === 'W'), [factors])
  const oFactors = useMemo(() => factors.filter(f => f.type === 'O'), [factors])
  const tFactors = useMemo(() => factors.filter(f => f.type === 'T'), [factors])

  const quadrantChartData = useMemo(() => {
    if (isSeminarMode && interactionTotals) {
      return [
        { name: 'SO', 'Сумма взаимодействий': interactionTotals.SO },
        { name: 'WT', 'Сумма взаимодействий': interactionTotals.WT },
      ]
    }
    return [
      { name: 'S', 'Общая оценка': quadrantTotals.S },
      { name: 'W', 'Общая оценка': quadrantTotals.W },
      { name: 'O', 'Общая оценка': quadrantTotals.O },
      { name: 'T', 'Общая оценка': quadrantTotals.T },
    ]
  }, [isSeminarMode, interactionTotals, quadrantTotals])

  const categoryChartData = useMemo(() => {
    return categorySummary.map(item => ({
      category: item.category,
      'Общая оценка': item.totalScore,
    }))
  }, [categorySummary])

  if (!currentCalculation) {
    return (
      <div className="visualization-view">
        <h2>Визуализация</h2>
        <p>Выберите расчёт на этапе «Расчёты».</p>
      </div>
    )
  }

  if (factors.length === 0) {
    return (
      <div className="visualization-view">
        <h2>Визуализация</h2>
        <div className="empty-state">
          <p>Нет факторов. Вернитесь на этап «Ввод факторов».</p>
        </div>
      </div>
    )
  }

  const barKey = isSeminarMode ? 'Сумма взаимодействий' : 'Общая оценка'

  return (
    <div className="visualization-view">
      <h2>Визуализация — {currentCalculation.name}</h2>

      <SWOTMatrix factors={factors} interactions={interactions} isSeminarMode={isSeminarMode} />

      <div className="score-matrices-section">
        <h3>Матрицы оценок по факторам SWOT-анализа</h3>

        {sFactors.length > 0 && oFactors.length > 0 ? (
          <ScoreMatrix
            internalFactors={sFactors}
            externalFactors={oFactors}
            internalPrefix="S"
            externalPrefix="O"
            title="Матрица оценок по факторам SWOT-анализа: S → O"
            heatColor="22, 163, 74"
          />
        ) : (
          <p className="matrix-unavailable">Недостаточно данных для построения матрицы S → O</p>
        )}

        {wFactors.length > 0 && tFactors.length > 0 ? (
          <ScoreMatrix
            internalFactors={wFactors}
            externalFactors={tFactors}
            internalPrefix="W"
            externalPrefix="T"
            title="Матрица оценок по факторам SWOT-анализа: W → T"
            heatColor="220, 38, 38"
          />
        ) : (
          <p className="matrix-unavailable">Недостаточно данных для построения матрицы W → T</p>
        )}
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>{isSeminarMode ? 'Суммы взаимодействий по квадрантам' : 'Суммы по квадрантам'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quadrantChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={barKey} fill="var(--accent-color)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Оценка по категориям</h3>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={categoryChartData} margin={{ bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-35} textAnchor="end" height={90} interval={0} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Общая оценка" fill="var(--accent-color)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-chart">Нет данных по категориям</p>
          )}
        </div>
      </div>

      <div className="top-factors-section">
        <h3>Топ-10 факторов по оценке</h3>
        {topFactors.length > 0 ? (
          <table className="top-factors-table">
            <thead>
              <tr>
                <th>Ранг</th>
                <th>Тип</th>
                <th>Текст</th>
                <th>Категория</th>
                <th>Оценка</th>
              </tr>
            </thead>
            <tbody>
              {topFactors.map((factor, index) => (
                <tr key={factor.id}>
                  <td className="rank">#{index + 1}</td>
                  <td className="type">{getFactorTypeLabel(factor.type)}</td>
                  <td className="text">{factor.text}</td>
                  <td className="category">{factor.category}</td>
                  <td className="score"><strong>{factor.score?.toFixed(2)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-message">Нет факторов для отображения</p>
        )}
      </div>
    </div>
  )
}
