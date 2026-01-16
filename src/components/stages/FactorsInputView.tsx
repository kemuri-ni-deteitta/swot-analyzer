import { useProjectStore } from '../../store/useProjectStore'
import { FactorForm } from '../widgets/FactorForm'
import { FactorTable } from '../widgets/FactorTable'
import './FactorsInputView.css'

export default function FactorsInputView() {
  const { currentProject, addFactor, updateFactor, deleteFactor } = useProjectStore()
  const factors = currentProject?.factors ?? []

  if (!currentProject) {
    return (
      <div className="factors-view">
        <h2>Ввод факторов</h2>
        <p>Выберите или создайте проект на этапе 0 (Project Hub).</p>
      </div>
    )
  }

  return (
    <div className="factors-view">
        <div>
          <h2>Ввод факторов</h2>
          <p>Добавляйте и редактируйте факторы. Ошибочные строки подсвечиваются.</p>
        </div>

        <FactorForm onSubmit={addFactor} />

        <FactorTable
          factors={factors}
          errors={{}}
          onUpdate={updateFactor}
          onDelete={deleteFactor}
        />
    </div>
  )
}
