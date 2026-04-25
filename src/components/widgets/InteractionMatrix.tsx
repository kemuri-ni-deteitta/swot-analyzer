import { useMemo } from 'react'
import { Factor, Interaction } from '../../types'
import './InteractionMatrix.css'

type Props = {
  factors: Factor[]
  interactions: Interaction[]
}

export function InteractionMatrix({ factors, interactions }: Props) {
  const internalFactors = useMemo(
    () => factors.filter(f => f.type === 'S' || f.type === 'W'),
    [factors]
  )
  const externalFactors = useMemo(
    () => factors.filter(f => f.type === 'O' || f.type === 'T'),
    [factors]
  )

  if (internalFactors.length === 0 || externalFactors.length === 0) {
    return (
      <div className="interaction-matrix-empty">
        <p>Для отображения матрицы взаимодействий необходимы внутренние (S/W) и внешние (O/T) факторы.</p>
      </div>
    )
  }

  const getInteraction = (internalId: string, externalId: string): Interaction | undefined =>
    interactions.find(i => i.internalFactorId === internalId && i.externalFactorId === externalId)

  const getScore = (internalId: string, externalId: string): number | undefined =>
    getInteraction(internalId, externalId)?.score

  // Row totals (sum of interactions per internal factor)
  const rowTotal = (internalId: string) =>
    externalFactors.reduce((sum, ext) => sum + (getScore(internalId, ext.id) ?? 0), 0)

  // Column totals
  const colTotal = (externalId: string) =>
    internalFactors.reduce((sum, int) => sum + (getScore(int.id, externalId) ?? 0), 0)

  const grandTotal = internalFactors.reduce((sum, int) => sum + rowTotal(int.id), 0)

  return (
    <div className="interaction-matrix-wrapper">
      <div className="matrix-scroll">
        <table className="interaction-matrix">
          <thead>
            <tr>
              <th className="matrix-corner">Внутренние \ Внешние</th>
              {externalFactors.map(ext => (
                <th key={ext.id} className={`matrix-ext-header type-${ext.type.toLowerCase()}`} title={ext.text}>
                  <div className="factor-header-content">
                    <span className="factor-type-badge">{ext.type}</span>
                    <span className="factor-short-text">
                      {ext.text.length > 20 ? ext.text.slice(0, 20) + '…' : ext.text}
                    </span>
                    <span className="factor-significance">Kj={ext.significance}, Pj={ext.probability ?? 1}</span>
                  </div>
                </th>
              ))}
              <th className="matrix-total-header">Σ строки</th>
            </tr>
          </thead>
          <tbody>
            {internalFactors.map(int => (
              <tr key={int.id}>
                <td className={`matrix-int-header type-${int.type.toLowerCase()}`}>
                  <div className="factor-header-content">
                    <span className="factor-type-badge">{int.type}</span>
                    <span className="factor-short-text" title={int.text}>
                      {int.text.length > 25 ? int.text.slice(0, 25) + '…' : int.text}
                    </span>
                    <span className="factor-significance">Ai={int.significance}</span>
                  </div>
                </td>
                {externalFactors.map(ext => {
                  const score = getScore(int.id, ext.id)
                  return (
                    <td key={ext.id} className="matrix-cell">
                      <div className="cell-content">
                        <span
                          className="cell-score"
                          title={`Aij = Ai × Kj × Pj для «${int.text}» × «${ext.text}»`}
                        >
                          {score !== undefined ? score.toFixed(2) : '—'}
                        </span>
                      </div>
                    </td>
                  )
                })}
                <td className="matrix-row-total">
                  <strong>{rowTotal(int.id).toFixed(2)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="matrix-col-total-label">Σ столбца</td>
              {externalFactors.map(ext => (
                <td key={ext.id} className="matrix-col-total">
                  <strong>{colTotal(ext.id).toFixed(2)}</strong>
                </td>
              ))}
              <td className="matrix-grand-total">
                <strong>{grandTotal.toFixed(2)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="matrix-hint">
        Значение Aij = Ai × Kj × Pj рассчитывается автоматически для каждой пары внутреннего и внешнего факторов.
      </p>
    </div>
  )
}
