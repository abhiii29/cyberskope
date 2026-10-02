"use client"

// The server can't know the visitor's motion preference, so the first client
// render must match the server (motion on). The real preference applies right
// after mount; this keeps hydration consistent for reduced-motion visitors.
import { useEffect, useState } from "react"
import { useReducedMotion as useMotionPreference } from "motion/react"

export function useReducedMotion() {
  const pref = useMotionPreference()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? pref : false
}
