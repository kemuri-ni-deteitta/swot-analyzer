import { Factor, Strategy } from '../types'
import { calculationService } from './calculationService'

export const strategyService = {
  /**
   * Генерирует стратегии SO/WO/ST/WT на основе топ факторов
   */
  generateStrategies(factors: Factor[], topCount: number = 5): Strategy[] {
    const topFactors = calculationService.getTopFactors(factors, topCount)
    
    const strengths = topFactors.filter(f => f.type === 'S')
    const weaknesses = topFactors.filter(f => f.type === 'W')
    const opportunities = topFactors.filter(f => f.type === 'O')
    const threats = topFactors.filter(f => f.type === 'T')

    const strategies: Strategy[] = []
    
    // Используем до 3 факторов каждого типа для стратегий
    const maxFactorsPerType = 3

    // SO стратегии (Strengths + Opportunities)
    if (strengths.length > 0 && opportunities.length > 0) {
      strategies.push({
        id: `so-${Date.now()}-${Math.random()}`,
        type: 'SO',
        title: 'Использовать сильные стороны для возможностей',
        description: this.generateStrategyDescription(strengths, opportunities),
        factors: [...strengths.slice(0, maxFactorsPerType), ...opportunities.slice(0, maxFactorsPerType)],
      })
    }

    // WO стратегии (Weaknesses + Opportunities)
    if (weaknesses.length > 0 && opportunities.length > 0) {
      strategies.push({
        id: `wo-${Date.now()}-${Math.random()}`,
        type: 'WO',
        title: 'Преодолеть слабости через возможности',
        description: this.generateStrategyDescription(weaknesses, opportunities),
        factors: [...weaknesses.slice(0, maxFactorsPerType), ...opportunities.slice(0, maxFactorsPerType)],
      })
    }

    // ST стратегии (Strengths + Threats)
    if (strengths.length > 0 && threats.length > 0) {
      strategies.push({
        id: `st-${Date.now()}-${Math.random()}`,
        type: 'ST',
        title: 'Использовать сильные стороны против угроз',
        description: this.generateStrategyDescription(strengths, threats),
        factors: [...strengths.slice(0, maxFactorsPerType), ...threats.slice(0, maxFactorsPerType)],
      })
    }

    // WT стратегии (Weaknesses + Threats)
    if (weaknesses.length > 0 && threats.length > 0) {
      strategies.push({
        id: `wt-${Date.now()}-${Math.random()}`,
        type: 'WT',
        title: 'Минимизировать слабости и угрозы',
        description: this.generateStrategyDescription(weaknesses, threats),
        factors: [...weaknesses.slice(0, maxFactorsPerType), ...threats.slice(0, maxFactorsPerType)],
      })
    }

    return strategies
  },

  /**
   * Генерирует описание стратегии на основе факторов
   */
  generateStrategyDescription(factors1: Factor[], factors2: Factor[]): string {
    const f1Text = factors1.map(f => f.text).join(', ')
    const f2Text = factors2.map(f => f.text).join(', ')
    
    if (factors1.length === 0 || factors2.length === 0) {
      return `Комбинация факторов: ${f1Text || f2Text}`
    }
    
    return `Комбинация факторов: ${f1Text} и ${f2Text}`
  },
  
  /**
   * Получает подробное описание типа стратегии
   */
  getStrategyTypeDescription(type: 'SO' | 'WO' | 'ST' | 'WT'): string {
    const descriptions = {
      SO: 'Агрессивная стратегия: используйте внутренние сильные стороны для максимального использования внешних возможностей. Это стратегия роста и экспансии.',
      WO: 'Оборонительная стратегия: используйте внешние возможности для преодоления внутренних слабостей. Фокус на улучшении и развитии.',
      ST: 'Защитная стратегия: используйте внутренние сильные стороны для защиты от внешних угроз. Стратегия стабильности и защиты позиций.',
      WT: 'Стратегия минимизации: минимизируйте влияние комбинации слабостей и угроз. Критическая стратегия выживания.',
    }
    return descriptions[type]
  },
  
  /**
   * Рассчитывает приоритет стратегии на основе score факторов
   */
  calculateStrategyPriority(strategy: Strategy): number {
    const totalScore = strategy.factors.reduce((sum, f) => sum + (f.score || 0), 0)
    return totalScore
  },
  
  /**
   * Анализирует доступность факторов для генерации стратегий
   */
  analyzeFactorAvailability(factors: Factor[], topCount: number): {
    topFactors: Factor[]
    strengths: number
    weaknesses: number
    opportunities: number
    threats: number
    canGenerateSO: boolean
    canGenerateWO: boolean
    canGenerateST: boolean
    canGenerateWT: boolean
    missingTypes: string[]
  } {
    const topFactors = calculationService.getTopFactors(factors, topCount)
    
    const strengths = topFactors.filter(f => f.type === 'S')
    const weaknesses = topFactors.filter(f => f.type === 'W')
    const opportunities = topFactors.filter(f => f.type === 'O')
    const threats = topFactors.filter(f => f.type === 'T')
    
    const canGenerateSO = strengths.length > 0 && opportunities.length > 0
    const canGenerateWO = weaknesses.length > 0 && opportunities.length > 0
    const canGenerateST = strengths.length > 0 && threats.length > 0
    const canGenerateWT = weaknesses.length > 0 && threats.length > 0
    
    const missingTypes: string[] = []
    if (strengths.length === 0 && weaknesses.length === 0) {
      missingTypes.push('нет внутренних факторов (S или W)')
    }
    if (opportunities.length === 0 && threats.length === 0) {
      missingTypes.push('нет внешних факторов (O или T)')
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
    }
  },
}
