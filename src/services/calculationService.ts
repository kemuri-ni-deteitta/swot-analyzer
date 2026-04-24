import { Factor, QuadrantTotals, CategorySummary } from '../types'

export const calculationService = {
  /**
   * Рассчитывает score для факторов
   * S/W: score = significance × impact
   * O/T: score = significance × impact × probability
   */
  calculateFactorScores(factors: Factor[]): Factor[] {
    return factors.map(factor => {
      let score: number
      
      if (factor.type === 'S' || factor.type === 'W') {
        score = factor.significance * factor.impact
      } else {
        // O или T
        const probability = factor.probability ?? 1
        score = Math.round(factor.significance * factor.impact * probability * 100) / 100
      }
      
      return { ...factor, score }
    })
  },

  /**
   * Рассчитывает суммы по квадрантам
   */
  calculateQuadrantTotals(factors: Factor[]): QuadrantTotals {
    const totals: QuadrantTotals = { S: 0, W: 0, O: 0, T: 0 }
    
    factors.forEach(factor => {
      if (factor.score) {
        totals[factor.type] += factor.score
      }
    })
    
    return totals
  },

  /**
   * Рассчитывает сводку по категориям
   */
  calculateCategorySummary(factors: Factor[]): CategorySummary[] {
    const categoryMap = new Map<string, { totalScore: number; factorCount: number }>()
    
    factors.forEach(factor => {
      const existing = categoryMap.get(factor.category) || { totalScore: 0, factorCount: 0 }
      categoryMap.set(factor.category, {
        totalScore: existing.totalScore + (factor.score || 0),
        factorCount: existing.factorCount + 1,
      })
    })
    
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        totalScore: data.totalScore,
        factorCount: data.factorCount,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
  },

  /**
   * Получает топ-N факторов по score
   */
  getTopFactors(factors: Factor[], count: number = 10): Factor[] {
    return [...factors]
      .filter(f => f.score !== undefined)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, count)
  },
}
