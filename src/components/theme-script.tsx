"use client"

import { useLayoutEffect } from "react"

export function ThemeScript() {
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem('eyadti-ui-theme') === 'dark' || ((!localStorage.getItem('eyadti-ui-theme') || localStorage.getItem('eyadti-ui-theme') === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  }, [])
  
  return null
}