import { useEffect, useRef, useState } from 'react'
import DistortedNavText from './DistortedNavText'
import './Homepage.css'

const BASE = import.meta.env.BASE_URL
const asset = (p) => `${BASE}${p.replace(/^\//, '')}`

const avatars = [
  asset('assets/e1.png'),
  asset('assets/e2.png'),
  asset('assets/e3.png'),
  asset('assets/e4.png'),
  asset('assets/e5.png'),
  asset('assets/e6.png'),
  asset('assets/e7.png'),
  // Hidden for now — HTML5 / CSS3 / JavaScript
  // asset('assets/e8.png'),
  // asset('assets/e9.png'),
  // asset('assets/e10.png'),
]

const certs = Array.from({ length: 12 }, (_, i) =>
  asset(`assets/CER/cer${i + 1}.webp`)
)

export default function Homepage() {
  const navRef = useRef(null)
  const [navTheme, setNavTheme] = useState('dark') // light text on dark bg, dark text on light bg
  const [activeEdu, setActiveEdu] = useState(1) // 1 = Panyapiwat (trea), 2 = Keatkeawwittaya (nan)
  const [activeExp, setActiveExp] = useState(1) // 1-4 = BMS / Ascend / 7-Eleven / Mountain
  const [isPinned, setIsPinned] = useState(false) // true once user has scrolled past the hero
  const [tmnStep, setTmnStep] = useState(0) // 0 = mp4 (plays 2 loops), 1 = TMN_2, 2 = TMN_3
  const [menuOpen, setMenuOpen] = useState(false) // mobile hamburger menu
  const [isMobile, setIsMobile] = useState(false) // ≤640px — enables skills carousel
  const [heroBg, setHeroBg] = useState('assets/homepage.webp') // responsive hero image
  const [skillActive, setSkillActive] = useState(0) // active card index for carousel dots
  const [phoneOpen, setPhoneOpen] = useState(false) // desktop "Call" number popup
  const [phoneCopied, setPhoneCopied] = useState(false) // copied-to-clipboard feedback
  const [cerIndex, setCerIndex] = useState(null) // open certificate in the lightbox, or null
  const PHONE = '0936955932'
  const tmnVideoRef = useRef(null)
  const tmnLoopCount = useRef(0)
  const skillsTrackRef = useRef(null)
  const footerRef = useRef(null)

  // When the homepage mounts pointing at a section anchor (e.g. returning from
  // a project page via the Back button → #work), scroll there. The browser's
  // native hash-scroll fires before React has mounted the target, so do it here.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id || id.startsWith('/')) return
    const el = document.getElementById(id)
    if (!el) return
    const t = setTimeout(() => el.scrollIntoView(), 0)
    return () => clearTimeout(t)
  }, [])

  // Slideshow driver:
  // • Step 0 (video) advances via the onEnded handler after 2 full plays
  // • Steps 1 & 2 (images) advance after a 2s timer
  useEffect(() => {
    if (tmnStep === 0) {
      tmnLoopCount.current = 0
      const v = tmnVideoRef.current
      if (v) {
        v.currentTime = 0
        v.play().catch(() => {})
      }
      return
    }
    const id = setTimeout(() => setTmnStep((p) => (p + 1) % 3), 2000)
    return () => clearTimeout(id)
  }, [tmnStep])

  const handleTmnVideoEnded = () => {
    // Play once then move on
    setTmnStep((p) => (p + 1) % 3)
  }

  // Tap a carousel dot to scroll that skill card into the center
  const scrollToSkill = (i) => {
    const track = skillsTrackRef.current
    if (!track) return
    const card = track.querySelectorAll('.skill-card')[i]
    if (!card) return
    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2,
      behavior: 'smooth',
    })
    setSkillActive(i)
  }

  // Track the ≤640px breakpoint so the skills carousel only runs on mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Pick the hero background per viewport tier:
  // ≤640px → Mobile, 641–1024px → Tablet, otherwise the desktop image.
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 640px)')
    const tablet = window.matchMedia('(min-width: 641px) and (max-width: 1024px)')
    const update = () => {
      if (mobile.matches) setHeroBg('assets/Mobile.webp')
      else if (tablet.matches) setHeroBg('assets/Tablet.webp')
      else setHeroBg('assets/homepage.webp')
    }
    update()
    mobile.addEventListener('change', update)
    tablet.addEventListener('change', update)
    return () => {
      mobile.removeEventListener('change', update)
      tablet.removeEventListener('change', update)
    }
  }, [])

  // Mobile-only Skills & Tools carousel:
  // auto-advances every 1.5s, pauses while the user swipes, then resyncs.
  useEffect(() => {
    const track = skillsTrackRef.current
    if (!isMobile || !track) return

    const cards = () => Array.from(track.querySelectorAll('.skill-card'))
    let idx = 0
    let timer = 0
    let paused = false
    let syncRaf = 0

    const goTo = (i) => {
      const list = cards()
      if (!list.length) return
      idx = (i + list.length) % list.length
      const card = list[idx]
      const left = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2
      track.scrollTo({ left, behavior: 'smooth' })
      setSkillActive(idx)
    }

    const start = () => {
      stop()
      timer = setInterval(() => { if (!paused) goTo(idx + 1) }, 1500)
    }
    const stop = () => { if (timer) { clearInterval(timer); timer = 0 } }

    const syncFromScroll = () => {
      const list = cards()
      const center = track.scrollLeft + track.clientWidth / 2
      let nearest = 0
      let best = Infinity
      list.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - center)
        if (d < best) { best = d; nearest = i }
      })
      idx = nearest
      setSkillActive(nearest)
    }

    const onPointerDown = () => { paused = true; stop() }
    const onPointerUp = () => { paused = false; syncFromScroll(); start() }
    const onScroll = () => {
      if (syncRaf) cancelAnimationFrame(syncRaf)
      syncRaf = requestAnimationFrame(syncFromScroll)
    }

    track.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    track.addEventListener('scroll', onScroll, { passive: true })
    start()

    return () => {
      stop()
      track.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      track.removeEventListener('scroll', onScroll)
      if (syncRaf) cancelAnimationFrame(syncRaf)
    }
  }, [isMobile])

  // Keep the page's bottom spacer in sync with the (pinned) footer height so
  // there's exactly enough scroll to fully reveal it.
  useEffect(() => {
    const el = footerRef.current
    if (!el) return
    const setH = () =>
      document.documentElement.style.setProperty('--footer-h', `${el.offsetHeight}px`)
    setH()
    const ro = new ResizeObserver(setH)
    ro.observe(el)
    window.addEventListener('resize', setH)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', setH)
    }
  }, [])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const sample = () => {
      // 1. Pin state — switch from "floating at bottom of hero" to "stuck at top"
      //    once we've scrolled past most of the hero (~ viewport height - nav height).
      const triggerY = window.innerHeight - 140
      const scrolled = window.scrollY > triggerY
      setIsPinned((prev) => (prev === scrolled ? prev : scrolled))

      // 2. Adaptive text theme — probe the pixel beneath the navbar center.
      const rect = nav.getBoundingClientRect()
      const probeY = rect.top + rect.height / 2
      const probeX = window.innerWidth / 2

      const prevPointer = nav.style.pointerEvents
      nav.style.pointerEvents = 'none'
      const el = document.elementFromPoint(probeX, probeY)
      nav.style.pointerEvents = prevPointer

      let theme = 'dark'
      let cur = el
      while (cur && cur !== document.body) {
        const t = cur.getAttribute && cur.getAttribute('data-bg')
        if (t === 'light' || t === 'dark') {
          theme = t === 'light' ? 'light' : 'dark'
          break
        }
        cur = cur.parentElement
      }
      setNavTheme((prev) => (prev === theme ? prev : theme))
    }

    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        sample()
      })
    }

    sample()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Certificate lightbox: prev/next/close helpers + keyboard control.
  const cerPrev = () => setCerIndex((i) => (i - 1 + certs.length) % certs.length)
  const cerNext = () => setCerIndex((i) => (i + 1) % certs.length)
  useEffect(() => {
    if (cerIndex === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') setCerIndex(null)
      else if (e.key === 'ArrowLeft') cerPrev()
      else if (e.key === 'ArrowRight') cerNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cerIndex])

  // "Call" link: touch devices (phone/tablet) jump straight to the dialer;
  // desktop (no dialer) opens a popup showing the number + a copy button.
  const handleCall = (e) => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return // let the tel: href open the dialer
    e.preventDefault()
    setPhoneCopied(false)
    setPhoneOpen(true)
  }
  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(PHONE)
      setPhoneCopied(true)
    } catch {
      setPhoneCopied(false)
    }
  }

  return (
    <div className="homepage" id="home">
      {/* ============== HERO ============== */}
      <section className="hero" data-bg="dark">
        <div
          className="hero__bg"
          style={{ backgroundImage: `url(${asset(heroBg)})` }}
          aria-hidden="true"
        />
        <div className="hero__continue" aria-hidden="true" />
        <div className="hero__content">
          <p className="hero__tagline">Bridging function and aesthetics.</p>

          <h1 className="hero__title">
            <span className="hero__title-line">
              <span className="hero__name">I&rsquo;m Paiboon</span>{' '}
              <span className="hero__nickname">(auan)</span>
            </span>
            <span className="hero__title-line hero__role">
              a UX/UI Designer
            </span>
          </h1>

          <div className="hero__slide">
            <div className="hero__slide-window">
            <div className="hero__slide-track" aria-live="polite">
              <div className="hero__slide-item">
                <p>who brings products to life</p>
                <p>with bold graphics</p>
              </div>
              <div className="hero__slide-item">
                <p>Designing digital products that</p>
                <p>solve problems and delight eyes</p>
              </div>
              <div className="hero__slide-item">
                <p>I build seamless digital experiences</p>
                <p>through thoughtful UX/UI</p>
              </div>
              {/* Duplicate of slide 1 — gives a seamless loop back */}
              <div className="hero__slide-item" aria-hidden="true">
                <p>who brings products to life</p>
                <p>with bold graphics</p>
              </div>
            </div>
            </div>
          </div>

          <div className="hero__avatars" aria-label="Collaborators">
            {avatars.map((src, i) => (
              <span
                key={src}
                className="hero__avatar"
                style={{ zIndex: avatars.length - i }}
              >
                <img src={src} alt="" width="40" height="40" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============== STICKY NAV ============== */}
      <nav
        className={`navbar${isPinned ? ' navbar--pinned' : ''}${menuOpen ? ' navbar--open' : ''}`}
        aria-label="Primary"
        ref={navRef}
        data-theme={navTheme}
      >
        {/* Mobile-only brand (logo + wordmark) */}
        <a className="navbar__brand" href="#home" aria-label="Home" onClick={() => setMenuOpen(false)}>
          <img className="navbar__brand-mark" src={asset('assets/Layer.svg')} alt="" />
        </a>

        <div className="navbar__links">
          <a className="navbar__item" href="#info" onClick={() => setMenuOpen(false)}>
            <DistortedNavText text="Info" color={isMobile ? '#ffffff' : navTheme === 'light' ? '#03240f' : '#ffffff'} />
          </a>
          <a className="navbar__item" href="#work" onClick={() => setMenuOpen(false)}>
            <DistortedNavText text="Work" color={isMobile ? '#ffffff' : navTheme === 'light' ? '#03240f' : '#ffffff'} />
          </a>
          <a className="navbar__item navbar__item--icon" href="#home" aria-label="Home" onClick={() => setMenuOpen(false)}>
            <img src={asset('assets/Layer.svg')} alt="" />
          </a>
          <a className="navbar__item" href="#experience" onClick={() => setMenuOpen(false)}>
            <DistortedNavText text="Experience" color={isMobile ? '#ffffff' : navTheme === 'light' ? '#03240f' : '#ffffff'} />
          </a>
          <a className="navbar__item" href="#playground" onClick={() => setMenuOpen(false)}>
            <DistortedNavText text="Playground" color={isMobile ? '#ffffff' : navTheme === 'light' ? '#03240f' : '#ffffff'} />
          </a>
        </div>

        {/* Mobile-only hamburger toggle */}
        <button
          type="button"
          className="navbar__toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* ============== INFO SECTION ============== */}
      <section id="info" className="info" data-bg="dark">
        <div className="info__glow" aria-hidden="true" />
        <div className="info__ellipse" aria-hidden="true" />
        <img
          className="info__portrait"
          src={asset('assets/man_info.webp')}
          alt="Portrait of Paiboon"
        />

        <div className="info__letters" aria-hidden="true">
          <span>IN</span>
          <span>FO</span>
        </div>

        <div className="info__copy">
          <p className="info__lede">
            Rooted in Thailand,{' '}
            <em className="info__highlight">
              evolving alongside the rise of AI
            </em>
            ,{' '}
            <br className="info__br" />
            crafting thoughtful digital experiences through UX/UI design,{' '}
            <br className="info__br" />
            graphic design, and meaningful motion.
          </p>

          <p className="info__body">
            A design approach driven by clarity, innovation, and human-centered
            thinking.{' '}
            <br className="info__br" />
            Creating intuitive interfaces, compelling visuals, and animations
            that bring ideas to life.
          </p>

          <p className="info__scroll">(scroll down)</p>
        </div>
      </section>

      {/* ============== WORK ============== */}
      <section id="work" className="work" data-bg="light">
        <header className="section-head">
          <h2 className="section-head__title">
            <span className="section-head__meta">present</span>
            <span className="section-head__brand">
              <span className="section-head__em">my</span>
              <span className="section-head__caps">WORK</span>
            </span>
            <span className="section-head__meta">6 projcts</span>
          </h2>
        </header>

        <div className="work__grid">
          {/* LEFT COLUMN */}
          <div className="work__col">
            <article
              className="work-card work-card--tall work-card--link"
              onClick={() => { window.location.hash = '#/project/tmn' }}
              onKeyDown={(e) => { if (e.key === 'Enter') window.location.hash = '#/project/tmn' }}
              role="link"
              tabIndex={0}
              aria-label="Open Donation-CSR project"
            >
              <div className="work-card__hero work-card__hero--tmn">
                <video
                  ref={tmnVideoRef}
                  className={`tmn-slide${tmnStep === 0 ? ' is-active' : ''}`}
                  src={asset('assets/Main_TMN.mp4')}
                  autoPlay
                  muted
                  playsInline
                  onEnded={handleTmnVideoEnded}
                  aria-hidden={tmnStep !== 0}
                />
                <img
                  className={`tmn-slide${tmnStep === 1 ? ' is-active' : ''}`}
                  src={asset('assets/TMN_two.webp')}
                  alt={tmnStep === 1 ? 'Donation-CSR — frame 2' : ''}
                  aria-hidden={tmnStep !== 1}
                />
                <img
                  className={`tmn-slide${tmnStep === 2 ? ' is-active' : ''}`}
                  src={asset('assets/TMN_3.webp')}
                  alt={tmnStep === 2 ? 'Donation-CSR — frame 3' : ''}
                  aria-hidden={tmnStep !== 2}
                />
                <span className="work-card__view">View Project</span>
              </div>
              <footer className="work-card__caption">
                <span>Donation-CSR</span>
                <span>TrueMoney, Design app</span>
              </footer>
            </article>

            <article
              className="work-card work-card--link"
              onClick={() => { window.location.hash = '#/project/itc' }}
              onKeyDown={(e) => { if (e.key === 'Enter') window.location.hash = '#/project/itc' }}
              role="link"
              tabIndex={0}
              aria-label="Open BMS Internal Transfer Center project"
            >
              <WorkSlideshow
                video={asset('assets/ITC1.mp4')}
                images={[asset('assets/ITC2.webp'), asset('assets/ITC3.webp')]}
                label="BMS Internal Transfer Center"
              />
              <footer className="work-card__caption">
                <span>BMS Internal Transfer Center</span>
                <span>Patient Transfer System, Design app</span>
              </footer>
            </article>

            <article className="work-card">
              <div className="work-card__hero work-card__hero--video">
                <video
                  className="work-card__video"
                  src={asset('assets/CiS.mp4')}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <span className="work-card__view">Coming Soon</span>
              </div>
              <footer className="work-card__caption">
                <span>EHP CiS</span>
                <span>Signed and Payment, Design app</span>
              </footer>
            </article>
          </div>

          {/* RIGHT COLUMN */}
          <div className="work__col">
            <article
              className="work-card work-card--link"
              onClick={() => { window.location.hash = '#/project/kiosk' }}
              onKeyDown={(e) => { if (e.key === 'Enter') window.location.hash = '#/project/kiosk' }}
              role="link"
              tabIndex={0}
              aria-label="Open BMS Smart Payment Kiosk project"
            >
              <div className="work-card__hero work-card__hero--video">
                <video
                  className="work-card__video"
                  src={asset('assets/Kiosk.mp4')}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <span className="work-card__view">View Project</span>
              </div>
              <footer className="work-card__caption">
                <span>BMS Smart Payment Kiosk</span>
                <span>Payment, Design app</span>
              </footer>
            </article>

            <article
              className="work-card work-card--link"
              onClick={() => window.open('https://l-a-b-onlile-dvkp8n.flutterflow.app/', '_blank', 'noopener,noreferrer')}
              onKeyDown={(e) => { if (e.key === 'Enter') window.open('https://l-a-b-onlile-dvkp8n.flutterflow.app/', '_blank', 'noopener,noreferrer') }}
              role="link"
              tabIndex={0}
              aria-label="Open Lab Online prototype (opens in a new tab)"
            >
              <div className="work-card__hero work-card__hero--video">
                <video
                  className="work-card__video"
                  src={asset('assets/LAB/LAB ONLINE.mp4')}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <span className="work-card__view">View Prototype</span>
              </div>
              <footer className="work-card__caption">
                <span>Lab Online</span>
                <span>Management, website</span>
              </footer>
            </article>

            <article className="work-card work-card--tall">
              <WorkSlideshow
                video={asset('assets/AHC/AHC.mp4')}
                images={[asset('assets/AHC/AHC2.webp')]}
                label="AtlasHomeCare"
                overlay="Coming Soon"
              />
              <footer className="work-card__caption">
                <span>AtlasHomeCare</span>
                <span>Public health officer, Design app</span>
              </footer>
            </article>
          </div>
        </div>
      </section>

      {/* ============== EXPERIENCE & SKILLS ============== */}
      <section id="experience" className="exp" data-bg="light">
        <header className="section-head section-head--inline">
          <h2 className="section-head__title">
            <span className="section-head__caps">EXPERIENCE</span>
            <span className="section-head__em">and</span>
            <span className="section-head__caps">SKILLS</span>
          </h2>
        </header>

        <div className="exp__block">
          <div className="exp__row">
            <div className="exp__visual">
              <div className="exp__visual-stage">
                <img
                  className={`exp__visual-img exp__visual-img--1${activeExp === 1 ? ' is-active' : ''}`}
                  src={asset('assets/bms_em.webp')}
                  alt="Experience — BMS"
                />
                <img
                  className={`exp__visual-img exp__visual-img--2${activeExp === 2 ? ' is-active' : ''}`}
                  src={asset('assets/ascend.webp')}
                  alt="Experience — Ascend Money"
                />
                <img
                  className={`exp__visual-img exp__visual-img--3${activeExp === 3 ? ' is-active' : ''}`}
                  src={asset('assets/seven.webp')}
                  alt="Experience — 7-Eleven"
                />
                <img
                  className={`exp__visual-img exp__visual-img--4${activeExp === 4 ? ' is-active' : ''}`}
                  src={asset('assets/mountain.webp')}
                  alt="Experience — Mountain"
                />
              </div>
              <p className="exp__visual-caption exp__visual-caption--mixed">
                <span className="exp__visual-caption__row">
                  <span className="exp__visual-caption__caps">QUIETLY</span>{' '}
                  <span className="exp__visual-caption__script">powerful</span>
                </span>
                <span className="exp__visual-caption__row">
                  <span className="exp__visual-caption__caps">DIGITAL EXPERIENCES</span>
                </span>
              </p>
              <p className="exp__visual-sub">
                Design connects function with feeling.
                <br />
                I focus on embedding quiet moments of joy into everyday experiences, creating digital solutions that truly resonate and last.
              </p>
            </div>

            <ol
              className="timeline timeline--experience"
              onMouseLeave={() => setActiveExp(1)}
            >
              <li
                className={`timeline__item${activeExp === 1 ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveExp(1)}
                onClick={() => setActiveExp(1)}
                onFocus={() => setActiveExp(1)}
                tabIndex={0}
              >
                <div className="timeline__left">
                  <LogoBMS />
                  <p className="timeline__org">Bangkok Medical Software co.,ltd</p>
                </div>
                <div className="timeline__right">
                  <p className="timeline__date">
                    <span className="timeline__live-dot" aria-label="Currently working" />
                    <RollingNumber text="2024 - NOW" />
                  </p>
                  <p className="timeline__role">UXUI Design and Graphic Design</p>
                </div>
              </li>
              <li
                className={`timeline__item${activeExp === 2 ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveExp(2)}
                onClick={() => setActiveExp(2)}
                onFocus={() => setActiveExp(2)}
                tabIndex={0}
              >
                <div className="timeline__left">
                  <LogoAscend />
                  <p className="timeline__org">Ascend Money (Regional Team)</p>
                </div>
                <div className="timeline__right">
                  <p className="timeline__date"><RollingNumber text="2023 - 2024" /></p>
                  <p className="timeline__role">UXUI Design Intern</p>
                </div>
              </li>
              <li
                className={`timeline__item${activeExp === 3 ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveExp(3)}
                onClick={() => setActiveExp(3)}
                onFocus={() => setActiveExp(3)}
                tabIndex={0}
              >
                <div className="timeline__left">
                  <Logo7Eleven />
                  <p className="timeline__org">CP ALL Public Co., Ltd.</p>
                </div>
                <div className="timeline__right">
                  <p className="timeline__date"><RollingNumber text="JUN - AUG 2022" /></p>
                  <p className="timeline__role">Customer Service Intern</p>
                </div>
              </li>
              <li
                className={`timeline__item${activeExp === 4 ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveExp(4)}
                onClick={() => setActiveExp(4)}
                onFocus={() => setActiveExp(4)}
                tabIndex={0}
              >
                <div className="timeline__left">
                  <LogoMountain />
                  <p className="timeline__org">Mountain (Thailand) Co., Ltd.</p>
                </div>
                <div className="timeline__right">
                  <p className="timeline__date"><RollingNumber text="2021 - 2022" /></p>
                  <p className="timeline__role">Graphic Design Intern</p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <div className="skills" data-bg="dark">
          <h3 className="skills__heading">
            <span className="section-head__caps">SKILLS</span>
            <span className="section-head__em">and</span>
            <span className="section-head__caps">TOOLS</span>
          </h3>
          <p className="skills__sub">[ I integrate AI into my workflow to enhance UX/UI design, graphics, animation, and creative problem-solving. ]</p>

          <div className="skills__grid" ref={skillsTrackRef}>
            <SkillCard
              num="01"
              title="UX"
              subtitle="(User Experience)"
              colA={['User Research', 'Wireframing', 'Information Architecture (IA)', 'Usability Testing']}
              colB={['User Persona', 'Customer Journey Mapping', 'Interaction Design']}
              logos={[
                asset('assets/figma.svg'),
                { src: asset('assets/claude.svg'), fill: true, bg: '#fd3' },
                { src: asset('assets/drow.svg'), fill: true, bg: '#F08705' },
                { src: asset('assets/tool4.svg'), fill: true, bg: '#0b5cff' },
                { src: asset('assets/teams.svg'), bg: '#fff' },
                { src: asset('assets/gemini.webp'), bg: '#fff' }, // Gemini
                { src: asset('assets/chatgpt.webp'), fill: true }, // ChatGPT
              ]}
            />
            <SkillCard
              num="02"
              title="UI"
              subtitle="(User Interface)"
              colA={['Design Systems', 'Prototyping (High-Fidelity)', 'Responsive Design', 'Micro-interactions']}
              colB={['Visual Design', 'Motion Design', 'Typography', 'Color Theory']}
              logos={[
                asset('assets/figma.svg'),
                { src: asset('assets/e3.png'), fill: true, zoom: 1.1 }, // FlutterFlow
                { src: asset('assets/lottiefiles.svg'), fill: true, bg: '#00DDB3' }, // Lottie Files
                { src: asset('assets/e4.png'), fill: true, bg: '#330000' }, // Adobe Illustrator
                { src: asset('assets/e5.png'), fill: true, bg: '#001E36' }, // Adobe Photoshop
                { src: asset('assets/e6.png'), fill: true, bg: '#00005B' }, // Adobe After Effects
              ]}
            />
            <SkillCard
              num="03"
              title="Brand"
              subtitle="(Branding & Identity)"
              colA={['Brand Identity', 'Style Guides', 'Marketing Visuals']}
              colB={['Vector Illustration', 'Motion Design', 'Generate Image & Video']}
              logos={[
                { src: asset('assets/e4.png'), fill: true, bg: '#330000' }, // Adobe Illustrator
                { src: asset('assets/e5.png'), fill: true, bg: '#001E36' }, // Adobe Photoshop
                { src: asset('assets/e6.png'), fill: true, bg: '#00005B' }, // Adobe After Effects
                { src: asset('assets/canva.svg'), fill: true, bg: '#7D2AE7' }, // Canva
                { src: asset('assets/Affinity.svg'), fill: true, bg: '#a7f175' }, // Affinity
                { src: asset('assets/gemini.webp'), bg: '#fff' }, // Gemini
                { src: asset('assets/chatgpt.webp'), fill: true }, // ChatGPT
              ]}
            />
            <SkillCard
              num="04"
              title="Coding"
              subtitle="(Basic)"
              colA={['Vibe Coding']}
              colB={['Frontend']}
              logos={[
                { src: asset('assets/e2.png'), fill: true, zoom: 1.1 }, // Claude
                { src: asset('assets/e7.png'), fill: true, bg: '#000' }, // GitHub (black disc, white mark)
                { src: asset('assets/VS code.svg'), bg: '#fff' }, // VS Code — keep size, white bg
                { src: asset('assets/e8.png'), fill: true, zoom: 1.1 }, // HTML5
                { src: asset('assets/e9.png'), fill: true, zoom: 1.1 }, // CSS3
                { src: asset('assets/e10.png'), fill: true, zoom: 1.1 }, // JavaScript
                { src: asset('assets/react.svg'), fill: true, zoom: 0.85, bg: '#fff' }, // React
              ]}
            />
          </div>

          {/* Carousel indicators (mobile only) */}
          <div className="skills__dots" role="tablist" aria-label="Skill cards">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                className={`skills__dot${skillActive === i ? ' is-active' : ''}`}
                aria-label={`Go to card ${i + 1}`}
                aria-selected={skillActive === i}
                onClick={() => scrollToSkill(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============== PLAYGROUND ============== */}
      <section id="playground" className="playground" data-bg="light">
        <header className="section-head section-head--inline">
          <h2 className="section-head__title">
            <span className="section-head__caps">PLAYGROUND</span>
            <span className="section-head__em section-head__em--story">my story</span>
          </h2>
        </header>

        <div className="exp__block exp__block--playground">
          <div className="exp__row">
            <div className="exp__visual">
              <div className="exp__visual-stage">
                <img
                  className={`exp__visual-img exp__visual-img--1${activeEdu === 1 ? ' is-active' : ''}`}
                  src={asset('assets/trea.webp')}
                  alt="Education — Panyapiwat"
                />
                <img
                  className={`exp__visual-img exp__visual-img--2${activeEdu === 2 ? ' is-active' : ''}`}
                  src={asset('assets/nan.webp')}
                  alt="Education — Keatkeawwittaya"
                />
              </div>
              <span className="exp__visual-caption__row exp__visual-caption__row--edu">
                <span className="exp__visual-caption__my">my story</span>
                <span className="exp__visual-caption">EDUCATION</span>
              </span>
              <p className="exp__visual-sub">Starting from a remote countryside, I have dedicated my life to continuous learning and growth, turning early limitations into a lifelong passion for creating meaningful value that empowers others</p>
            </div>

            <ol
              className="timeline timeline--education"
              onMouseLeave={() => setActiveEdu(1)}
            >
              <li
                className={`timeline__item${activeEdu === 1 ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveEdu(1)}
                onClick={() => setActiveEdu(1)}
                onFocus={() => setActiveEdu(1)}
                tabIndex={0}
              >
                <div className="timeline__left">
                  <LogoPanyapiwat />
                  <p className="timeline__org">Panyapiwat Institute of Management</p>
                </div>
                <div className="timeline__right">
                  <p className="timeline__date"><RollingNumber text="2020 - 2023" /></p>
                  <p className="timeline__role">Digital Information and Technology</p>
                </div>
              </li>
              <li
                className={`timeline__item${activeEdu === 2 ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveEdu(2)}
                onClick={() => setActiveEdu(2)}
                onFocus={() => setActiveEdu(2)}
                tabIndex={0}
              >
                <div className="timeline__left">
                  <LogoKeatkeaw />
                  <p className="timeline__org">Keatkeawwittaya school</p>
                </div>
                <div className="timeline__right">
                  <p className="timeline__date"><RollingNumber text="2017 - 2019" /></p>
                  <p className="timeline__role">Art-Maths</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* ============== CERTIFICATIONS ============== */}
      <section id="certifications" className="cers" data-bg="light">
        <header className="section-head section-head--inline">
          <h2 className="section-head__title">
            <span className="section-head__caps">CERTIFICATIONS</span>
          </h2>
        </header>

        {/* Auto-scrolling marquee; pauses on hover. Each tile opens the
            lightbox. The list is duplicated so the loop is seamless. */}
        <div className="cers__marquee">
          <div className="cers__track">
            {[...certs, ...certs].map((src, i) => {
              const n = i % certs.length
              return (
                <button
                  type="button"
                  key={i}
                  className="cers__item"
                  onClick={() => setCerIndex(n)}
                  aria-label={`View certificate ${n + 1}`}
                >
                  <img src={src} alt={`Certificate ${n + 1}`} loading="lazy" />
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer className="footer" data-bg="dark" ref={footerRef}>
        <div
          className="footer__bg"
          style={{ backgroundImage: `url(${asset('assets/BG_footer.webp')})` }}
          aria-hidden="true"
        />
        <div className="footer__inner">
          <div className="footer__col">
            <p className="footer__label">MY INFORMATION</p>
            <ul className="footer__links">
              <li>
                <a className="footer__link" href="https://drive.google.com/file/d/1vd5L8Dg5uhGZx9HGTQa9-9fmjb5SerD6/view?usp=sharing" target="_blank" rel="noreferrer">
                  <span>Resume</span>
                  <FooterArrow />
                </a>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <p className="footer__label">CONTACT</p>
            <ul className="footer__links">
              <li>
                <a className="footer__link" href="mailto:paiboonkaewmong1919@gmail.com">
                  <span>Email</span>
                  <FooterArrow />
                </a>
              </li>
              <li>
                <a className="footer__link" href={`tel:${PHONE}`} onClick={handleCall}>
                  <span>Call</span>
                  <FooterArrow />
                </a>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <p className="footer__label">SOCIAL MEDIA</p>
            <ul className="footer__links">
              <li>
                <a className="footer__link" href="https://www.linkedin.com/in/paiboon-kaewmonkhol" target="_blank" rel="noreferrer">
                  <span>LinkedIn</span>
                  <FooterArrow />
                </a>
              </li>
              <li>
                <a className="footer__link" href="https://www.behance.net/paiboonkaewmon" target="_blank" rel="noreferrer">
                  <span>Behance</span>
                  <FooterArrow />
                </a>
              </li>
              <li>
                <a className="footer__link" href="https://www.facebook.com/paiboon.kaewmongkhol.2025/" target="_blank" rel="noreferrer">
                  <span>Facebook</span>
                  <FooterArrow />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Certificate lightbox — browse one by one with prev/next */}
      {cerIndex !== null && (
        <div
          className="cer-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Certificate viewer"
          onClick={() => setCerIndex(null)}
        >
          <button
            type="button"
            className="cer-modal__close"
            aria-label="Close"
            onClick={() => setCerIndex(null)}
          >
            ×
          </button>
          <button
            type="button"
            className="cer-modal__nav cer-modal__nav--prev"
            aria-label="Previous certificate"
            onClick={(e) => { e.stopPropagation(); cerPrev() }}
          >
            ‹
          </button>
          <img
            className="cer-modal__img"
            src={certs[cerIndex]}
            alt={`Certificate ${cerIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="cer-modal__nav cer-modal__nav--next"
            aria-label="Next certificate"
            onClick={(e) => { e.stopPropagation(); cerNext() }}
          >
            ›
          </button>
          <span className="cer-modal__count">{cerIndex + 1} / {certs.length}</span>
        </div>
      )}

      {/* Desktop-only "Call" popup: shows the number with a copy button */}
      {phoneOpen && (
        <div
          className="phone-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Phone number"
          onClick={() => setPhoneOpen(false)}
        >
          <div className="phone-modal__card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="phone-modal__close"
              aria-label="Close"
              onClick={() => setPhoneOpen(false)}
            >
              ×
            </button>
            <p className="phone-modal__label">CALL ME</p>
            <a className="phone-modal__number" href={`tel:${PHONE}`}>
              {PHONE}
            </a>
            <button type="button" className="phone-modal__copy" onClick={copyPhone}>
              {phoneCopied ? '✓ Copied' : 'Copy number'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// arrow-circle-up-right (Figma) — circle outline with a diagonal up-right arrow
function FooterArrow() {
  return (
    <svg
      className="footer__arrow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 15L15 9" />
      <path d="M9.5 9H15V14.5" />
    </svg>
  )
}

function LogoBMS() {
  return <img className="timeline__logo" src={asset('assets/BMS logo.svg')} alt="" aria-hidden="true" />
}

function LogoAscend() {
  return <img className="timeline__logo" src={asset('assets/TMN logo.svg')} alt="" aria-hidden="true" />
}

function Logo7Eleven() {
  return <img className="timeline__logo" src={asset('assets/7-11 logo.svg')} alt="" aria-hidden="true" />
}

function LogoMountain() {
  return <img className="timeline__logo" src={asset('assets/Mountain logo.svg')} alt="" aria-hidden="true" />
}

function LogoPanyapiwat() {
  return <img className="timeline__logo" src={asset('assets/PIM logo.svg')} alt="" aria-hidden="true" />
}

function LogoKeatkeaw() {
  return <img className="timeline__logo timeline__logo--round" src={asset('assets/KK logo.webp')} alt="" aria-hidden="true" />
}

// Date reveal: each character slides up from below + fades in, with a
// randomized per-character delay, the first time it scrolls into view.
function RollingNumber({ text }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  // Stable random delay (s) per character — computed once.
  const [delays] = useState(() => text.split('').map(() => 0.05 + Math.random() * 0.5))
  const [reduce] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const el = ref.current
    if (!el || reduce) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduce])

  return (
    <span
      ref={ref}
      className={`roll-num${inView ? ' is-in' : ''}${reduce ? ' roll-num--static' : ''}`}
      aria-label={text}
    >
      {text.split('').map((c, i) => (
        <span
          key={i}
          className="roll-char"
          aria-hidden="true"
          style={{ '--d': `${delays[i]}s` }}
        >
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  )
}

// Work-card media slideshow: plays an mp4 once, then cycles through the still
// frames (2s each), looping back to the video. Reuses the Donation-CSR
// (--tmn) styling so it inherits the hover-blur + "View Project" overlay.
// Only used by currently-hidden work cards (ITC, AtlasHomeCare).
function WorkSlideshow({ video, images, label, overlay = 'View Project' }) {
  const [step, setStep] = useState(0) // 0 = video, 1..N = images
  const videoRef = useRef(null)
  const count = images.length + 1

  // Image steps advance on a 2s timer; the video step advances via onEnded.
  useEffect(() => {
    if (step === 0) {
      const v = videoRef.current
      if (v) {
        v.currentTime = 0
        v.play().catch(() => {})
      }
      return
    }
    const id = setTimeout(() => setStep((p) => (p + 1) % count), 2000)
    return () => clearTimeout(id)
  }, [step, count])

  return (
    <div className="work-card__hero work-card__hero--tmn">
      <video
        ref={videoRef}
        className={`tmn-slide${step === 0 ? ' is-active' : ''}`}
        src={video}
        autoPlay
        muted
        playsInline
        onEnded={() => setStep((p) => (p + 1) % count)}
        aria-hidden={step !== 0}
      />
      {images.map((src, i) => (
        <img
          key={src}
          className={`tmn-slide${step === i + 1 ? ' is-active' : ''}`}
          src={src}
          alt={step === i + 1 ? `${label} — frame ${i + 2}` : ''}
          aria-hidden={step !== i + 1}
        />
      ))}
      <span className="work-card__view">{overlay}</span>
    </div>
  )
}

function SkillCard({ num, title, subtitle, colA, colB, logos = [] }) {
  // Cards with logos show exactly one dot per logo; decorative-only cards
  // keep the original 7-dot cluster.
  const dotCount = logos.length > 0 ? logos.length : 7
  return (
    <div className="skill-card">
      <p className="skill-card__num">
        {num} {title} <span>{subtitle}</span>
      </p>
      <div className="skill-card__cols">
        <ul>
          {colA.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <ul>
          {colB.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </div>
      <div
        className="skill-card__dots"
        aria-hidden="true"
        style={{ width: `${(dotCount - 1) * 24 + 32}px` }}
      >
        {Array.from({ length: dotCount }).map((_, i) => {
          const logo = logos[i]
          // A logo can be a plain src, or { src, fill, bg } to bleed its own
          // artwork across the whole dot. `bg` fills the disc behind it so
          // rounded-corner logos (e.g. the yellow Claude tile) have no gaps.
          const src = typeof logo === 'string' ? logo : logo?.src
          const fill = typeof logo === 'object' && logo?.fill
          const bg = typeof logo === 'object' ? logo?.bg : undefined
          // `zoom` scales the icon up to push a padded mark out to the disc
          // edge (clipped by overflow:hidden), so no background ring shows.
          const zoom = typeof logo === 'object' ? logo?.zoom : undefined
          return (
            <span
              key={i}
              className={`skill-card__dot${src ? ' skill-card__dot--logo' : ''}${fill ? ' skill-card__dot--fill' : ''}`}
              style={bg ? { background: bg } : undefined}
            >
              {src && (
                <img
                  src={src}
                  alt=""
                  style={zoom ? { transform: `scale(${zoom})` } : undefined}
                />
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
