import { useMemo } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { calculationService } from '../../services/calculationService'
import { SWOTMatrix } from '../widgets/SWOTMatrix'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getFactorTypeLabel } from '../../utils/factorTypes'
import './VisualizationView.css'

export default function VisualizationView() {
  const { currentProject } = useProjectStore()
  const factors = currentProject?.factors ?? []

  const categorySummary = useMemo(() => {
    return calculationService.calculateCategorySummary(factors)
  }, [factors])

  const quadrantTotals = useMemo(() => {
    return calculationService.calculateQuadrantTotals(factors)
  }, [factors])

  const topFactors = useMemo(() => {
    return calculationService.getTopFactors(factors, 10)
  }, [factors])

  // Данные для графика по категориям
  const chartData = useMemo(() => {
    return categorySummary.map(item => ({
      category: item.category,
      'Общая оценка': item.totalScore,
      'Количество факторов': item.factorCount,
    }))
  }, [categorySummary])

  // Данные для графика по квадрантам
  const quadrantChartData = useMemo(() => {
    return [
      { name: 'S', 'Общая оценка': quadrantTotals.S },
      { name: 'W', 'Общая оценка': quadrantTotals.W },
      { name: 'O', 'Общая оценка': quadrantTotals.O },
      { name: 'T', 'Общая оценка': quadrantTotals.T },
    ]
  }, [quadrantTotals])

  if (!currentProject) {
    return (
      <div className="visualization-view">
        <h2>Визуализация</h2>
        <p>Выберите или создайте проект на этапе 0 (Project Hub).</p>
      </div>
    )
  }

  if (factors.length === 0) {
    return (
      <div className="visualization-view">
        <h2>Визуализация</h2>
        <div className="empty-state">
          <p>Нет факторов для визуализации.</p>
          <p>Вернитесь на этап 1 и добавьте факторы.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="visualization-view">
      <h2>Визуализация SWOT-анализа</h2>

      {/* SWOT Матрица */}
      <SWOTMatrix factors={factors} />

      {/* Графики */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Суммы по квадрантам</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quadrantChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={0} 
                textAnchor="middle" 
                height={60}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Общая оценка" fill="var(--accent-color)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Оценка по категориям</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={chartData} margin={{ bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  angle={-35}
                  textAnchor="end"
                  height={90}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
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

      {/* Топ факторов */}
      <div className="top-factors-section">
        <h3>Топ-10 факторов по оценке</h3>
        <div className="top-factors-list">
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
                    <td className="score">
                      <strong>{factor.score?.toFixed(1)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-message">Нет факторов для отображения</p>
          )}
        </div>
      </div>
    </div>
  )
}
