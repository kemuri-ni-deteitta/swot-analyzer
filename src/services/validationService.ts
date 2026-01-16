import { Factor, Project, ValidationError } from '../types'

export const validationService = {
  /**
   * Валидирует один фактор
   */
  validateFactor(factor: Factor): ValidationError[] {
    const errors: ValidationError[] = []

    // type обязателен
    if (!factor.type || !['S', 'W', 'O', 'T'].includes(factor.type)) {
      errors.push({
        factorId: factor.id,
        field: 'type',
        message: 'Тип фактора обязателен (S/W/O/T)',
      })
    }

    // text обязателен
    if (!factor.text || factor.text.trim() === '') {
      errors.push({
        factorId: factor.id,
        field: 'text',
        message: 'Текст фактора обязателен',
      })
    }

    // category обязателен
    if (!factor.category || factor.category.trim() === '') {
      errors.push({
        factorId: factor.id,
        field: 'category',
        message: 'Категория обязательна',
      })
    }

    // significance: 1..5
    if (factor.significance < 1 || factor.significance > 5) {
      errors.push({
        factorId: factor.id,
        field: 'significance',
        message: 'Значимость должна быть от 1 до 5',
      })
    }

    // impact: 1..5
    if (factor.impact < 1 || factor.impact > 5) {
      errors.push({
        factorId: factor.id,
        field: 'impact',
        message: 'Влияние должно быть от 1 до 5',
      })
    }

    // probability обязательна для O/T и должна быть 1..5
    if (factor.type === 'O' || factor.type === 'T') {
      if (factor.probability === undefined || factor.probability === null) {
        errors.push({
          factorId: factor.id,
          field: 'probability',
          message: 'Вероятность обязательна для возможностей и угроз',
        })
      } else if (factor.probability < 1 || factor.probability > 5) {
        errors.push({
          factorId: factor.id,
          field: 'probability',
          message: 'Вероятность должна быть от 1 до 5',
        })
      }
    }

    return errors
  },

  /**
   * Валидирует весь проект
   */
  validateProject(project: Project): Record<string, string[]> {
    const errors: Record<string, string[]> = {}

    project.factors.forEach(factor => {
      const factorErrors = this.validateFactor(factor)
      if (factorErrors.length > 0) {
        errors[factor.id] = factorErrors.map(e => e.message)
      }
    })

    return errors
  },
}
