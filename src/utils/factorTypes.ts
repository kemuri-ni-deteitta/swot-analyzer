import { FactorType } from '../types'

export const factorTypeLabels: Record<FactorType, { en: string; ru: string }> = {
  S: { en: 'Strength', ru: 'Сильные стороны' },
  W: { en: 'Weakness', ru: 'Слабые стороны' },
  O: { en: 'Opportunity', ru: 'Возможности' },
  T: { en: 'Threat', ru: 'Угрозы' },
}

/**
 * Получить отформатированную строку типа фактора с переводом
 * @param type Тип фактора
 * @returns Строка вида "S (Strength / Сильные стороны)"
 */
export function getFactorTypeLabel(type: FactorType): string {
  const label = factorTypeLabels[type]
  return `${type} (${label.en} / ${label.ru})`
}

/**
 * Получить короткую метку типа фактора для выпадающего списка
 * @param type Тип фактора
 * @returns Строка вида "S - Strength (Сильные стороны)"
 */
export function getFactorTypeShortLabel(type: FactorType): string {
  const label = factorTypeLabels[type]
  return `${type} - ${label.en} (${label.ru})`
}
