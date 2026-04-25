import { useMemo, useState } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { getFactorTypeLabel } from '../../utils/factorTypes'
import { strategyService } from '../../services/strategyService'
import './StrategiesView.css'

export default function StrategiesView() {
  const { currentCalculation, generateStrategies } = useProjectStore()
  const [topCount, setTopCount] = useState(5)

  const factors = currentCalculation?.factors ?? []
  const interactions = currentCalculation?.interactions ?? []
  const strategies = currentCalculation?.strategies ?? []
  const profile = currentCalculation?.formulaProfileSnapshot

  const factorAnalysis = useMemo(() => {
    if (!profile || factors.length === 0) return null
    return strategyService.analyzeFactorAvailability(factors, interactions, profile, topCount)
  }, [factors, interactions, profile, topCount])

  const groupedStrategies = useMemo(() => ({
    SO: strategies.filter(s => s.type === 'SO'),
    WO: strategies.filter(s => s.type === 'WO'),
    ST: strategies.filter(s => s.type === 'ST'),
    WT: strategies.filter(s => s.type === 'WT'),
  }), [strategies])

  if (!currentCalculation) {
    return (
      <div className="strategies-view">
        <h2>Стратегии</h2>
        <p>Выберите расчёт на этапе «Расчёты».</p>
      </div>
    )
  }

  const isSeminar = factorAnalysis?.useSeminar ?? false

  return (
    <div className="strategies-view">
      <h2>Стратегии — {currentCalculation.name}</h2>

      <div className="strategies-controls">
        <div className="control-group">
          <label htmlFor="topCount">
            {isSeminar ? 'Топ взаимодействий для стратегий' : 'Топ факторов для стратегий'}
          </label>
          <select id="topCount" value={topCount} onChange={e => setTopCount(Number(e.target.value))}>
            <option value={5}>5 (стандартный)</option>
            <option value={7}>7 (детальный)</option>
            <option value={10}>10 (полный)</option>
          </select>
          {!isSeminar && (
            <p className="hint-small">
              💡 Оценка = значимость × влияние (для S/W) или × вероятность (для O/T)
            </p>
          )}
        </div>
        <button
          className="generate-button"
          onClick={() => generateStrategies(topCount)}
          disabled={factors.length === 0}
        >
          Сгенерировать стратегии
        </button>
      </div>

      {factors.length === 0 && (
        <div className="empty-message">
          <p>Нет факторов. Вернитесь на этап «Ввод факторов».</p>
        </div>
      )}

      {factorAnalysis && factors.length > 0 && (
        <div className="factor-analysis">
          <h3>Анализ доступных данных</h3>
          <div className="analysis-grid">
            <div className="analysis-item">
              <span className="analysis-label">Факторы (топ {topCount}):</span>
              <span className="analysis-value">
                S: {factorAnalysis.strengths}, W: {factorAnalysis.weaknesses},
                O: {factorAnalysis.opportunities}, T: {factorAnalysis.threats}
              </span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">Можно сгенерировать:</span>
              <span className="analysis-value">
                {[
                  factorAnalysis.canGenerateSO && 'SO',
                  factorAnalysis.canGenerateWO && 'WO',
                  factorAnalysis.canGenerateST && 'ST',
                  factorAnalysis.canGenerateWT && 'WT',
                ].filter(Boolean).join(', ') || 'нет стратегий'}
              </span>
            </div>
          </div>
          {factorAnalysis.missingTypes.length > 0 && (
            <div className="analysis-warning">
              ⚠️ {factorAnalysis.missingTypes.join(', ')}
            </div>
          )}
          {factorAnalysis.missingTypes.length === 0 && strategies.length === 0 && (
            <div className="analysis-info">
              ✅ Данных достаточно. Нажмите «Сгенерировать стратегии».
            </div>
          )}
        </div>
      )}

      <div className="strategies-summary">
        <div className="summary-card">
          <h3>Итог</h3>
          <p>Всего стратегий: <strong>{strategies.length}</strong></p>
        </div>
        <div className="summary-card">
          <h3>По типам</h3>
          <div className="strategy-types">
            <div className="strategy-type">SO: {groupedStrategies.SO.length}</div>
            <div className="strategy-type">WO: {groupedStrategies.WO.length}</div>
            <div className="strategy-type">ST: {groupedStrategies.ST.length}</div>
            <div className="strategy-type">WT: {groupedStrategies.WT.length}</div>
          </div>
        </div>
      </div>

      <div className="strategies-list">
        {strategies.length === 0 && factors.length > 0 && (
          <div className="empty-message">
            <p>Стратегии ещё не сгенерированы. Нажмите «Сгенерировать стратегии».</p>
          </div>
        )}
        {[...strategies]
          .sort((a, b) => strategyService.calculateStrategyPriority(b) - strategyService.calculateStrategyPriority(a))
          .map(strategy => {
            const priority = strategyService.calculateStrategyPriority(strategy)
            return (
              <div key={strategy.id} className={`strategy-card type-${strategy.type.toLowerCase()}`}>
                <div className="strategy-header">
                  <span className="strategy-type-label">{strategy.type}</span>
                  <h3>{strategy.title}</h3>
                  <span className="strategy-priority">
                    {isSeminar ? `Взаимодействие: ${priority.toFixed(2)}` : `Приоритет: ${priority.toFixed(2)}`}
                  </span>
                </div>
                <p className="strategy-type-description">{strategyService.getStrategyTypeDescription(strategy.type)}</p>
                <p className="strategy-description">{strategy.description}</p>
                <div className="strategy-factors">
                  <h4>Ключевые факторы ({strategy.factors.length})</h4>
                  <ul>
                    {strategy.factors.map(f => (
                      <li key={f.id}>
                        <span className="factor-type">{getFactorTypeLabel(f.type)}</span>
                        <span className="factor-text">{f.text}</span>
                        <span className="factor-score">Оценка: {f.score?.toFixed(2) ?? '-'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
