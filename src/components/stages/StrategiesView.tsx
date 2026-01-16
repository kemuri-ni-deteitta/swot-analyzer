import { useMemo, useState } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { getFactorTypeLabel } from '../../utils/factorTypes'
import { strategyService } from '../../services/strategyService'
import './StrategiesView.css'

export default function StrategiesView() {
  const { currentProject, generateStrategies } = useProjectStore()
  const [topCount, setTopCount] = useState(5) // Минимум 5 факторов
  const factors = currentProject?.factors ?? []
  const strategies = currentProject?.strategies ?? []
  
  // Анализ доступности факторов для генерации стратегий
  const factorAnalysis = useMemo(() => {
    if (factors.length === 0) return null
    return strategyService.analyzeFactorAvailability(factors, topCount)
  }, [factors, topCount])

  const groupedStrategies = useMemo(() => {
    return {
      SO: strategies.filter(s => s.type === 'SO'),
      WO: strategies.filter(s => s.type === 'WO'),
      ST: strategies.filter(s => s.type === 'ST'),
      WT: strategies.filter(s => s.type === 'WT'),
    }
  }, [strategies])

  if (!currentProject) {
    return (
      <div className="strategies-view">
        <h2>Стратегии</h2>
        <p>Выберите или создайте проект на этапе 0 (Project Hub).</p>
      </div>
    )
  }

  return (
    <div className="strategies-view">
      <h2>Стратегии</h2>

      <div className="strategies-controls">
        <div className="control-group">
          <label htmlFor="topCount">
            Топ факторов для стратегий
            <span className="control-hint">
              (выбираются {topCount} факторов с наивысшей оценкой)
            </span>
          </label>
          <select
            id="topCount"
            value={topCount}
            onChange={(e) => setTopCount(Number(e.target.value))}
          >
            <option value={5}>5 (стандартный)</option>
            <option value={7}>7 (детальный)</option>
            <option value={10}>10 (полный)</option>
          </select>
          <div className="control-explanation">
            <p><strong>Что это означает?</strong></p>
            <p>
              Из всех {factors.length} факторов будут выбраны {topCount} факторов с наивысшей оценкой (score).
              Из них будут сформированы стратегии.
            </p>
            <p className="hint-small">
              💡 Оценка = значимость × влияние (для S/W) или значимость × влияние × вероятность (для O/T)
            </p>
          </div>
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
          <p>Нет факторов для генерации стратегий.</p>
          <p>Вернитесь на этап 1 и добавьте факторы.</p>
        </div>
      )}


      {factorAnalysis && factors.length > 0 && (
        <div className="factor-analysis">
          <h3>Анализ доступных факторов</h3>
          <div className="analysis-grid">
            <div className="analysis-item">
              <span className="analysis-label">В топе {topCount}:</span>
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
              ⚠️ <strong>Проблема:</strong> {factorAnalysis.missingTypes.join(', ')}
              <br />
              <span className="analysis-hint">
                💡 Попробуйте увеличить число топ-факторов или добавьте больше факторов разных типов
              </span>
            </div>
          )}
          {factorAnalysis.missingTypes.length === 0 && strategies.length === 0 && (
            <div className="analysis-info">
              ✅ Факторов достаточно для генерации стратегий. Нажмите кнопку "Сгенерировать стратегии".
            </div>
          )}
        </div>
      )}

      <div className="strategies-summary">
        <div className="summary-card">
          <h3>Итог</h3>
          <p>Всего стратегий: <strong>{strategies.length}</strong></p>
          <p>Топ факторов: <strong>{topCount}</strong></p>
        </div>
        <div className="summary-card">
          <h3>Типы стратегий</h3>
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
            <p>Стратегии ещё не сгенерированы.</p>
            <p>Нажмите «Сгенерировать стратегии».</p>
          </div>
        )}

        {strategies
          .sort((a, b) => {
            // Сортируем по приоритету (общий score факторов)
            const scoreA = a.factors.reduce((sum, f) => sum + (f.score || 0), 0)
            const scoreB = b.factors.reduce((sum, f) => sum + (f.score || 0), 0)
            return scoreB - scoreA
          })
          .map(strategy => {
            const priority = strategyService.calculateStrategyPriority(strategy)
            const typeDescription = strategyService.getStrategyTypeDescription(strategy.type)
            
            return (
              <div key={strategy.id} className={`strategy-card type-${strategy.type.toLowerCase()}`}>
                <div className="strategy-header">
                  <span className="strategy-type-label">{strategy.type}</span>
                  <h3>{strategy.title}</h3>
                  <span className="strategy-priority">Приоритет: {priority}</span>
                </div>
                <p className="strategy-type-description">{typeDescription}</p>
                <p className="strategy-description">{strategy.description}</p>
                <div className="strategy-factors">
                  <h4>Ключевые факторы ({strategy.factors.length})</h4>
                  <ul>
                    {strategy.factors.map(factor => (
                      <li key={factor.id}>
                        <span className="factor-type">{getFactorTypeLabel(factor.type)}</span>
                        <span className="factor-text">{factor.text || '(текст не указан)'}</span>
                        <span className="factor-score">Оценка: {factor.score ?? '-'}</span>
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
