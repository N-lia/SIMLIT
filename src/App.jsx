import { useState, useCallback } from 'react'
import WelcomePage from './pages/WelcomePage'
import FieldOfStudyPage from './pages/FieldOfStudyPage'
import EngineeringFieldPage from './pages/EngineeringFieldPage'
import BioDataPage from './pages/BioDataPage'
import SimulationSelectPage from './pages/SimulationSelectPage'
import SimulationPage from './pages/SimulationPage'
import './App.css'

const PAGES = {
  welcome:          'welcome',
  fieldOfStudy:     'fieldOfStudy',
  engineeringField: 'engineeringField',
  bioData:          'bioData',
  simulationSelect: 'simulationSelect',
  simulation:       'simulation',
}

const FLOW_ORDER = [
  PAGES.welcome,
  PAGES.fieldOfStudy,
  PAGES.bioData,
  PAGES.engineeringField,
  PAGES.simulationSelect,
  PAGES.simulation,
]

function App() {
  const [history, setHistory]               = useState([PAGES.welcome])
  const [selectedField, setSelectedField]   = useState(null)
  const [selectedSubfield, setSelectedSubfield] = useState(null)
  const [selectedTopic, setSelectedTopic]   = useState(null)

  const currentPage = history[history.length - 1]
  const prevPage    = history[history.length - 2]

  const navigateTo = useCallback((page) => {
    setHistory(prev => [...prev, page])
  }, [])

  const navigateBack = useCallback(() => {
    setHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev)
  }, [])

  // Determine animation direction
  const isGoingBack = prevPage
    ? FLOW_ORDER.indexOf(currentPage) < FLOW_ORDER.indexOf(prevPage)
    : false
  const pageClass = isGoingBack ? 'back' : ''

  // Handlers
  const handleFieldSelect = useCallback((fieldId) => {
    setSelectedField(fieldId)
    if (fieldId !== 'eng') {
      setSelectedSubfield(fieldId) // non-eng: subfield key = field key
    }
    // Everyone goes to BioData first
    navigateTo(PAGES.bioData)
  }, [navigateTo])

  const handleBioDataComplete = useCallback(() => {
    // Engineering needs specialization choice before topic select
    if (selectedField === 'eng') {
      navigateTo(PAGES.engineeringField)
    } else {
      navigateTo(PAGES.simulationSelect)
    }
  }, [navigateTo, selectedField])

  const handleEngineeringSelect = useCallback((subfieldId) => {
    setSelectedSubfield(subfieldId)
    navigateTo(PAGES.simulationSelect)
  }, [navigateTo])

  const handleTopicSelect = useCallback((topicId) => {
    setSelectedTopic(topicId)
    navigateTo(PAGES.simulation)
  }, [navigateTo])

  return (
    <div className="phone-frame">
      {currentPage === PAGES.welcome && (
        <WelcomePage onGetStarted={() => navigateTo(PAGES.fieldOfStudy)} />
      )}
      {currentPage === PAGES.fieldOfStudy && (
        <FieldOfStudyPage onBack={navigateBack} onSelect={handleFieldSelect} pageClass={pageClass} />
      )}
      {currentPage === PAGES.engineeringField && (
        <EngineeringFieldPage onBack={navigateBack} onSelect={handleEngineeringSelect} pageClass={pageClass} />
      )}
      {currentPage === PAGES.bioData && (
        <BioDataPage onBack={navigateBack} onComplete={handleBioDataComplete} pageClass={pageClass} />
      )}
      {currentPage === PAGES.simulationSelect && (
        <SimulationSelectPage
          subfieldId={selectedSubfield}
          onBack={navigateBack}
          onSelect={handleTopicSelect}
          pageClass={pageClass}
        />
      )}
      {currentPage === PAGES.simulation && (
        <SimulationPage
          subfieldId={selectedSubfield}
          topicId={selectedTopic}
          onBack={navigateBack}
          pageClass={pageClass}
        />
      )}
    </div>
  )
}

export default App
