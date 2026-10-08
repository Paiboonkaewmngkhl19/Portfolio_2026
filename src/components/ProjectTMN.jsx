import { useEffect } from 'react'
import './ProjectITC.css'

const BASE = import.meta.env.BASE_URL
const asset = (p) => `${BASE}${p.replace(/^\//, '')}`

// TMN1 … TMN13, in order — stacked edge-to-edge down the page.
// Slot 5 uses flow.webp instead of TMN5.webp.
const order = Array.from({ length: 13 }, (_, i) => i + 1)
const images = order.map((n) =>
  asset(`assets/TMN/${n === 5 ? 'flow' : `TMN${n}`}.webp`)
)

export default function ProjectTMN() {
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
            alt={`Donation-CSR — ${i + 1}`}
            loading={i < 2 ? 'eager' : 'lazy'}
          />
        ))}
      </div>
    </div>
  )
}
