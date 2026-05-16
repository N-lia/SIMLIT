import './App.css'
import { mountWelcomePage } from './pages/WelcomePage.jsx'
import { mountFieldOfStudyPage } from './pages/FieldOfStudyPage.jsx'
import { mountEngineeringFieldPage } from './pages/EngineeringFieldPage.jsx'
import { mountBioDataPage } from './pages/BioDataPage.jsx'
import { mountSimulationSelectPage } from './pages/SimulationSelectPage.jsx'
import { mountSimulationPage } from './pages/SimulationPage.jsx'

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

const appState = {
  history: [PAGES.welcome],
  selectedField: null,
  selectedSubfield: null,
  selectedTopic: null,
}

let rootElement = null
let cleanupCurrentPage = null

function getCurrentPage() {
  return appState.history[appState.history.length - 1]
}

function getPreviousPage() {
  return appState.history[appState.history.length - 2]
}

function navigateTo(page) {
  appState.history.push(page)
  renderCurrentPage()
}

function navigateBack() {
  if (appState.history.length > 1) {
    appState.history.pop()
    renderCurrentPage()
  }
}

function handleFieldSelect(fieldId) {
  appState.selectedField = fieldId
  if (fieldId !== 'eng') {
    appState.selectedSubfield = fieldId
  }
  navigateTo(PAGES.bioData)
}

function handleBioDataComplete() {
  if (appState.selectedField === 'eng') {
    navigateTo(PAGES.engineeringField)
  } else {
    navigateTo(PAGES.simulationSelect)
  }
}

function handleEngineeringSelect(subfieldId) {
  appState.selectedSubfield = subfieldId
  navigateTo(PAGES.simulationSelect)
}

function handleTopicSelect(topicId) {
  appState.selectedTopic = topicId
  navigateTo(PAGES.simulation)
}

function clearRoot() {
  if (!rootElement) return
  rootElement.innerHTML = ''
}

function renderCurrentPage() {
  if (!rootElement) return

  if (cleanupCurrentPage) {
    cleanupCurrentPage()
    cleanupCurrentPage = null
  }

  clearRoot()

  const currentPage = getCurrentPage()
  const prevPage = getPreviousPage()
  const isGoingBack = prevPage
    ? FLOW_ORDER.indexOf(currentPage) < FLOW_ORDER.indexOf(prevPage)
    : false
  const pageClass = isGoingBack ? 'back' : ''

  let pageRender = null

  if (currentPage === PAGES.welcome) {
    pageRender = mountWelcomePage({
      onGetStarted: () => navigateTo(PAGES.fieldOfStudy),
      pageClass,
    })
  } else if (currentPage === PAGES.fieldOfStudy) {
    pageRender = mountFieldOfStudyPage({
      onBack: navigateBack,
      onSelect: handleFieldSelect,
      pageClass,
    })
  } else if (currentPage === PAGES.engineeringField) {
    pageRender = mountEngineeringFieldPage({
      onBack: navigateBack,
      onSelect: handleEngineeringSelect,
      pageClass,
    })
  } else if (currentPage === PAGES.bioData) {
    pageRender = mountBioDataPage({
      onBack: navigateBack,
      onComplete: handleBioDataComplete,
      pageClass,
    })
  } else if (currentPage === PAGES.simulationSelect) {
    pageRender = mountSimulationSelectPage({
      subfieldId: appState.selectedSubfield,
      onBack: navigateBack,
      onSelect: handleTopicSelect,
      pageClass,
    })
  } else if (currentPage === PAGES.simulation) {
    pageRender = mountSimulationPage({
      subfieldId: appState.selectedSubfield,
      topicId: appState.selectedTopic,
      onBack: navigateBack,
      pageClass,
    })
  }

  if (!pageRender) {
    rootElement.textContent = 'Page not found.'
    return
  }

  rootElement.appendChild(pageRender.root)
  if (pageRender.cleanup) {
    cleanupCurrentPage = pageRender.cleanup
  }
}

export function startApp(root) {
  rootElement = root
  renderCurrentPage()
}
