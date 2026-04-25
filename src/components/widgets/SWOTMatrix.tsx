import { useMemo } from 'react'
import { Factor, Interaction } from '../../types'
import { calculationService } from '../../services/calculationService'
import './SWOTMatrix.css'

type Props = {
  factors: Factor[]
  interactions?: Interaction[]
  isSeminarMode?: boolean
}

export function SWOTMatrix({ factors, interactions = [], isSeminarMode = false }: Props) {
  const totals = useMemo(() => {
    return calculationService.calculateQuadrantTotals(factors)
  }, [factors])

  const interactionTotals = useMemo(() => {
    if (!isSeminarMode) return null
    return calculationService.calculateInteractionTotals(factors, interactions)
  }, [factors, interactions, isSeminarMode])

  const factorsByType = useMemo(() => ({
    S: factors.filter(f => f.type === 'S'),
    W: factors.filter(f => f.type === 'W'),
    O: factors.filter(f => f.type === 'O'),
    T: factors.filter(f => f.type === 'T'),
  }), [factors])

  const topFactorsByType = useMemo(() => ({
    S: calculationService.getTopFactors(factorsByType.S, 3),
    W: calculationService.getTopFactors(factorsByType.W, 3),
    O: calculationService.getTopFactors(factorsByType.O, 3),
    T: calculationService.getTopFactors(factorsByType.T, 3),
  }), [factorsByType])

  return (
    <div className="swot-matrix">
      <h3>SWOT Матрица</h3>
      {isSeminarMode && interactionTotals && (
        <div className="quadrant-interaction-totals">
          <span className="qi-item so">SO: {interactionTotals.SO.toFixed(2)}</span>
          <span className="qi-item wt">WT: {interactionTotals.WT.toFixed(2)}</span>
        </div>
      )}
      <div className="matrix-grid">
        <div className="quadrant quadrant-strengths">
          <div className="quadrant-header">
            <span className="quadrant-label">S</span>
            <span className="quadrant-title">Strengths</span>
            <span className="quadrant-title-ru">Сильные стороны</span>
          </div>
          <div className="quadrant-total">Σ = {totals.S.toFixed(1)}</div>
          <div className="quadrant-factors">
            {topFactorsByType.S.length > 0 ? (
              <ul>{topFactorsByType.S.map(f => <li key={f.id} title={`Оценка: ${f.score?.toFixed(2)}`}>{f.text}</li>)}</ul>
            ) : <p className="empty-quadrant">Нет факторов</p>}
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
              <ul>{topFactorsByType.W.map(f => <li key={f.id} title={`Оценка: ${f.score?.toFixed(2)}`}>{f.text}</li>)}</ul>
            ) : <p className="empty-quadrant">Нет факторов</p>}
          </div>
        </div>

        <div className="quadrant quadrant-opportunities">
          <div className="quadrant-header">
            <span className="quadrant-label">O</span>
            <span className="quadrant-title">Opportunities</span>
            <span className="quadrant-title-ru">Возможности</span>
          </div>
          <div className="quadrant-total">Σ = {totals.O.toFixed(1)}</div>
          <div className="quadrant-factors">
            {topFactorsByType.O.length > 0 ? (
              <ul>{topFactorsByType.O.map(f => <li key={f.id} title={`Оценка: ${f.score?.toFixed(2)}`}>{f.text}</li>)}</ul>
            ) : <p className="empty-quadrant">Нет факторов</p>}
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
              <ul>{topFactorsByType.T.map(f => <li key={f.id} title={`Оценка: ${f.score?.toFixed(2)}`}>{f.text}</li>)}</ul>
            ) : <p className="empty-quadrant">Нет факторов</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
