import { useEffect, useState } from 'react'
import Homepage from './components/Homepage.jsx'
import ProjectITC from './components/ProjectITC.jsx'
import ProjectTMN from './components/ProjectTMN.jsx'
import ProjectKIOSK from './components/ProjectKIOSK.jsx'
import './App.css'

// Lightweight hash routing. Only a dedicated "#/project/..." path is treated
// as a route change; the in-page nav anchors (#info, #work, …) fall through
// to the Homepage as before.
const getRoute = () => window.location.hash.replace(/^#/, '')

function App() {
  const [route, setRoute] = useState(getRoute())

  useEffect(() => {
    const onHash = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route === '/project/itc') return <ProjectITC />
  if (route === '/project/tmn') return <ProjectTMN />
  if (route === '/project/kiosk') return <ProjectKIOSK />
  return <Homepage />
}

export default App
