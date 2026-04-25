import { Factor, Interaction, Strategy, FormulaProfile } from '../types'
import { calculationService } from './calculationService'

export const strategyService = {
  generateStrategies(
    factors: Factor[],
    interactions: Interaction[],
    profile: FormulaProfile,
    topCount: number = 5
  ): Strategy[] {
    if (profile.mode === 'seminar' || (profile.mode === 'custom' && profile.interactionExpression)) {
      return this.generateStrategiesFromInteractions(factors, interactions, topCount)
    }
    return this.generateStrategiesFromFactors(factors, topCount)
  },

  generateStrategiesFromInteractions(
    factors: Factor[],
    interactions: Interaction[],
    topCount: number
  ): Strategy[] {
    const strategies: Strategy[] = []
    const maxPerQuadrant = 3
    const quadrants: Array<'SO' | 'WO' | 'ST' | 'WT'> = ['SO', 'WO', 'ST', 'WT']

    const titles: Record<string, string> = {
      SO: 'Использовать сильные стороны для возможностей',
      WO: 'Преодолеть слабости через возможности',
      ST: 'Использовать сильные стороны против угроз',
      WT: 'Минимизировать слабости и угрозы',
    }

    for (const quadrant of quadrants) {
      const topInteractions = calculationService.getTopInteractions(
        factors, interactions, quadrant, topCount
      )
      if (topInteractions.length === 0) continue

      const internalIds = new Set(topInteractions.map(i => i.internalFactorId))
      const externalIds = new Set(topInteractions.map(i => i.externalFactorId))

      const internalFactors = factors
        .filter(f => internalIds.has(f.id))
        .slice(0, maxPerQuadrant)
      const externalFactors = factors
        .filter(f => externalIds.has(f.id))
        .slice(0, maxPerQuadrant)

      if (internalFactors.length === 0 || externalFactors.length === 0) continue

      const interactionScore = topInteractions.reduce((s, i) => s + (i.score ?? 0), 0)

      strategies.push({
        id: `${quadrant.toLowerCase()}-${Date.now()}-${Math.random()}`,
        type: quadrant,
        title: titles[quadrant],
        description: this.generateStrategyDescription(internalFactors, externalFactors),
        factors: [...internalFactors, ...externalFactors],
        interactionScore: Math.round(interactionScore * 100) / 100,
      })
    }

    return strategies
  },

  generateStrategiesFromFactors(factors: Factor[], topCount: number): Strategy[] {
    const topFactors = calculationService.getTopFactors(factors, topCount)
    const strengths = topFactors.filter(f => f.type === 'S')
    const weaknesses = topFactors.filter(f => f.type === 'W')
    const opportunities = topFactors.filter(f => f.type === 'O')
    const threats = topFactors.filter(f => f.type === 'T')
    const strategies: Strategy[] = []
    const max = 3

    if (strengths.length > 0 && opportunities.length > 0) {
      strategies.push({
        id: `so-${Date.now()}-${Math.random()}`,
        type: 'SO',
        title: 'Использовать сильные стороны для возможностей',
        description: this.generateStrategyDescription(strengths, opportunities),
        factors: [...strengths.slice(0, max), ...opportunities.slice(0, max)],
      })
    }
    if (weaknesses.length > 0 && opportunities.length > 0) {
      strategies.push({
        id: `wo-${Date.now()}-${Math.random()}`,
        type: 'WO',
        title: 'Преодолеть слабости через возможности',
        description: this.generateStrategyDescription(weaknesses, opportunities),
        factors: [...weaknesses.slice(0, max), ...opportunities.slice(0, max)],
      })
    }
    if (strengths.length > 0 && threats.length > 0) {
      strategies.push({
        id: `st-${Date.now()}-${Math.random()}`,
        type: 'ST',
        title: 'Использовать сильные стороны против угроз',
        description: this.generateStrategyDescription(strengths, threats),
        factors: [...strengths.slice(0, max), ...threats.slice(0, max)],
      })
    }
    if (weaknesses.length > 0 && threats.length > 0) {
      strategies.push({
        id: `wt-${Date.now()}-${Math.random()}`,
        type: 'WT',
        title: 'Минимизировать слабости и угрозы',
        description: this.generateStrategyDescription(weaknesses, threats),
        factors: [...weaknesses.slice(0, max), ...threats.slice(0, max)],
      })
    }

    return strategies
  },

  generateStrategyDescription(factors1: Factor[], factors2: Factor[]): string {
    const f1Text = factors1.map(f => f.text).join(', ')
    const f2Text = factors2.map(f => f.text).join(', ')
    if (!f1Text || !f2Text) return `Комбинация факторов: ${f1Text || f2Text}`
    return `Комбинация факторов: ${f1Text} и ${f2Text}`
  },

  getStrategyTypeDescription(type: 'SO' | 'WO' | 'ST' | 'WT'): string {
    const descriptions = {
      SO: 'Агрессивная стратегия: используйте внутренние сильные стороны для максимального использования внешних возможностей. Это стратегия роста и экспансии.',
      WO: 'Оборонительная стратегия: используйте внешние возможности для преодоления внутренних слабостей. Фокус на улучшении и развитии.',
      ST: 'Защитная стратегия: используйте внутренние сильные стороны для защиты от внешних угроз. Стратегия стабильности и защиты позиций.',
      WT: 'Стратегия минимизации: минимизируйте влияние комбинации слабостей и угроз. Критическая стратегия выживания.',
    }
    return descriptions[type]
  },

  calculateStrategyPriority(strategy: Strategy): number {
    if (strategy.interactionScore !== undefined) return strategy.interactionScore
    return strategy.factors.reduce((sum, f) => sum + (f.score || 0), 0)
  },

  analyzeFactorAvailability(
    factors: Factor[],
    interactions: Interaction[],
    profile: FormulaProfile,
    topCount: number
  ) {
    const useSeminar =
      profile.mode === 'seminar' ||
      (profile.mode === 'custom' && !!profile.interactionExpression)

    let topFactors: Factor[] = []
    let topInteractionsBySeminar = {
      SO: calculationService.getTopInteractions(factors, interactions, 'SO', topCount),
      WO: calculationService.getTopInteractions(factors, interactions, 'WO', topCount),
      ST: calculationService.getTopInteractions(factors, interactions, 'ST', topCount),
      WT: calculationService.getTopInteractions(factors, interactions, 'WT', topCount),
    }

    if (useSeminar) {
      topFactors = factors
    } else {
      topFactors = calculationService.getTopFactors(factors, topCount)
    }

    const strengths = topFactors.filter(f => f.type === 'S')
    const weaknesses = topFactors.filter(f => f.type === 'W')
    const opportunities = topFactors.filter(f => f.type === 'O')
    const threats = topFactors.filter(f => f.type === 'T')

    const canGenerateSO = useSeminar
      ? topInteractionsBySeminar.SO.length > 0
      : strengths.length > 0 && opportunities.length > 0
    const canGenerateWO = useSeminar
      ? topInteractionsBySeminar.WO.length > 0
      : weaknesses.length > 0 && opportunities.length > 0
    const canGenerateST = useSeminar
      ? topInteractionsBySeminar.ST.length > 0
      : strengths.length > 0 && threats.length > 0
    const canGenerateWT = useSeminar
      ? topInteractionsBySeminar.WT.length > 0
      : weaknesses.length > 0 && threats.length > 0

    const missingTypes: string[] = []
    if (!useSeminar) {
      if (strengths.length === 0 && weaknesses.length === 0) {
        missingTypes.push('нет внутренних факторов (S или W)')
      }
      if (opportunities.length === 0 && threats.length === 0) {
        missingTypes.push('нет внешних факторов (O или T)')
      }
    } else {
      const hasInteractions = interactions.some(i => (i.score ?? 0) > 0)
      if (!hasInteractions) {
        missingTypes.push('нет ненулевых взаимодействий — заполните матрицу коэффициентов')
      }
    }

    return {
      topFactors,
      strengths: strengths.length,
      weaknesses: weaknesses.length,
      opportunities: opportunities.length,
      threats: threats.length,
      canGenerateSO,
      canGenerateWO,
      canGenerateST,
      canGenerateWT,
      missingTypes,
      useSeminar,
    }
  },
}
