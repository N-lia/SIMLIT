import './App.css'
import { mountLandingPage } from './pages/LandingPage.jsx'
import { mountGetNowPage } from './pages/GetNowPage.jsx'
import { mountWelcomePage } from './pages/WelcomePage.jsx'
import { mountFieldOfStudyPage } from './pages/FieldOfStudyPage.jsx'
import { mountEngineeringFieldPage } from './pages/EngineeringFieldPage.jsx'
import { mountBioDataPage } from './pages/BioDataPage.jsx'
import { mountSimulationSelectPage } from './pages/SimulationSelectPage.jsx'
import { mountSimulationPage } from './pages/SimulationPage.jsx'
import { mountTarotCardsPage } from './pages/TarotCardsPage.jsx'
import { mountMyNotesPage } from './pages/MyNotesPage.jsx'

const PAGES = {
  landing:          'landing',
  getNow:           'getNow',
  welcome:          'welcome',
  fieldOfStudy:     'fieldOfStudy',
  engineeringField: 'engineeringField',
  bioData:          'bioData',
  simulationSelect: 'simulationSelect',
  simulation:       'simulation',
  tarotCards:       'tarotCards',
  myNotes:          'myNotes',
}

const FLOW_ORDER = [
  PAGES.landing,
  PAGES.getNow,
  PAGES.welcome,
  PAGES.fieldOfStudy,
  PAGES.bioData,
  PAGES.engineeringField,
  PAGES.simulationSelect,
  PAGES.tarotCards,
  PAGES.myNotes,
  PAGES.simulation,
]

const appState = {
  history: [PAGES.landing],
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

function handleViewCards() {
  navigateTo(PAGES.tarotCards)
}

function handleOpenNotes() {
  navigateTo(PAGES.myNotes)
}

function startDemo() {
  appState.selectedField = null
  appState.selectedSubfield = null
  appState.selectedTopic = null
  navigateTo(PAGES.welcome)
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
  rootElement.className = `app-root page-${currentPage}`
  rootElement.dataset.page = currentPage

  const prevPage = getPreviousPage()
  const isGoingBack = prevPage
    ? FLOW_ORDER.indexOf(currentPage) < FLOW_ORDER.indexOf(prevPage)
    : false
  const pageClass = isGoingBack ? 'back' : ''

  let pageRender = null

  if (currentPage === PAGES.landing) {
    pageRender = mountLandingPage({
      onTryDemo: startDemo,
      onGetNow: () => navigateTo(PAGES.getNow),
      pageClass,
    })
  } else if (currentPage === PAGES.getNow) {
    pageRender = mountGetNowPage({
      onBack: navigateBack,
      onTryDemo: startDemo,
      pageClass,
    })
  } else if (currentPage === PAGES.welcome) {
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
      onViewCards: handleViewCards,
      onOpenNotes: handleOpenNotes,
      pageClass,
    })
  } else if (currentPage === PAGES.tarotCards) {
    pageRender = mountTarotCardsPage({
      subfieldId: appState.selectedSubfield,
      onBack: navigateBack,
      pageClass,
    })
  } else if (currentPage === PAGES.myNotes) {
    pageRender = mountMyNotesPage({
      onBack: navigateBack,
      pageClass,
    })
  } else if (currentPage === PAGES.simulation) {
    pageRender = mountSimulationPage({
      subfieldId: appState.selectedSubfield,
      topicId: appState.selectedTopic,
      onBack: navigateBack,
      onOpenNotes: handleOpenNotes,
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
  rootElement.className = 'app-root page-landing'
  renderCurrentPage()
}
