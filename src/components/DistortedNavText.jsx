import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Awwwards-style interactive nav text:
 * - Renders the label to an offscreen 2D canvas
 * - Uses that canvas as a Three.js texture on a plane
 * - Fragment shader distorts UV with a ripple sourced from cursor distance
 * - Adds subtle chromatic split inside the ripple zone for liquid feel
 * - Mouse-distance falloff drives a smoothed `uHover` strength uniform
 */
export default function DistortedNavText({ text, color = '#ffffff' }) {
  const ref = useRef(null)
  // Some phones (in-app browsers, low-power mode, old GPUs) can't create a
  // WebGL context — fall back to plain text instead of crashing the page.
  const labelRef = useRef(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    let width = container.clientWidth || 120
    let height = container.clientHeight || 24
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    // ---------- 1. Text → 2D canvas → texture ----------
    const drawTextCanvas = () => {
      const cv = document.createElement('canvas')
      cv.width = width * dpr
      cv.height = height * dpr
      const ctx = cv.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)
      ctx.font = "400 16px 'Inria Serif', Georgia, serif"
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0,0,0,0.35)'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 1
      ctx.fillText(text, width / 2, height / 2)
      return cv
    }

    const textCanvas = drawTextCanvas()

    // ---------- 2. Three.js plumbing ----------
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10)
    camera.position.z = 1

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      })
    } catch {
      if (labelRef.current) labelRef.current.style.visibility = 'visible'
      return
    }
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    const canvasEl = renderer.domElement
    canvasEl.style.position = 'absolute'
    canvasEl.style.inset = '0'
    canvasEl.style.display = 'block'
    canvasEl.style.width = '100%'
    canvasEl.style.height = '100%'
    canvasEl.style.pointerEvents = 'none'
    container.appendChild(canvasEl)

    const texture = new THREE.CanvasTexture(textCanvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.needsUpdate = true

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      uniforms: {
        uTexture: { value: texture },
        uMouse:   { value: new THREE.Vector2(0.5, 0.5) },
        uTime:    { value: 0 },
        uHover:   { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D uTexture;
        uniform vec2 uMouse;
        uniform float uTime;
        uniform float uHover;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;

          // Ripple sourced from cursor distance with exponential falloff
          float d = distance(uv, uMouse);
          float falloff = exp(-d * 4.0);
          float wave = sin(d * 38.0 - uTime * 5.5) * 0.018;
          vec2 dir = normalize(uv - uMouse + vec2(0.0001));
          vec2 off = dir * wave * falloff * uHover;
          uv += off;

          // Liquid chromatic split — only inside the ripple zone
          float chroma = wave * falloff * uHover * 0.55;
          float r = texture2D(uTexture, uv + vec2(chroma,  0.0)).r;
          float g = texture2D(uTexture, uv).g;
          float b = texture2D(uTexture, uv - vec2(chroma,  0.0)).b;
          float a = texture2D(uTexture, uv).a;

          gl_FragColor = vec4(r, g, b, a);
        }
      `,
    })

    const geo = new THREE.PlaneGeometry(1, 1, 1, 1)
    const mesh = new THREE.Mesh(geo, material)
    scene.add(mesh)

    // ---------- 3. Mouse tracking with smoothed interpolation ----------
    const tMouse = { x: 0.5, y: 0.5 }
    const mouse  = { x: 0.5, y: 0.5 }
    let tHover = 0
    let hover  = 0
    const range = 180 // px — distance over which hover ramps from 1 → 0

    const onMove = (e) => {
      const rect = container.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top  + rect.height / 2
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy)
      tHover = Math.max(0, 1 - dist / range)
      tMouse.x = Math.max(-0.2, Math.min(1.2, (e.clientX - rect.left) / rect.width))
      tMouse.y = Math.max(-0.2, Math.min(1.2, 1 - (e.clientY - rect.top) / rect.height))
    }
    const onLeave = () => { tHover = 0 }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseleave', onLeave)

    // Touch devices have no hover/mousemove — drive the same ripple from the
    // active touch point so the liquid text reacts when a nav pill is tapped.
    const onTouch = (e) => {
      const t = e.touches && e.touches[0]
      if (t) onMove(t)
    }
    const onTouchEnd = () => { tHover = 0 }
    window.addEventListener('touchstart', onTouch, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })

    // ---------- 4. Resize observer ----------
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth || width
      const h = container.clientHeight || height
      if (w === width && h === height) return
      width = w; height = h
      renderer.setSize(width, height)
      // A resized image needs a fresh GPU texture, not a sub-image update.
      texture.dispose()
      texture.image = drawTextCanvas()
      texture.needsUpdate = true
    })
    ro.observe(container)

    // ---------- 5. RAF loop ----------
    const clock = new THREE.Clock()
    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      mouse.x += (tMouse.x - mouse.x) * 0.12
      mouse.y += (tMouse.y - mouse.y) * 0.12
      hover   += (tHover  - hover)   * 0.08
      material.uniforms.uMouse.value.set(mouse.x, mouse.y)
      material.uniforms.uHover.value = hover
      material.uniforms.uTime.value += dt
      renderer.render(scene, camera)
    }
    animate()

    // ---------- 6. Cleanup ----------
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      geo.dispose()
      material.dispose()
      texture.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (container.contains(canvasEl)) container.removeChild(canvasEl)
    }
  }, [text, color])

  return (
    <span
      ref={ref}
      className="distorted-text"
      aria-label={text}
      style={{
        position: 'relative',
        display: 'inline-block',
        height: '24px',
        lineHeight: '24px',
      }}
    >
      {/* Invisible plain text — drives layout width so the pill sizes to
          the label, even though only the canvas is visible. */}
      <span
        ref={labelRef}
        aria-hidden="true"
        style={{
          visibility: 'hidden',
          color,
          fontFamily: "'Inria Serif', Georgia, serif",
          fontWeight: 400,
          fontSize: '16px',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
    </span>
  )
}
