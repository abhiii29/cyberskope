"use client"

// Lightweight 2D-canvas take on ThreeUI's particle-network / defense-lines
// backgrounds, without three.js: drifting nodes, links between near neighbours,
// and the occasional "alert" packet travelling a link. Nodes shy away from the
// pointer. Pauses off-screen and renders a single still frame for reduced motion.

import { useEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"

type P = { x: number; y: number; vx: number; vy: number }
type Packet = { a: number; b: number; t: number; alert: boolean }

export function NetworkField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let w = 0, h = 0, raf = 0, visible = true
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const pts: P[] = []
    const packets: Packet[] = []
    const mouse = { x: -9999, y: -9999 }
    const LINK = 130

    const color = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#0ff"
    let primary = color("--primary"), danger = color("--danger")
    const themeObs = new MutationObserver(() => {
      primary = color("--primary")
      danger = color("--danger")
      if (reduce) draw()
    })
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const target = Math.round(Math.min(90, (w * h) / 14000))
      while (pts.length < target) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25 })
      pts.length = target
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const d = Math.hypot(dx, dy)
          if (d < LINK) {
            ctx.globalAlpha = (1 - d / LINK) * 0.35
            ctx.strokeStyle = primary
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 0.8
      ctx.fillStyle = primary
      for (const p of pts) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2)
        ctx.fill()
      }
      for (const k of packets) {
        const a = pts[k.a], b = pts[k.b]
        if (!a || !b) continue
        const x = a.x + (b.x - a.x) * k.t, y = a.y + (b.y - a.y) * k.t
        ctx.globalAlpha = 1
        ctx.fillStyle = k.alert ? danger : primary
        ctx.shadowColor = ctx.fillStyle as string
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.arc(x, y, k.alert ? 2.6 : 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
      ctx.globalAlpha = 1
    }

    const step = () => {
      for (const p of pts) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y
        const d = Math.hypot(dx, dy)
        if (d < 120 && d > 0) {
          p.vx += (dx / d) * 0.04
          p.vy += (dy / d) * 0.04
        }
        p.vx *= 0.985
        p.vy *= 0.985
        p.vx += (Math.random() - 0.5) * 0.01
        p.vy += (Math.random() - 0.5) * 0.01
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
      }
      // Spawn a packet along a random short link now and then; ~1 in 6 is an alert.
      if (packets.length < 6 && Math.random() < 0.04) {
        const a = Math.floor(Math.random() * pts.length)
        let best = -1, bd = LINK
        for (let j = 0; j < pts.length; j++) {
          const d = Math.hypot(pts[a].x - pts[j].x, pts[a].y - pts[j].y)
          if (j !== a && d < bd) (best = j), (bd = d)
        }
        if (best >= 0) packets.push({ a, b: best, t: 0, alert: Math.random() < 0.17 })
      }
      for (let i = packets.length - 1; i >= 0; i--) {
        packets[i].t += 0.012
        if (packets[i].t >= 1) packets.splice(i, 1)
      }
      draw()
      if (visible) raf = requestAnimationFrame(step)
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
    }
    const onLeave = () => ((mouse.x = -9999), (mouse.y = -9999))

    resize()
    const ro = new ResizeObserver(() => {
      resize()
      if (reduce) draw()
    })
    ro.observe(canvas)

    if (reduce) {
      draw()
    } else {
      window.addEventListener("pointermove", onMove, { passive: true })
      document.addEventListener("pointerleave", onLeave)
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting
        cancelAnimationFrame(raf)
        if (visible) raf = requestAnimationFrame(step)
      })
      io.observe(canvas)
      return () => {
        io.disconnect()
        ro.disconnect()
        themeObs.disconnect()
        cancelAnimationFrame(raf)
        window.removeEventListener("pointermove", onMove)
        document.removeEventListener("pointerleave", onLeave)
      }
    }
    return () => {
      ro.disconnect()
      themeObs.disconnect()
    }
  }, [reduce])

  return <canvas ref={ref} aria-hidden className={`pointer-events-none h-full w-full ${className}`} />
}
