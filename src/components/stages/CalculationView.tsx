import { useProjectStore } from '../../store/useProjectStore'
import './CalculationView.css'

export default function CalculationView() {
  const { currentProject } = useProjectStore()
  const factors = currentProject?.factors ?? []

  if (!currentProject) {
    return (
      <div className="calculation-view">
        <h2>Расчёт и проверка</h2>
        <p>Выберите или создайте проект на этапе 0 (Project Hub).</p>
      </div>
    )
  }


  return (
    <div className="calculation-view">
      <h2>Расчёт и проверка</h2>

      <div className="calculation-summary">
        <div className="summary-card">
          <h3>Статистика</h3>
          <p>Всего факторов: <strong>{factors.length}</strong></p>
        </div>

        <div className="summary-card">
          <h3>Типы факторов</h3>
          <div className="factor-types-list">
            <div className="factor-type-item">
              <span className="type-label">S</span>
              <span className="type-description">(Strength / Сильные стороны)</span>
              <span className="type-count">
                {factors.filter(f => f.type === 'S').length}
              </span>
            </div>
            <div className="factor-type-item">
              <span className="type-label">W</span>
              <span className="type-description">(Weakness / Слабые стороны)</span>
              <span className="type-count">
                {factors.filter(f => f.type === 'W').length}
              </span>
            </div>
            <div className="factor-type-item">
              <span className="type-label">O</span>
              <span className="type-description">(Opportunity / Возможности)</span>
              <span className="type-count">
                {factors.filter(f => f.type === 'O').length}
              </span>
            </div>
            <div className="factor-type-item">
              <span className="type-label">T</span>
              <span className="type-description">(Threat / Угрозы)</span>
              <span className="type-count">
                {factors.filter(f => f.type === 'T').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {factors.length > 0 && (
        <div className="success-message">
          ✅ Все факторы готовы! Можно переходить к следующему этапу.
        </div>
      )}

      {factors.length === 0 && (
        <div className="empty-message">
          <p>Нет факторов для проверки.</p>
          <p>Вернитесь на этап 1 и добавьте факторы.</p>
        </div>
      )}
    </div>
  )
}
