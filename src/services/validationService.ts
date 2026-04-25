import { Factor, Project, Calculation, FormulaProfile, ValidationError } from '../types'

export const validationService = {
  validateFactor(factor: Factor, profile: FormulaProfile): ValidationError[] {
    const errors: ValidationError[] = []

    if (!factor.type || !['S', 'W', 'O', 'T'].includes(factor.type)) {
      errors.push({ factorId: factor.id, field: 'type', message: 'Тип фактора обязателен (S/W/O/T)' })
    }

    if (!factor.text || factor.text.trim() === '') {
      errors.push({ factorId: factor.id, field: 'text', message: 'Текст фактора обязателен' })
    }

    if (!factor.category || factor.category.trim() === '') {
      errors.push({ factorId: factor.id, field: 'category', message: 'Категория обязательна' })
    }

    if (factor.significance < 1 || factor.significance > 5) {
      errors.push({ factorId: factor.id, field: 'significance', message: 'Значимость должна быть от 1 до 5' })
    }

    // impact only required for simplified or custom formulas that use it
    const needsImpact =
      profile.mode === 'simplified' ||
      (profile.mode === 'custom' && (
        profile.factorExpression?.includes('impact') ||
        profile.interactionExpression?.includes('impact') ||
        profile.customFields?.some(f => f.key === 'impact')
      ))

    if (needsImpact) {
      const impact = factor.impact ?? factor.customFieldValues?.['impact']
      if (impact === undefined || impact === null) {
        errors.push({ factorId: factor.id, field: 'impact', message: 'Влияние обязательно для выбранной формулы' })
      } else if (impact < 1 || impact > 5) {
        errors.push({ factorId: factor.id, field: 'impact', message: 'Влияние должно быть от 1 до 5' })
      }
    }

    if (factor.type === 'O' || factor.type === 'T') {
      if (factor.probability === undefined || factor.probability === null) {
        errors.push({ factorId: factor.id, field: 'probability', message: 'Вероятность обязательна для возможностей и угроз' })
      } else if (factor.probability < 0 || factor.probability > 1) {
        errors.push({ factorId: factor.id, field: 'probability', message: 'Вероятность должна быть от 0 до 1' })
      }
    }

    // Validate custom fields
    if (profile.customFields) {
      for (const field of profile.customFields) {
        if (field.key === 'impact') continue // handled above
        const applies = !field.appliesTo || field.appliesTo.includes(factor.type)
        if (!applies) continue
        const val = factor.customFieldValues?.[field.key]
        if (val === undefined) continue
        if (field.min !== undefined && val < field.min) {
          errors.push({ factorId: factor.id, field: field.key, message: `${field.label} должно быть не меньше ${field.min}` })
        }
        if (field.max !== undefined && val > field.max) {
          errors.push({ factorId: factor.id, field: field.key, message: `${field.label} должно быть не больше ${field.max}` })
        }
      }
    }

    return errors
  },

  validateCalculation(calculation: Calculation): Record<string, string[]> {
    const errors: Record<string, string[]> = {}
    const profile = calculation.formulaProfileSnapshot
    calculation.factors.forEach(factor => {
      const factorErrors = this.validateFactor(factor, profile)
      if (factorErrors.length > 0) {
        errors[factor.id] = factorErrors.map(e => e.message)
      }
    })
    return errors
  },

  validateProject(project: Project): Record<string, string[]> {
    const calc = project.calculations.find(c => c.id === project.activeCalculationId)
    if (!calc) return {}
    return this.validateCalculation(calc)
  },

  validateFormulaExpression(
    expression: string,
    mode: 'factor' | 'interaction'
  ): string | null {
    if (!expression.trim()) return 'Выражение не может быть пустым'
    const sampleVars =
      mode === 'factor'
        ? { significance: 3, impact: 3, probability: 0.5 }
        : { ai: 3, kj: 3, pj: 0.5 }
    const sanitized = expression.trim()
    if (!/^[\w\s+\-*/.()\d]+$/.test(sanitized)) {
      return 'Формула содержит недопустимые символы'
    }
    try {
      const varNames = Object.keys(sampleVars)
      const varValues = Object.values(sampleVars)
      // eslint-disable-next-line no-new-func
      const fn = new Function(...varNames, `return (${sanitized})`)
      const result = fn(...varValues)
      if (typeof result !== 'number' || !isFinite(result)) {
        return 'Формула вернула некорректное значение'
      }
      return null
    } catch {
      return 'Ошибка синтаксиса формулы'
    }
  },
}
