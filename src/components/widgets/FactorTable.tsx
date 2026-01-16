import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Factor, FactorType } from '../../types'
import { getFactorTypeLabel } from '../../utils/factorTypes'

type Props = {
  factors: Factor[]
  errors?: Record<string, string[]>
  onUpdate: (id: string, updates: Partial<Factor>) => void
  onDelete: (id: string) => void
}

type SortKey = 'score' | 'type' | 'category'

export function FactorTable({ factors, onUpdate, onDelete }: Props) {
  const [filterType, setFilterType] = useState<FactorType | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('score')

  const categories = useMemo(() => {
    const set = new Set<string>()
    factors.forEach(f => set.add(f.category))
    return Array.from(set)
  }, [factors])

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase()
    return factors
      .filter(f => (filterType === 'all' ? true : f.type === filterType))
      .filter(f => (filterCategory === 'all' ? true : f.category === filterCategory))
      .filter(
        f =>
          f.text.toLowerCase().includes(searchLower) ||
          f.category.toLowerCase().includes(searchLower),
      )
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

  return (
    <div className="factor-table">
      <div className="table-controls">
        <div className="filters">
          <label>
            Тип
            <select value={filterType} onChange={e => setFilterType(e.target.value as any)}>
              <option value="all">Все типы</option>
              <option value="S">S - Strength (Сильные стороны)</option>
              <option value="W">W - Weakness (Слабые стороны)</option>
              <option value="O">O - Opportunity (Возможности)</option>
              <option value="T">T - Threat (Угрозы)</option>
            </select>
          </label>

          <label>
            Категория
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="all">Все</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label>
            Поиск
            <input
              type="text"
              placeholder="Поиск по тексту или категории"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </label>

          <label>
            Сортировка
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)}>
              <option value="score">По оценке (убыв.)</option>
              <option value="type">По типу</option>
              <option value="category">По категории</option>
            </select>
          </label>
        </div>
      </div>

      <div className="table-head">
        <div className="col type">Тип</div>
        <div className="col category">Категория</div>
        <div className="col text">Текст</div>
        <div className="col num">Значимость</div>
        <div className="col num">Влияние</div>
        <div className="col num">Вероятность</div>
        <div className="col num">Оценка</div>
        <div className="col actions">Действия</div>
      </div>

      <div className="table-body" ref={parentRef} style={{ height: 420, overflow: 'auto' }}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const factor = filtered[virtualRow.index]
            return (
              <div
                key={factor.id}
                className="table-row"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="col type" title={getFactorTypeLabel(factor.type)}>
                  {factor.type}
                </div>
                <div className="col category">{factor.category}</div>
                <div className="col text">{factor.text}</div>
                <div className="col num">
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={factor.significance}
                    onChange={e =>
                      onUpdate(factor.id, { significance: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="col num">
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={factor.impact}
                    onChange={e => onUpdate(factor.id, { impact: Number(e.target.value) })}
                  />
                </div>
                <div className="col num">
                  {factor.type === 'S' || factor.type === 'W' ? (
                    <span className="muted">—</span>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={factor.probability ?? ''}
                      onChange={e =>
                        onUpdate(factor.id, {
                          probability: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  )}
                </div>
                <div className="col num">{factor.score ?? '-'}</div>
                <div className="col actions">
                  <button className="ghost danger" onClick={() => onDelete(factor.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
