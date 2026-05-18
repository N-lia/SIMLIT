import './App.css'
import { mountLandingPage } from './pages/LandingPage.jsx'
import { mountGetNowPage } from './pages/GetNowPage.jsx'
import { mountWelcomePage } from './pages/WelcomePage.jsx'
import { mountFieldOfStudyPage } from './pages/FieldOfStudyPage.jsx'
import { mountEngineeringFieldPage } from './pages/EngineeringFieldPage.jsx'
import { mountBioDataPage } from './pages/BioDataPage.jsx'
import { mountHobbiesPage } from './pages/HobbiesPage.jsx'
import { mountSimulationSelectPage } from './pages/SimulationSelectPage.jsx'
import { mountSimulationPage } from './pages/SimulationPage.jsx'
import { mountTarotCardsPage } from './pages/TarotCardsPage.jsx'
import { mountMyNotesPage } from './pages/MyNotesPage.jsx'
import { mountProfilePage } from './pages/ProfilePage.jsx'

const PAGES = {
  landing:          'landing',
  getNow:           'getNow',
  welcome:          'welcome',
  fieldOfStudy:     'fieldOfStudy',
  engineeringField: 'engineeringField',
  bioData:          'bioData',
  hobbies:          'hobbies',
  simulationSelect: 'simulationSelect',
  simulation:       'simulation',
  tarotCards:       'tarotCards',
  myNotes:          'myNotes',
  profile:          'profile',
}

const FLOW_ORDER = [
  PAGES.landing,
  PAGES.getNow,
  PAGES.welcome,
  PAGES.fieldOfStudy,
  PAGES.bioData,
  PAGES.hobbies,
  PAGES.engineeringField,
  PAGES.simulationSelect,
  PAGES.tarotCards,
  PAGES.myNotes,
  PAGES.profile,
  PAGES.simulation,
]

function readSavedProfile() {
  try {
    return JSON.parse(localStorage.getItem('simlit_profile') || 'null')
  } catch {
    localStorage.removeItem('simlit_profile')
    return null
  }
}

const savedProfile = readSavedProfile()

const appState = {
  history: [PAGES.landing],
  navDepth: 0,
  selectedField: savedProfile?.selectedField || null,
  selectedSubfield: savedProfile?.selectedSubfield || null,
  selectedTopic: null,
  selectedLawCaseId: null,
  userProfile: savedProfile || null,
  pendingProfile: null,
  openTutorOnNotes: false,
  isSwitchingField: false,
  isEditingProfile: false,
  isEditingBio: false,
}

let rootElement = null
let cleanupCurrentPage = null
let isHandlingPopState = false

function getRouteSnapshot() {
  return {
    simlit: true,
    history: [...appState.history],
    navDepth: appState.navDepth,
    selectedField: appState.selectedField,
    selectedSubfield: appState.selectedSubfield,
    selectedTopic: appState.selectedTopic,
    selectedLawCaseId: appState.selectedLawCaseId,
    userProfile: appState.userProfile,
    pendingProfile: appState.pendingProfile,
    isSwitchingField: appState.isSwitchingField,
    isEditingProfile: appState.isEditingProfile,
  }
}

function isCompletedOnboardingSnapshot(snapshot) {
  const currentPage = snapshot.history?.[snapshot.history.length - 1]
  if (!readSavedProfile()) return false
  if (snapshot.isSwitchingField || snapshot.isEditingProfile) return false
  return [
    PAGES.welcome,
    PAGES.fieldOfStudy,
    PAGES.bioData,
    PAGES.hobbies,
  ].includes(currentPage)
}

function applyRouteSnapshot(snapshot) {
  if (!snapshot?.simlit || !Array.isArray(snapshot.history) || snapshot.history.length === 0) {
    return false
  }

  if (isCompletedOnboardingSnapshot(snapshot)) {
    appState.history = [PAGES.profile]
    appState.navDepth = 0
    appState.userProfile = readSavedProfile()
    appState.selectedField = appState.userProfile?.selectedField || null
    appState.selectedSubfield = appState.userProfile?.selectedSubfield || (appState.selectedField === 'eng' ? null : appState.selectedField)
    appState.selectedTopic = null
    appState.selectedLawCaseId = null
    appState.pendingProfile = null
    appState.isSwitchingField = false
    appState.isEditingProfile = false
    syncBrowserHistory('replace')
    return true
  }

  appState.history = snapshot.history.filter(page => Object.values(PAGES).includes(page))
  if (appState.history.length === 0) appState.history = [PAGES.landing]
  appState.navDepth = Number.isFinite(snapshot.navDepth) ? snapshot.navDepth : Math.max(0, appState.history.length - 1)
  appState.selectedField = snapshot.selectedField || null
  appState.selectedSubfield = snapshot.selectedSubfield || null
  appState.selectedTopic = snapshot.selectedTopic || null
  appState.selectedLawCaseId = snapshot.selectedLawCaseId || null
  appState.userProfile = snapshot.userProfile || readSavedProfile() || null
  appState.pendingProfile = snapshot.pendingProfile || null
  appState.isSwitchingField = Boolean(snapshot.isSwitchingField)
  appState.isEditingProfile = Boolean(snapshot.isEditingProfile)
  return true
}

function currentHashFor(page = getCurrentPage()) {
  return `#/${page}`
}

function getPageFromHash() {
  if (typeof window === 'undefined') return null
  const page = window.location.hash.replace(/^#\/?/, '')
  return Object.values(PAGES).includes(page) ? page : null
}

function applyHashRoute() {
  const page = getPageFromHash()
  if (!page) return false

  const profile = readSavedProfile()
  appState.history = [page]
  appState.navDepth = 0
  appState.userProfile = profile
  appState.selectedField = profile?.selectedField || appState.selectedField
  appState.selectedSubfield = profile?.selectedSubfield || (profile?.selectedField === 'eng' ? null : profile?.selectedField) || appState.selectedSubfield
  appState.pendingProfile = null
  appState.isSwitchingField = false
  appState.isEditingProfile = false

  if ([PAGES.profile, PAGES.simulationSelect, PAGES.tarotCards].includes(page) && !profile) {
    appState.history = [PAGES.landing]
    return false
  }

  if (page === PAGES.simulation && (!appState.selectedSubfield || !appState.selectedTopic)) {
    appState.history = profile ? [PAGES.profile] : [PAGES.landing]
  }

  return true
}

function syncBrowserHistory(mode = 'push') {
  if (typeof window === 'undefined') return
  if (isHandlingPopState && mode !== 'replace') return
  const snapshot = getRouteSnapshot()
  const hash = currentHashFor()
  if (mode === 'replace') {
    window.history.replaceState(snapshot, '', hash)
  } else {
    window.history.pushState(snapshot, '', hash)
  }
}

function getCurrentPage() {
  return appState.history[appState.history.length - 1]
}

function getPreviousPage() {
  return appState.history[appState.history.length - 2]
}

function navigateTo(page, options = {}) {
  const { replace = false, force = false } = options

  if (replace) {
    appState.history[appState.history.length - 1] = page
    syncBrowserHistory('replace')
    renderCurrentPage()
    return
  }

  if (getCurrentPage() === page && !force) {
    syncBrowserHistory('replace')
    renderCurrentPage()
    return
  }
  appState.history.push(page)
  appState.navDepth += 1
  syncBrowserHistory('push')
  renderCurrentPage()
}

function resetTo(page) {
  appState.history = [page]
  appState.navDepth = 0
  syncBrowserHistory('replace')
  renderCurrentPage()
}

function navigateBack() {
  if (typeof window !== 'undefined' && appState.navDepth > 0) {
    window.history.back()
    return
  }

  if (appState.history.length > 1) {
    appState.history.pop()
    appState.navDepth = Math.max(0, appState.navDepth - 1)
    syncBrowserHistory('replace')
    renderCurrentPage()
  }
}

function hydrateSelectionFromProfile() {
  const profile = readSavedProfile()
  if (!profile) return
  appState.userProfile = profile
  appState.selectedField = profile.selectedField || appState.selectedField
  appState.selectedSubfield = profile.selectedSubfield || (profile.selectedField === 'eng' ? null : profile.selectedField) || appState.selectedSubfield
}

function handleFieldSelect(fieldId) {
  appState.selectedField = fieldId
  if (fieldId !== 'eng') {
    appState.selectedSubfield = fieldId
  } else {
    // Reset subfield so engineering picker shows on hub → simulations
    appState.selectedSubfield = null
  }

  if (appState.isSwitchingField) {
    // Already onboarded — save updated field and go back to hub
    appState.isSwitchingField = false
    const updated = {
      ...(appState.userProfile || {}),
      selectedField: appState.selectedField,
      selectedSubfield: appState.selectedSubfield,
    }
    localStorage.setItem('simlit_profile', JSON.stringify(updated))
    appState.userProfile = updated
    resetTo(PAGES.profile)
  } else {
    // First-time onboarding — collect bio data
    navigateTo(PAGES.bioData)
  }
}

function handleBioDataComplete(profileData) {
  appState.pendingProfile = profileData
  navigateTo(PAGES.hobbies)
}

function handleHobbiesComplete(hobbies) {
  const profile = {
    ...(appState.pendingProfile || {}),
    hobbies: hobbies,
    selectedField: appState.selectedField,
    selectedSubfield: appState.selectedSubfield
  }
  localStorage.setItem('simlit_profile', JSON.stringify(profile))
  appState.userProfile = profile
  appState.pendingProfile = null
  appState.isEditingProfile = false
  appState.isSwitchingField = false
  // Always land on the hub after onboarding
  resetTo(PAGES.profile)
}

function handleGoSimulations() {
  hydrateSelectionFromProfile()
  if (appState.selectedField === 'eng' && !appState.selectedSubfield) {
    navigateTo(PAGES.engineeringField)
  } else {
    navigateTo(PAGES.simulationSelect)
  }
}

function handleGoStudyCards() {
  hydrateSelectionFromProfile()
  navigateTo(PAGES.tarotCards)
}

function handleGoNotes() {
  hydrateSelectionFromProfile()
  navigateTo(PAGES.myNotes)
}

function handleGoTutor() {
  hydrateSelectionFromProfile()
  appState.openTutorOnNotes = true
  navigateTo(PAGES.myNotes)
}

function handleEditProfile() {
  appState.isEditingProfile = true
  appState.isEditingBio = true
  navigateTo(PAGES.bioData)
}

function handleBioDataEditComplete(bioData) {
  // Save the updated bio fields and chain to hobbies editing
  const updated = {
    ...(appState.userProfile || {}),
    name: bioData.name,
    age: bioData.age,
    university: bioData.university,
  }
  localStorage.setItem('simlit_profile', JSON.stringify(updated))
  appState.userProfile = updated
  appState.isEditingBio = false
  // Chain into hobbies edit
  navigateTo(PAGES.hobbies)
}

function handleHobbiesEditComplete(hobbies) {
  appState.isEditingProfile = false
  const updated = {
    ...(appState.userProfile || {}),
    hobbies,
  }
  localStorage.setItem('simlit_profile', JSON.stringify(updated))
  appState.userProfile = updated
  navigateTo(PAGES.profile)
}

function handleLogout() {
  localStorage.removeItem('simlit_profile')
  localStorage.removeItem('simlit_notes_list')
  localStorage.removeItem('simlit_law_case_progress')
  localStorage.removeItem('simlit_health_case_progress')
  appState.userProfile = null
  appState.selectedField = null
  appState.selectedSubfield = null
  appState.selectedTopic = null
  appState.pendingProfile = null
  appState.isSwitchingField = false
  appState.isEditingProfile = false
  appState.isEditingBio = false
  appState.history = [PAGES.welcome]
  appState.navDepth = 0
  syncBrowserHistory('replace')
  renderCurrentPage()
}

function handleEngineeringSelect(subfieldId) {
  appState.selectedSubfield = subfieldId
  if (appState.userProfile) {
    const updated = {
      ...appState.userProfile,
      selectedField: appState.selectedField || 'eng',
      selectedSubfield: subfieldId,
    }
    localStorage.setItem('simlit_profile', JSON.stringify(updated))
    appState.userProfile = updated
  }
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

function handleOpenProfile() {
  navigateTo(PAGES.profile)
}

function handleChangeField() {
  appState.isSwitchingField = true
  appState.isEditingProfile = false
  appState.selectedField = null
  appState.selectedSubfield = null
  navigateTo(PAGES.fieldOfStudy)
}

function handleOpenLawCourtroom(caseId) {
  appState.selectedField = 'law'
  appState.selectedSubfield = 'law'
  appState.selectedTopic = 'courtroom'
  appState.selectedLawCaseId = caseId || null
  navigateTo(PAGES.simulation, { force: true })
}

function startDemo() {
  const profile = readSavedProfile()
  appState.userProfile = profile
  appState.isSwitchingField = false
  appState.isEditingProfile = false
  if (profile && profile.selectedField) {
    appState.selectedField = profile.selectedField
    appState.selectedSubfield = profile.selectedSubfield || (profile.selectedField === 'eng' ? null : profile.selectedField)
    // Return existing users to the hub
    navigateTo(PAGES.profile)
  } else {
    appState.selectedField = null
    appState.selectedSubfield = null
    appState.selectedTopic = null
    navigateTo(PAGES.welcome)
  }
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
      onComplete: appState.isEditingBio ? handleBioDataEditComplete : handleBioDataComplete,
      isEditing: appState.isEditingBio,
      pageClass,
    })
  } else if (currentPage === PAGES.hobbies) {
    pageRender = mountHobbiesPage({
      onBack: navigateBack,
      onComplete: appState.isEditingProfile ? handleHobbiesEditComplete : handleHobbiesComplete,
      isEditing: appState.isEditingProfile,
      pageClass,
    })
  } else if (currentPage === PAGES.simulationSelect) {
    pageRender = mountSimulationSelectPage({
      subfieldId: appState.selectedSubfield,
      onBack: navigateBack,
      onSelect: handleTopicSelect,
      onViewCards: handleViewCards,
      onOpenNotes: handleOpenNotes,
      onOpenProfile: handleOpenProfile,
      pageClass,
    })
  } else if (currentPage === PAGES.tarotCards) {
    pageRender = mountTarotCardsPage({
      subfieldId: appState.selectedSubfield,
      onBack: navigateBack,
      pageClass,
    })
  } else if (currentPage === PAGES.myNotes) {
    const openTutorOnMount = appState.openTutorOnNotes
    appState.openTutorOnNotes = false
    pageRender = mountMyNotesPage({
      onBack: navigateBack,
      openTutorOnMount,
      pageClass,
    })
  } else if (currentPage === PAGES.profile) {
    pageRender = mountProfilePage({
      onBack: navigateBack,
      onChangeField: handleChangeField,
      onEditProfile: handleEditProfile,
      onLogout: handleLogout,
      onGoSimulations: handleGoSimulations,
      onGoStudyCards: handleGoStudyCards,
      onGoNotes: handleGoNotes,
      onGoTutor: handleGoTutor,
      pageClass,
    })
  } else if (currentPage === PAGES.simulation) {
    pageRender = mountSimulationPage({
      subfieldId: appState.selectedSubfield,
      topicId: appState.selectedTopic,
      onBack: navigateBack,
      onOpenNotes: handleOpenNotes,
      onOpenLawCourtroom: handleOpenLawCourtroom,
      selectedLawCaseId: appState.selectedLawCaseId,
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
  if (typeof window !== 'undefined') {
    if (!applyRouteSnapshot(window.history.state)) {
      applyHashRoute()
    }
    syncBrowserHistory('replace')
    window.addEventListener('popstate', (event) => {
      isHandlingPopState = true
      if (applyRouteSnapshot(event.state)) {
        renderCurrentPage()
      }
      isHandlingPopState = false
    })
  }
  renderCurrentPage()
}
