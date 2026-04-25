import { useState } from 'react'
import { Factor, FactorType, FormulaProfile } from '../../types'
import { getFactorTypeShortLabel } from '../../utils/factorTypes'

type Props = {
  onSubmit: (factor: Factor) => void
  profile: FormulaProfile
}

const factorTypes: FactorType[] = ['S', 'W', 'O', 'T']

function defaultState(profile: FormulaProfile) {
  const base = {
    type: 'S' as FactorType,
    text: '',
    category: '',
    significance: 3,
    probability: 0.5,
    impact: 3,
    customFieldValues: {} as Record<string, number>,
  }
  if (profile.customFields) {
    for (const f of profile.customFields) {
      base.customFieldValues[f.key] = f.defaultValue ?? (f.min ?? 1)
    }
  }
  return base
}

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

export function FactorForm({ onSubmit, profile }: Props) {
  const [state, setState] = useState(() => defaultState(profile))
  const [categoryError, setCategoryError] = useState(false)
  const [textError, setTextError] = useState(false)

  const showImpact = needsImpact(profile)
  const showProbability = state.type === 'O' || state.type === 'T'

  const customFieldsForType = (profile.customFields ?? []).filter(
    f => f.key !== 'impact' && (!f.appliesTo || f.appliesTo.includes(state.type))
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let hasError = false
    if (!state.text.trim()) { setTextError(true); setTimeout(() => setTextError(false), 3000); hasError = true }
    if (!state.category.trim()) { setCategoryError(true); setTimeout(() => setCategoryError(false), 3000); hasError = true }
    if (hasError) return

    const factor: Factor = {
      id: crypto.randomUUID(),
      type: state.type,
      text: state.text.trim(),
      category: state.category.trim(),
      significance: Number(state.significance),
      probability: showProbability ? Number(state.probability) : undefined,
      impact: showImpact ? Number(state.impact) : undefined,
      customFieldValues: Object.keys(state.customFieldValues).length > 0
        ? state.customFieldValues
        : undefined,
    }
    onSubmit(factor)
    setState(defaultState(profile))
    setCategoryError(false)
    setTextError(false)
  }

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))

  const update = (key: string, value: any) => {
    if (key === 'significance' || key === 'impact') {
      const n = Number(value)
      value = isNaN(n) ? 1 : Math.round(clamp(n, 1, 5))
    } else if (key === 'probability') {
      const n = Number(value)
      value = isNaN(n) ? 0 : Math.round(clamp(n, 0, 1) * 100) / 100
    }
    setState(prev => ({ ...prev, [key]: value }))
    if (key === 'category' && String(value).trim()) setCategoryError(false)
    if (key === 'text' && String(value).trim()) setTextError(false)
  }

  const updateCustom = (key: string, value: string, field: { min?: number; max?: number }) => {
    let n = Number(value)
    if (isNaN(n)) n = field.min ?? 1
    if (field.min !== undefined && n < field.min) n = field.min
    if (field.max !== undefined && n > field.max) n = field.max
    setState(prev => ({
      ...prev,
      customFieldValues: { ...prev.customFieldValues, [key]: n },
    }))
  }

  return (
    <form className="factor-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Тип
          <select value={state.type} onChange={e => update('type', e.target.value)}>
            {factorTypes.map(t => (
              <option key={t} value={t}>{getFactorTypeShortLabel(t)}</option>
            ))}
          </select>
        </label>

        <label>
          Категория
          <input
            type="text"
            value={state.category}
            onChange={e => update('category', e.target.value)}
            onBlur={() => { if (!state.category.trim()) setCategoryError(true) }}
            placeholder="Категория"
            className={categoryError ? 'error-input' : ''}
          />
          {categoryError && <span className="error-message">⚠️ Необходимо ввести категорию</span>}
        </label>

        <label>
          Значимость (1-5)
          <input
            type="number" min={1} max={5}
            value={state.significance}
            onChange={e => update('significance', e.target.value)}
          />
        </label>

        {showImpact && (
          <label>
            Влияние (1-5)
            <input
              type="number" min={1} max={5}
              value={state.impact}
              onChange={e => update('impact', e.target.value)}
            />
          </label>
        )}

        {showProbability && (
          <label>
            Вероятность (0-1)
            <input
              type="number" min={0} max={1} step={0.01}
              value={state.probability}
              onChange={e => update('probability', e.target.value)}
            />
          </label>
        )}

        {customFieldsForType.map(field => (
          <label key={field.key}>
            {field.label}
            <input
              type="number"
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              value={state.customFieldValues[field.key] ?? (field.defaultValue ?? field.min ?? 1)}
              onChange={e => updateCustom(field.key, e.target.value, field)}
            />
          </label>
        ))}
      </div>

      <div className="form-row">
        <label className="flex-1">
          Текст фактора
          <input
            type="text"
            value={state.text}
            onChange={e => update('text', e.target.value)}
            onBlur={() => { if (!state.text.trim()) setTextError(true) }}
            placeholder="Опишите фактор"
            className={textError ? 'error-input' : ''}
          />
          {textError && <span className="error-message">⚠️ Необходимо ввести текст фактора</span>}
        </label>
        <button type="submit" className="primary-btn">Добавить</button>
      </div>
    </form>
  )
}
