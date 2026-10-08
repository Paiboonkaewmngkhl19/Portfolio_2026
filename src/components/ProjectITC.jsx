import { useEffect } from 'react'
import './ProjectITC.css'

const BASE = import.meta.env.BASE_URL
const asset = (p) => `${BASE}${p.replace(/^\//, '')}`

// Display order, stacked edge-to-edge down the page.
// ITC6 is pulled up to slot 4 and ITC10 down to slot 11; rest keep order.
const order = [1, 2, 3, 6, 4, 5, 7, 8, 9, 11, 10, 12]
const images = order.map((n) => asset(`assets/ITC/ITC${n}.webp`))

export default function ProjectITC() {
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
            alt={`BMS Internal Transfer Center — ${i + 1}`}
            loading={i < 2 ? 'eager' : 'lazy'}
          />
        ))}
      </div>
    </div>
  )
}
