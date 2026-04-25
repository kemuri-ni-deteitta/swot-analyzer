import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Factor, FactorType, FormulaProfile } from '../../types'
import { getFactorTypeLabel } from '../../utils/factorTypes'

type Props = {
  factors: Factor[]
  profile: FormulaProfile
  errors?: Record<string, string[]>
  onUpdate: (id: string, updates: Partial<Factor>) => void
  onDelete: (id: string) => void
}

type SortKey = 'score' | 'type' | 'category'

function needsImpact(profile: FormulaProfile): boolean {
  if (profile.mode === 'simplified') return true
  if (profile.mode === 'custom') {
    return (
      !!profile.factorExpression?.includes('impact') ||
      !!profile.interactionExpression?.includes('impact') ||
      !!profile.customFields?.some(f => f.key === 'impact')
    )
  }
  return false
}

export function FactorTable({ factors, profile, onUpdate, onDelete }: Props) {
  const [filterType, setFilterType] = useState<FactorType | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('score')

  const showImpact = needsImpact(profile)
  const showScore = profile.mode !== 'seminar'
  const customCols = (profile.customFields ?? []).filter(f => f.key !== 'impact')

  const categories = useMemo(() => {
    const s = new Set<string>()
    factors.forEach(f => s.add(f.category))
    return Array.from(s)
  }, [factors])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return factors
      .filter(f => filterType === 'all' ? true : f.type === filterType)
      .filter(f => filterCategory === 'all' ? true : f.category === filterCategory)
      .filter(f => f.text.toLowerCase().includes(q) || f.category.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === 'score') return (b.score || 0) - (a.score || 0)
        if (sort === 'type') return a.type.localeCompare(b.type)
        return a.category.localeCompare(b.category)
      })
  }, [factors, filterType, filterCategory, search, sort])

  const parentRef = useRef<HTMLDivElement | null>(null)
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8,
  })

  // Build grid template: type(80) cat(120) text(1fr) sig(100) [impact(100)] prob(100) [score(90)] [customCols] actions(120)
  const colDefs = [
    '80px', '120px', '1fr', '100px',
    ...(showImpact ? ['100px'] : []),
    '100px',
    ...(showScore ? ['90px'] : []),
    ...customCols.map(() => '100px'),
    '120px',
  ]
  const gridTemplate = colDefs.join(' ')

  return (
    <div className="factor-table">
      <div className="table-controls">
        <div className="filters">
          <label>
            Тип
            <select value={filterType} onChange={e => setFilterType(e.target.value as any)}>
              <option value="all">Все типы</option>
              <option value="S">S - Strength</option>
              <option value="W">W - Weakness</option>
              <option value="O">O - Opportunity</option>
              <option value="T">T - Threat</option>
            </select>
          </label>
          <label>
            Категория
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">Все</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Поиск
            <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
          </label>
          <label>
            Сортировка
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)}>
              <option value="score">По оценке</option>
              <option value="type">По типу</option>
              <option value="category">По категории</option>
            </select>
          </label>
        </div>
      </div>

      <div className="table-head" style={{ gridTemplateColumns: gridTemplate }}>
        <div className="col type">Тип</div>
        <div className="col category">Категория</div>
        <div className="col text">Текст</div>
        <div className="col num">Значимость</div>
        {showImpact && <div className="col num">Влияние</div>}
        <div className="col num">Вероятность</div>
        {showScore && <div className="col num">Оценка</div>}
        {customCols.map(f => <div key={f.key} className="col num">{f.label}</div>)}
        <div className="col actions">Действия</div>
      </div>

      <div className="table-body" ref={parentRef}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const factor = filtered[virtualRow.index]
            return (
              <div
                key={factor.id}
                className="table-row"
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  gridTemplateColumns: gridTemplate,
                }}
              >
                <div className="col type" title={getFactorTypeLabel(factor.type)}>{factor.type}</div>
                <div className="col category">{factor.category}</div>
                <div className="col text">{factor.text}</div>
                <div className="col num">
                  <input type="number" min={1} max={5} value={factor.significance}
                    onChange={e => onUpdate(factor.id, { significance: Number(e.target.value) })} />
                </div>
                {showImpact && (
                  <div className="col num">
                    <input type="number" min={1} max={5} value={factor.impact ?? 3}
                      onChange={e => onUpdate(factor.id, { impact: Number(e.target.value) })} />
                  </div>
                )}
                <div className="col num">
                  {factor.type === 'S' || factor.type === 'W' ? (
                    <span className="muted">—</span>
                  ) : (
                    <input type="number" min={0} max={1} step={0.01} value={factor.probability ?? ''}
                      onChange={e => {
                        if (!e.target.value) { onUpdate(factor.id, { probability: undefined }); return }
                        let v = Number(e.target.value)
                        if (v < 0) v = 0
                        if (v > 1) v = 1
                        onUpdate(factor.id, { probability: Math.round(v * 100) / 100 })
                      }} />
                  )}
                </div>
                {showScore && <div className="col num">{factor.score?.toFixed(2) ?? '-'}</div>}
                {customCols.map(f => (
                  <div key={f.key} className="col num">
                    <input type="number" min={f.min} max={f.max} step={f.step ?? 1}
                      value={factor.customFieldValues?.[f.key] ?? (f.defaultValue ?? f.min ?? 1)}
                      onChange={e => {
                        const n = Number(e.target.value)
                        onUpdate(factor.id, {
                          customFieldValues: { ...(factor.customFieldValues ?? {}), [f.key]: n },
                        })
                      }} />
                  </div>
                ))}
                <div className="col actions">
                  <button className="ghost danger" onClick={() => onDelete(factor.id)}>Удалить</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
