import { useEffect } from 'react'
import './ProjectITC.css'

const BASE = import.meta.env.BASE_URL
const asset = (p) => `${BASE}${p.replace(/^\//, '')}`

// Stacked edge-to-edge down the page. kiosk10 is inserted right after kiosk6.
const order = [1, 2, 3, 4, 5, 13, 14, 15, 6, 10, 7, 8, 9]
const images = order.map((n) => asset(`assets/KIOSK/kiosk${n}.webp`))

export default function ProjectKIOSK() {
  // Always land at the top when the page opens.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const goBack = () => {
    window.location.hash = '#work'
  }

  return (
    <div className="project-itc">
      <button
        type="button"
        className="project-itc__back"
        onClick={goBack}
        aria-label="Back to home"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span>Back</span>
      </button>

      <div className="project-itc__stack">
        {images.map((src, i) => (
          <img
            key={src}
            className="project-itc__img"
            src={src}
            alt={`BMS Smart Payment Kiosk — ${i + 1}`}
            loading={i < 2 ? 'eager' : 'lazy'}
          />
        ))}
      </div>
    </div>
  )
}
