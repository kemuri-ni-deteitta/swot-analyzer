import {
  Factor,
  Interaction,
  QuadrantTotals,
  InteractionTotals,
  CategorySummary,
  FormulaProfile,
} from '../types'

function evaluateExpression(expr: string, vars: Record<string, number>): number {
  const varNames = Object.keys(vars)
  const varValues = varNames.map(k => vars[k])
  const sanitized = expr.trim()
  if (!/^[\w\s+\-*/.()\d]+$/.test(sanitized)) {
    throw new Error('Формула содержит недопустимые символы')
  }
  // eslint-disable-next-line no-new-func
  const fn = new Function(...varNames, `return (${sanitized})`)
  const result = fn(...varValues)
  if (typeof result !== 'number' || !isFinite(result)) {
    throw new Error('Формула вернула некорректное значение')
  }
  return result
}

export const calculationService = {
  calculateInteractionScores(
    factors: Factor[],
    interactions: Interaction[],
    profile: FormulaProfile
  ): Interaction[] {
    return interactions.map(interaction => {
      const internalFactor = factors.find(f => f.id === interaction.internalFactorId)
      const externalFactor = factors.find(f => f.id === interaction.externalFactorId)
      if (!internalFactor || !externalFactor) return interaction

      let score = 0
      try {
        if (profile.mode === 'seminar') {
          const Ai = internalFactor.significance
          const Kj = externalFactor.significance
          const Pj = externalFactor.probability ?? 1
          score = Math.round(Ai * Kj * Pj * 100) / 100
        } else if (profile.mode === 'simplified') {
          const internalScore =
            internalFactor.significance * (internalFactor.impact ?? 1)
          const externalScore =
            externalFactor.significance *
            (externalFactor.impact ?? 1) *
            (externalFactor.probability ?? 1)
          score = Math.round(internalScore * externalScore * 100) / 100
        } else if (profile.mode === 'custom' && profile.interactionExpression) {
          const vars: Record<string, number> = {
            ai: internalFactor.significance,
            kj: externalFactor.significance,
            pj: externalFactor.probability ?? 1,
            ...(internalFactor.customFieldValues ?? {}),
            ...(externalFactor.customFieldValues ?? {}),
          }
          score = evaluateExpression(profile.interactionExpression, vars)
        }
      } catch {
        score = 0
      }

      return { ...interaction, score: Math.round(score * 100) / 100 }
    })
  },

  calculateFactorScores(
    factors: Factor[],
    interactions: Interaction[],
    profile: FormulaProfile
  ): Factor[] {
    if (profile.mode === 'seminar') {
      return factors.map(factor => {
        let score = 0
        if (factor.type === 'S' || factor.type === 'W') {
          score = factor.significance
        } else {
          score = Math.round((factor.significance * (factor.probability ?? 1)) * 100) / 100
        }
        return { ...factor, score }
      })
    }

    if (profile.mode === 'custom' && profile.interactionExpression) {
      return factors.map(factor => {
        const related = interactions.filter(
          i => i.internalFactorId === factor.id || i.externalFactorId === factor.id
        )
        const score = Math.round(
          related.reduce((sum, i) => sum + (i.score ?? 0), 0) * 100
        ) / 100
        return { ...factor, score }
      })
    }

    // simplified or custom with factor-level expression
    return factors.map(factor => {
      let score = 0
      try {
        if (profile.mode === 'simplified') {
          if (factor.type === 'S' || factor.type === 'W') {
            score = factor.significance * (factor.impact ?? 1)
          } else {
            score = Math.round(
              factor.significance * (factor.impact ?? 1) * (factor.probability ?? 1) * 100
            ) / 100
          }
        } else if (profile.mode === 'custom' && profile.factorExpression) {
          const vars: Record<string, number> = {
            significance: factor.significance,
            impact: factor.impact ?? 1,
            probability: factor.probability ?? 1,
            ...(factor.customFieldValues ?? {}),
          }
          score = evaluateExpression(profile.factorExpression, vars)
        }
      } catch {
        score = 0
      }
      return { ...factor, score: Math.round(score * 100) / 100 }
    })
  },

  calculateQuadrantTotals(factors: Factor[]): QuadrantTotals {
    const totals: QuadrantTotals = { S: 0, W: 0, O: 0, T: 0 }
    factors.forEach(factor => {
      if (factor.score) totals[factor.type] += factor.score
    })
    return totals
  },

  calculateInteractionTotals(
    factors: Factor[],
    interactions: Interaction[]
  ): InteractionTotals {
    const totals: InteractionTotals = { SO: 0, WT: 0 }
    interactions.forEach(interaction => {
      const internal = factors.find(f => f.id === interaction.internalFactorId)
      const external = factors.find(f => f.id === interaction.externalFactorId)
      if (!internal || !external || !interaction.score) return

      const key = `${internal.type}${external.type}` as keyof InteractionTotals
      if (key in totals) {
        totals[key] += interaction.score
      }
    })
    // Round
    totals.SO = Math.round(totals.SO * 100) / 100
    totals.WT = Math.round(totals.WT * 100) / 100
    return totals
  },

  calculateCategorySummary(factors: Factor[]): CategorySummary[] {
    const categoryMap = new Map<string, { totalScore: number; factorCount: number }>()
    factors.forEach(factor => {
      const existing = categoryMap.get(factor.category) || {
        totalScore: 0,
        factorCount: 0,
      }
      categoryMap.set(factor.category, {
        totalScore: existing.totalScore + (factor.score || 0),
        factorCount: existing.factorCount + 1,
      })
    })
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.totalScore - a.totalScore)
  },

  getTopFactors(factors: Factor[], count = 10): Factor[] {
    return [...factors]
      .filter(f => f.score !== undefined)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, count)
  },

  getTopInteractions(
    factors: Factor[],
    interactions: Interaction[],
    quadrant: 'SO' | 'WO' | 'ST' | 'WT',
    count = 3
  ): Interaction[] {
    const [internalType, externalType] = quadrant.split('') as [string, string]
    return interactions
      .filter(i => {
        const internal = factors.find(f => f.id === i.internalFactorId)
        const external = factors.find(f => f.id === i.externalFactorId)
        return internal?.type === internalType && external?.type === externalType && (i.score ?? 0) > 0
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, count)
  },

  validateExpression(expr: string, sampleVars: Record<string, number>): string | null {
    try {
      const result = evaluateExpression(expr, sampleVars)
      if (typeof result !== 'number' || !isFinite(result)) {
        return 'Формула вернула некорректное значение'
      }
      return null
    } catch (err) {
      return err instanceof Error ? err.message : 'Ошибка в формуле'
    }
  },
}
