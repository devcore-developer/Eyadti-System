"use client"

import { useState, useEffect } from "react"

export function useGreeting() {
  const [greeting, setGreeting] = useState("Hello")

  useEffect(() => {
    const hour = new Date().getHours()

    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning")
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon")
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good Evening")
    } else {
      setGreeting("Good Night")
    }
  }, [])

  return greeting
}