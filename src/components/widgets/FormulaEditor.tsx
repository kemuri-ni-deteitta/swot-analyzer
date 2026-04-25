import { useState, useEffect } from 'react'
import { FormulaProfile, FormulaField, FactorType } from '../../types'
import { BUILT_IN_FORMULA_PROFILES, getAllProfiles } from '../../services/formulaProfiles'
import { validationService } from '../../services/validationService'
import { useProjectStore } from '../../store/useProjectStore'
import './FormulaEditor.css'

export function FormulaEditor() {
  const {
    currentProject,
    currentCalculation,
    saveFormulaProfile,
    deleteFormulaProfile,
    changeCalculationFormula,
    setShowFormulaEditor,
  } = useProjectStore()

  const allProfiles = getAllProfiles(currentProject?.formulaProfiles ?? [])

  const [selectedId, setSelectedId] = useState<string>(
    currentCalculation?.formulaProfileId ?? BUILT_IN_FORMULA_PROFILES[0].id
  )
  const [editingProfile, setEditingProfile] = useState<FormulaProfile | null>(null)
  const [confirmChange, setConfirmChange] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const p = allProfiles.find(p => p.id === selectedId)
    if (p && !p.isBuiltIn) setEditingProfile({ ...p })
  }, [selectedId])

  const selectedProfile = allProfiles.find(p => p.id === selectedId)

  const handleApply = () => {
    if (!currentCalculation || !selectedId) return
    if (selectedId === currentCalculation.formulaProfileId) {
      setShowFormulaEditor(false)
      return
    }
    setConfirmChange(selectedId)
  }

  const handleConfirmChange = () => {
    if (!confirmChange) return
    changeCalculationFormula(confirmChange)
    setConfirmChange(null)
    setShowFormulaEditor(false)
  }

  const handleNewCustom = () => {
    const now = new Date().toISOString()
    const newProfile: FormulaProfile = {
      id: `custom-${Date.now()}`,
      name: 'Новый профиль',
      mode: 'custom',
      description: '',
      isBuiltIn: false,
      factorExpression: 'significance * impact',
      interactionExpression: 'ai * kj * pj',
      customFields: [],
      createdAt: now,
      updatedAt: now,
    }
    setEditingProfile(newProfile)
    setSelectedId(newProfile.id)
  }

  const handleSaveCustom = () => {
    if (!editingProfile) return
    const newErrors: Record<string, string> = {}
    if (!editingProfile.name.trim()) newErrors.name = 'Название обязательно'
    if (editingProfile.factorExpression) {
      const err = validationService.validateFormulaExpression(editingProfile.factorExpression, 'factor')
      if (err) newErrors.factorExpression = err
    }
    if (editingProfile.interactionExpression) {
      const err = validationService.validateFormulaExpression(editingProfile.interactionExpression, 'interaction')
      if (err) newErrors.interactionExpression = err
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    const updated = { ...editingProfile, updatedAt: new Date().toISOString() }
    saveFormulaProfile(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDeleteCustom = () => {
    if (!editingProfile || editingProfile.isBuiltIn) return
    if (!confirm(`Удалить профиль «${editingProfile.name}»?`)) return
    deleteFormulaProfile(editingProfile.id)
    setSelectedId(BUILT_IN_FORMULA_PROFILES[0].id)
    setEditingProfile(null)
  }

  const handleAddField = () => {
    if (!editingProfile) return
    const newField: FormulaField = {
      key: `field_${Date.now()}`,
      label: 'Новое поле',
      type: 'number',
      min: 1,
      max: 5,
      defaultValue: 3,
      step: 1,
    }
    setEditingProfile({
      ...editingProfile,
      customFields: [...(editingProfile.customFields ?? []), newField],
    })
  }

  const handleUpdateField = (idx: number, updates: Partial<FormulaField>) => {
    if (!editingProfile) return
    const fields = [...(editingProfile.customFields ?? [])]
    fields[idx] = { ...fields[idx], ...updates }
    setEditingProfile({ ...editingProfile, customFields: fields })
  }

  const handleRemoveField = (idx: number) => {
    if (!editingProfile) return
    const fields = (editingProfile.customFields ?? []).filter((_, i) => i !== idx)
    setEditingProfile({ ...editingProfile, customFields: fields })
  }

  const factorTypes: FactorType[] = ['S', 'W', 'O', 'T']

  return (
    <div className="formula-editor-overlay" onClick={() => setShowFormulaEditor(false)}>
      <div className="formula-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="formula-editor-header">
          <h2>Редактор формул</h2>
          <button className="close-btn" onClick={() => setShowFormulaEditor(false)}>✕</button>
        </div>

        {confirmChange && (
          <div className="formula-confirm-modal">
            <div className="formula-confirm-box">
              <h3>Смена формулы</h3>
              <p>
                Изменение формулы приведёт к созданию новой версии расчёта. Текущий расчёт
                будет сохранён без изменений. Новый расчёт будет создан с названием:&nbsp;
                <strong>
                  «Расчёт v
                  {(currentProject?.calculations.reduce((m, c) => Math.max(m, c.version), 0) ?? 0) + 1}»
                </strong>
                .
              </p>
              <div className="formula-confirm-actions">
                <button className="primary-btn" onClick={handleConfirmChange}>Подтвердить</button>
                <button className="ghost-btn" onClick={() => setConfirmChange(null)}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        <div className="formula-editor-body">
          <div className="formula-editor-sidebar">
            <div className="sidebar-section">
              <h4>Встроенные профили</h4>
              {BUILT_IN_FORMULA_PROFILES.map(p => (
                <button
                  key={p.id}
                  className={`profile-btn ${selectedId === p.id ? 'selected' : ''}`}
                  onClick={() => { setSelectedId(p.id); setEditingProfile(null) }}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="sidebar-section">
              <h4>Пользовательские профили</h4>
              {(currentProject?.formulaProfiles ?? []).map(p => (
                <button
                  key={p.id}
                  className={`profile-btn ${selectedId === p.id ? 'selected' : ''}`}
                  onClick={() => { setSelectedId(p.id); setEditingProfile({ ...p }) }}
                >
                  {p.name}
                </button>
              ))}
              <button className="new-profile-btn" onClick={handleNewCustom}>
                + Новый профиль
              </button>
            </div>
          </div>

          <div className="formula-editor-main">
            {editingProfile && !editingProfile.isBuiltIn ? (
              <div className="custom-profile-editor">
                <div className="field-group">
                  <label>
                    Название профиля
                    <input
                      type="text"
                      value={editingProfile.name}
                      onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })}
                      className={errors.name ? 'error-input' : ''}
                    />
                    {errors.name && <span className="error-msg">{errors.name}</span>}
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Описание
                    <textarea
                      value={editingProfile.description ?? ''}
                      onChange={e => setEditingProfile({ ...editingProfile, description: e.target.value })}
                      rows={2}
                    />
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Формула для оценки фактора
                    <span className="field-hint">Переменные: significance, impact, probability</span>
                    <input
                      type="text"
                      value={editingProfile.factorExpression ?? ''}
                      onChange={e => setEditingProfile({ ...editingProfile, factorExpression: e.target.value })}
                      className={errors.factorExpression ? 'error-input' : ''}
                      placeholder="significance * impact"
                    />
                    {errors.factorExpression && <span className="error-msg">{errors.factorExpression}</span>}
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    Формула для взаимодействия (Aij)
                    <span className="field-hint">Переменные: ai, kj, pj</span>
                    <input
                      type="text"
                      value={editingProfile.interactionExpression ?? ''}
                      onChange={e => setEditingProfile({ ...editingProfile, interactionExpression: e.target.value })}
                      className={errors.interactionExpression ? 'error-input' : ''}
                      placeholder="ai * kj * pj"
                    />
                    {errors.interactionExpression && <span className="error-msg">{errors.interactionExpression}</span>}
                  </label>
                </div>

                <div className="custom-fields-section">
                  <div className="custom-fields-header">
                    <h4>Дополнительные поля факторов</h4>
                    <button className="ghost-btn small-btn" onClick={handleAddField}>+ Добавить поле</button>
                  </div>
                  {(editingProfile.customFields ?? []).map((field, idx) => (
                    <div key={idx} className="custom-field-row">
                      <label>
                        Ключ
                        <input
                          type="text"
                          value={field.key}
                          onChange={e => handleUpdateField(idx, { key: e.target.value })}
                          placeholder="impact"
                        />
                      </label>
                      <label>
                        Метка (рус.)
                        <input
                          type="text"
                          value={field.label}
                          onChange={e => handleUpdateField(idx, { label: e.target.value })}
                          placeholder="Влияние (1-5)"
                        />
                      </label>
                      <label>
                        Мин
                        <input
                          type="number"
                          value={field.min ?? ''}
                          onChange={e => handleUpdateField(idx, { min: Number(e.target.value) })}
                        />
                      </label>
                      <label>
                        Макс
                        <input
                          type="number"
                          value={field.max ?? ''}
                          onChange={e => handleUpdateField(idx, { max: Number(e.target.value) })}
                        />
                      </label>
                      <label>
                        Применяется к типам
                        <div className="type-checkboxes">
                          {factorTypes.map(t => (
                            <label key={t} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={!field.appliesTo || field.appliesTo.includes(t)}
                                onChange={e => {
                                  const current = field.appliesTo ?? factorTypes
                                  const next = e.target.checked
                                    ? [...current, t].filter((x, i, a) => a.indexOf(x) === i)
                                    : current.filter(x => x !== t)
                                  handleUpdateField(idx, { appliesTo: next.length === 4 ? undefined : next })
                                }}
                              />
                              {t}
                            </label>
                          ))}
                        </div>
                      </label>
                      <button className="ghost-btn danger-btn" onClick={() => handleRemoveField(idx)}>
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>

                <div className="editor-actions">
                  <button className="primary-btn" onClick={handleSaveCustom}>
                    {saved ? '✓ Сохранено' : 'Сохранить профиль'}
                  </button>
                  <button className="ghost-btn danger-btn" onClick={handleDeleteCustom}>
                    Удалить профиль
                  </button>
                </div>
              </div>
            ) : (
              selectedProfile && (
                <div className="profile-view">
                  <h3>{selectedProfile.name}</h3>
                  {selectedProfile.description && (
                    <p className="profile-description">{selectedProfile.description}</p>
                  )}
                  <div className="profile-details">
                    <div className="profile-detail-item">
                      <span className="detail-label">Режим:</span>
                      <span className="detail-value">
                        {selectedProfile.mode === 'seminar' && 'Стандартный'}
                        {selectedProfile.mode === 'simplified' && 'Расширенный (индивидуальная оценка)'}
                        {selectedProfile.mode === 'custom' && 'Пользовательский'}
                      </span>
                    </div>
                    {selectedProfile.mode === 'seminar' && (
                      <div className="formula-display">
                        <strong>Формула:</strong>
                        <code>Aij = Ai × Kj × Pj</code>
                        <ul className="formula-vars">
                          <li><strong>Ai</strong> — значимость внутреннего фактора (S/W)</li>
                          <li><strong>Kj</strong> — значимость внешнего фактора (O/T)</li>
                          <li><strong>Pj</strong> — вероятность внешнего фактора (O/T)</li>
                        </ul>
                      </div>
                    )}
                    {selectedProfile.mode === 'simplified' && (
                      <div className="formula-display">
                        <strong>Формулы:</strong>
                        <code>S/W: score = значимость × влияние</code>
                        <code>O/T: score = значимость × влияние × вероятность</code>
                      </div>
                    )}
                    {selectedProfile.customFields && selectedProfile.customFields.length > 0 && (
                      <div className="profile-fields">
                        <strong>Дополнительные поля:</strong>
                        <ul>
                          {selectedProfile.customFields.map(f => (
                            <li key={f.key}>{f.label} ({f.key})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="formula-editor-footer">
          <div className="active-formula-info">
            Активная формула в текущем расчёте:&nbsp;
            <strong>
              {allProfiles.find(p => p.id === currentCalculation?.formulaProfileId)?.name ?? '—'}
            </strong>
          </div>
          <div className="footer-actions">
            {selectedId !== currentCalculation?.formulaProfileId && (
              <button className="primary-btn" onClick={handleApply}>
                Применить к текущему расчёту
              </button>
            )}
            <button className="ghost-btn" onClick={() => setShowFormulaEditor(false)}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
