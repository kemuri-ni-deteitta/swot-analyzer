import { useState } from 'react'
import { Factor, FactorType } from '../../types'
import { getFactorTypeShortLabel } from '../../utils/factorTypes'

type Props = {
  onSubmit: (factor: Factor) => void
}

const factorTypes: FactorType[] = ['S', 'W', 'O', 'T']

const defaultState = {
  type: 'S' as FactorType,
  text: '',
  category: '',
  significance: 3,
  impact: 3,
  probability: 3,
}

export function FactorForm({ onSubmit }: Props) {
  const [state, setState] = useState(defaultState)
  const [categoryError, setCategoryError] = useState(false)
  const [textError, setTextError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.text.trim() || !state.category.trim()) {
      if (!state.category.trim()) {
        setCategoryError(true)
        setTimeout(() => setCategoryError(false), 3000)
      }
      if (!state.text.trim()) {
        setTextError(true)
        setTimeout(() => setTextError(false), 3000)
      }
      return
    }

    const factor: Factor = {
      id: crypto.randomUUID(),
      type: state.type,
      text: state.text.trim(),
      category: state.category.trim(),
      significance: Number(state.significance),
      impact: Number(state.impact),
      probability:
        state.type === 'O' || state.type === 'T' ? Number(state.probability) : undefined,
    }
    onSubmit(factor)
    setState(defaultState)
    setCategoryError(false)
    setTextError(false)
  }

  const update = <K extends keyof typeof state>(key: K, value: any) => {
    // Ограничение для числовых полей 1-5
    if (key === 'significance' || key === 'impact' || key === 'probability') {
      const numValue = Number(value)
      if (isNaN(numValue) || numValue < 1) {
        value = 1
      } else if (numValue > 5) {
        value = 5
      } else {
        value = Math.round(numValue)
      }
    }
    setState(prev => ({ ...prev, [key]: value }))
    
    // Сбрасываем ошибки при вводе
    if (key === 'category' && value.trim()) {
      setCategoryError(false)
    }
    if (key === 'text' && value.trim()) {
      setTextError(false)
    }
  }

  return (
    <form className="factor-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Тип
          <select
            value={state.type}
            onChange={e => update('type', e.target.value as FactorType)}
          >
            {factorTypes.map(type => (
              <option key={type} value={type}>
                {getFactorTypeShortLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Категория
          <input
            type="text"
            value={state.category}
            onChange={e => update('category', e.target.value)}
            onBlur={() => {
              if (!state.category.trim()) {
                setCategoryError(true)
              }
            }}
            placeholder="Категория"
            className={categoryError ? 'error-input' : ''}
            required
          />
          {categoryError && (
            <span className="error-message">⚠️ Необходимо ввести категорию</span>
          )}
        </label>

        <label>
          Значимость (1-5)
          <input
            type="number"
            min={1}
            max={5}
            value={state.significance}
            onChange={e => update('significance', e.target.value)}
            onKeyDown={(e) => {
              // Предотвращаем ввод значений больше 5
              if (e.key >= '0' && e.key <= '9') {
                const newValue = Number(String(state.significance) + e.key)
                if (newValue > 5) {
                  e.preventDefault()
                }
              }
            }}
          />
        </label>

        <label>
          Влияние (1-5)
          <input
            type="number"
            min={1}
            max={5}
            value={state.impact}
            onChange={e => update('impact', e.target.value)}
            onKeyDown={(e) => {
              if (e.key >= '0' && e.key <= '9') {
                const newValue = Number(String(state.impact) + e.key)
                if (newValue > 5) {
                  e.preventDefault()
                }
              }
            }}
          />
        </label>

        {(state.type === 'O' || state.type === 'T') && (
          <label>
            Вероятность (1-5)
            <input
              type="number"
              min={1}
              max={5}
              value={state.probability}
              onChange={e => update('probability', e.target.value)}
              onKeyDown={(e) => {
                if (e.key >= '0' && e.key <= '9') {
                  const newValue = Number(String(state.probability) + e.key)
                  if (newValue > 5) {
                    e.preventDefault()
                  }
                }
              }}
            />
          </label>
        )}
      </div>

      <div className="form-row">
        <label className="flex-1">
          Текст фактора
          <input
            type="text"
            value={state.text}
            onChange={e => update('text', e.target.value)}
            onBlur={() => {
              if (!state.text.trim()) {
                setTextError(true)
              }
            }}
            placeholder="Опишите фактор"
            className={textError ? 'error-input' : ''}
            required
          />
          {textError && (
            <span className="error-message">⚠️ Необходимо ввести текст фактора</span>
          )}
        </label>
        <button type="submit" className="primary-btn">
          Добавить
        </button>
      </div>
    </form>
  )
}
