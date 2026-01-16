import { useMemo } from 'react'
import { Factor } from '../../types'
import { calculationService } from '../../services/calculationService'
import './SWOTMatrix.css'

type Props = {
  factors: Factor[]
}

export function SWOTMatrix({ factors }: Props) {
  const totals = useMemo(() => {
    return calculationService.calculateQuadrantTotals(factors)
  }, [factors])

  const factorsByType = useMemo(() => {
    return {
      S: factors.filter(f => f.type === 'S'),
      W: factors.filter(f => f.type === 'W'),
      O: factors.filter(f => f.type === 'O'),
      T: factors.filter(f => f.type === 'T'),
    }
  }, [factors])

  const topFactorsByType = useMemo(() => {
    return {
      S: calculationService.getTopFactors(factorsByType.S, 3),
      W: calculationService.getTopFactors(factorsByType.W, 3),
      O: calculationService.getTopFactors(factorsByType.O, 3),
      T: calculationService.getTopFactors(factorsByType.T, 3),
    }
  }, [factorsByType])

  return (
    <div className="swot-matrix">
      <h3>SWOT Матрица</h3>
      <div className="matrix-grid">
        {/* Верхний ряд */}
        <div className="quadrant quadrant-strengths">
          <div className="quadrant-header">
            <span className="quadrant-label">S</span>
            <span className="quadrant-title">Strengths</span>
            <span className="quadrant-title-ru">Сильные стороны</span>
          </div>
          <div className="quadrant-total">Σ = {totals.S.toFixed(1)}</div>
          <div className="quadrant-factors">
            {topFactorsByType.S.length > 0 ? (
              <ul>
                {topFactorsByType.S.map(factor => (
                  <li key={factor.id} title={`Оценка: ${factor.score?.toFixed(1)}`}>
                    {factor.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-quadrant">Нет факторов</p>
            )}
          </div>
        </div>

        <div className="quadrant quadrant-weaknesses">
          <div className="quadrant-header">
            <span className="quadrant-label">W</span>
            <span className="quadrant-title">Weaknesses</span>
            <span className="quadrant-title-ru">Слабые стороны</span>
          </div>
          <div className="quadrant-total">Σ = {totals.W.toFixed(1)}</div>
          <div className="quadrant-factors">
            {topFactorsByType.W.length > 0 ? (
              <ul>
                {topFactorsByType.W.map(factor => (
                  <li key={factor.id} title={`Оценка: ${factor.score?.toFixed(1)}`}>
                    {factor.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-quadrant">Нет факторов</p>
            )}
          </div>
        </div>

        {/* Нижний ряд */}
        <div className="quadrant quadrant-opportunities">
          <div className="quadrant-header">
            <span className="quadrant-label">O</span>
            <span className="quadrant-title">Opportunities</span>
            <span className="quadrant-title-ru">Возможности</span>
          </div>
          <div className="quadrant-total">Σ = {totals.O.toFixed(1)}</div>
          <div className="quadrant-factors">
            {topFactorsByType.O.length > 0 ? (
              <ul>
                {topFactorsByType.O.map(factor => (
                  <li key={factor.id} title={`Оценка: ${factor.score?.toFixed(1)}`}>
                    {factor.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-quadrant">Нет факторов</p>
            )}
          </div>
        </div>

        <div className="quadrant quadrant-threats">
          <div className="quadrant-header">
            <span className="quadrant-label">T</span>
            <span className="quadrant-title">Threats</span>
            <span className="quadrant-title-ru">Угрозы</span>
          </div>
          <div className="quadrant-total">Σ = {totals.T.toFixed(1)}</div>
          <div className="quadrant-factors">
            {topFactorsByType.T.length > 0 ? (
              <ul>
                {topFactorsByType.T.map(factor => (
                  <li key={factor.id} title={`Оценка: ${factor.score?.toFixed(1)}`}>
                    {factor.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-quadrant">Нет факторов</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
