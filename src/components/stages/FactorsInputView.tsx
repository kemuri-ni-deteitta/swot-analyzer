import { useProjectStore } from '../../store/useProjectStore'
import { FactorForm } from '../widgets/FactorForm'
import { FactorTable } from '../widgets/FactorTable'
import './FactorsInputView.css'

export default function FactorsInputView() {
  const { currentProject, currentCalculation, addFactor, updateFactor, deleteFactor, setShowFormulaEditor } = useProjectStore()

  if (!currentProject || !currentCalculation) {
    return (
      <div className="factors-view">
        <h2>Ввод факторов</h2>
        <p>Выберите расчёт на этапе «Расчёты».</p>
      </div>
    )
  }

  const profile = currentCalculation.formulaProfileSnapshot
  const factors = currentCalculation.factors

  return (
    <div className="factors-view">
      <div className="factors-header">
        <div>
          <h2>Ввод факторов — {currentCalculation.name}</h2>
          <p>
            Активная формула: <strong>{profile.name}</strong>
          </p>
        </div>
        <button className="ghost-btn" onClick={() => setShowFormulaEditor(true)}>
          Редактировать формулы
        </button>
      </div>

      <FactorForm onSubmit={addFactor} profile={profile} />

      <FactorTable
        factors={factors}
        profile={profile}
        errors={{}}
        onUpdate={updateFactor}
        onDelete={deleteFactor}
      />
    </div>
  )
}
