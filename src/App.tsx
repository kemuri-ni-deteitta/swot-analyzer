import MainWindow from './components/MainWindow'
import { ThemeProvider } from './contexts/ThemeContext'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <MainWindow />
    </ThemeProvider>
  )
}

export default App
