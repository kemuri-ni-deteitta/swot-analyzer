import { Factor } from '../../types'
import './ScoreMatrix.css'

type Props = {
  internalFactors: Factor[]
  externalFactors: Factor[]
  internalPrefix: string
  externalPrefix: string
  title: string
  heatColor: string
}

export function ScoreMatrix({
  internalFactors,
  externalFactors,
  internalPrefix,
  externalPrefix,
  title,
  heatColor,
}: Props) {
  const MAX_VAL = 25

  const extVal = (ext: Factor): number => (ext.probability ?? 0) * ext.significance
  const cellVal = (int: Factor, ext: Factor): number => int.significance * extVal(ext)

  const hasMissingProb = externalFactors.some(f => f.probability == null)

  return (
    <div className="score-matrix-block">
      <h4 className="score-matrix-title">{title}</h4>
      <p className="score-matrix-formula">
        Элемент ячейки = A<sub>i</sub> · p<sub>j</sub> · K<sub>j</sub>
      </p>

      {hasMissingProb && (
        <p className="score-matrix-warning">
          ⚠️ У некоторых внешних факторов не задана вероятность (p<sub>j</sub>). Для них использовано p<sub>j</sub> = 0.
        </p>
      )}

      <div className="score-matrix-scroll">
        <table className="score-matrix-table">
          <thead>
            <tr>
              <th className="sm-corner">Фактор</th>
              <th className="sm-ai-col">A<sub>i</sub></th>
              {externalFactors.map((ext, j) => (
                <th key={ext.id} className="sm-ext-header">
                  {externalPrefix}{j + 1}
                </th>
              ))}
            </tr>
            <tr className="sm-helper-row">
              <td className="sm-helper-label">p<sub>j</sub>·K<sub>j</sub></td>
              <td className="sm-helper-dash">—</td>
              {externalFactors.map(ext => (
                <td key={ext.id} className="sm-helper-val">
                  {extVal(ext).toFixed(2)}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {internalFactors.map((int, i) => (
              <tr key={int.id}>
                <td className="sm-row-label">{internalPrefix}{i + 1}</td>
                <td className="sm-ai-cell">{int.significance}</td>
                {externalFactors.map(ext => (
                  <td key={ext.id} className="sm-data-cell">
                    {cellVal(int, ext).toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="score-heatmap-scroll">
        <table className="score-heatmap-table">
          <thead>
            <tr>
              <th className="sm-corner">{internalPrefix} \ {externalPrefix}</th>
              {externalFactors.map((ext, j) => (
                <th key={ext.id} className="sm-ext-header">
                  {externalPrefix}{j + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {internalFactors.map((int, i) => (
              <tr key={int.id}>
                <td className="sm-row-label">{internalPrefix}{i + 1}</td>
                {externalFactors.map(ext => {
                  const val = cellVal(int, ext)
                  const norm = Math.min(val / MAX_VAL, 1)
                  return (
                    <td
                      key={ext.id}
                      className="sm-heat-cell"
                      style={{
                        backgroundColor: `rgba(${heatColor}, ${norm.toFixed(3)})`,
                        color: norm > 0.5 ? '#fff' : 'var(--text-primary)',
                      }}
                    >
                      {val.toFixed(1)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
