import React, { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  radius: number
  color: string
  vx: number
  vy: number
  alpha: number
  decay: number
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let logicalWidth = 0
    let logicalHeight = 0

    const colors = [
      '#3b82f6', // blue
      '#06b6d4', // cyan
      '#ec4899', // pink
      '#a855f7', // purple
      '#eab308', // yellow
      '#10b981', // green
      '#ef4444', // red
    ]

    const particles: Particle[] = []
    const maxParticles = 40

    const createParticle = (w: number, h: number): Particle => ({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6 - 0.2,
      alpha: Math.random() * 0.7 + 0.3,
      decay: Math.random() * 0.005 + 0.002,
    })

    const updateDimensions = () => {
      const parent = canvas.parentElement
      logicalWidth = parent?.clientWidth || window.innerWidth
      logicalHeight = parent?.clientHeight || window.innerHeight

      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(logicalWidth * dpr)
      canvas.height = Math.floor(logicalHeight * dpr)
      canvas.style.width = `${logicalWidth}px`
      canvas.style.height = `${logicalHeight}px`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (particles.length === 0) {
        for (let i = 0; i < maxParticles; i++) {
          particles.push(createParticle(logicalWidth, logicalHeight))
        }
      }
    }

    updateDimensions()

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions()
      })
      resizeObserver.observe(canvas.parentElement)
    }

    const handleWindowResize = () => {
      updateDimensions()
    }
    window.addEventListener('resize', handleWindowResize)

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const render = () => {
      ctx.clearRect(0, 0, logicalWidth, logicalHeight)

      const isReducedMotion = reducedMotionQuery.matches

      particles.forEach((p, idx) => {
        if (!isReducedMotion) {
          p.x += p.vx
          p.y += p.vy
          p.alpha -= p.decay

          if (p.alpha <= 0 || p.x < 0 || p.x > logicalWidth || p.y < 0 || p.y > logicalHeight) {
            particles[idx] = createParticle(logicalWidth, logicalHeight)
          }
        }

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.restore()
      })

      if (!isReducedMotion) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    render()

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      window.removeEventListener('resize', handleWindowResize)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  )
}
