import { FormulaProfile } from '../types'

export const BUILT_IN_FORMULA_PROFILES: FormulaProfile[] = [
  {
    id: 'seminar',
    name: 'Стандартная (Aij = Ai × Kj × Pj)',
    mode: 'seminar',
    description:
      'Базовая методология SWOT-анализа. Оценка рассчитывается как произведение значимости внутреннего фактора (S/W) и оценки внешнего фактора (O/T).\n\nAi — значимость внутреннего фактора (сильной или слабой стороны),\nKj — значимость внешнего фактора (возможности или угрозы),\nPj — вероятность наступления внешнего фактора.\n\nИтоговая оценка Aij показывает значимость сочетания внутреннего и внешнего факторов и используется для выявления наиболее важных стратегических направлений.',
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'simplified',
    name: 'Расширенная (score = значимость × влияние)',
    mode: 'simplified',
    description:
      'Расширенная формула с индивидуальной оценкой факторов. S/W: score = значимость × влияние; O/T: score = значимость × влияние × вероятность.',
    isBuiltIn: true,
    customFields: [
      {
        key: 'impact',
        label: 'Влияние (1-5)',
        type: 'number',
        min: 1,
        max: 5,
        defaultValue: 3,
        step: 1,
      },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
]

export const DEFAULT_FORMULA_ID = 'seminar'

export function getFormulaProfile(
  id: string,
  customProfiles: FormulaProfile[]
): FormulaProfile | undefined {
  return (
    BUILT_IN_FORMULA_PROFILES.find(p => p.id === id) ||
    customProfiles.find(p => p.id === id)
  )
}

export function getAllProfiles(customProfiles: FormulaProfile[]): FormulaProfile[] {
  return [...BUILT_IN_FORMULA_PROFILES, ...customProfiles]
}
