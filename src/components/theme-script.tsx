"use client"

import { useLayoutEffect } from "react"

export function ThemeScript() {
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem('nexora-ui-theme') === 'dark' || ((!localStorage.getItem('nexora-ui-theme') || localStorage.getItem('nexora-ui-theme') === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  }, [])
  
  return null
}