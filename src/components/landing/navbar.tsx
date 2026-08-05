"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false)
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm" 
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <img 
              src="/icon.png" 
              alt="Nexora Logo" 
              className="h-9 w-auto object-contain" 
            />
            <span className="text-xl font-bold tracking-tight">Nexora Clinic System</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" onClick={(e) => { e.preventDefault(); handleNavClick("#features") }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); handleNavClick("#pricing") }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" onClick={(e) => { e.preventDefault(); handleNavClick("#testimonials") }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); handleNavClick("#faq") }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link 
              href="/signup" 
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] shadow-[0_8px_20px_rgba(107,156,255,0.25)] hover:-translate-y-0.5 transition-all"
            >
              Start Free Trial
            </Link>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-foreground">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#features" onClick={(e) => { e.preventDefault(); handleNavClick("#features") }} className="block text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" onClick={(e) => { e.preventDefault(); handleNavClick("#pricing") }} className="block text-sm text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#testimonials" onClick={(e) => { e.preventDefault(); handleNavClick("#testimonials") }} className="block text-sm text-muted-foreground hover:text-foreground">Testimonials</a>
              <a href="#faq" onClick={(e) => { e.preventDefault(); handleNavClick("#faq") }} className="block text-sm text-muted-foreground hover:text-foreground">FAQ</a>
              <Link href="/login" className="block text-sm font-medium text-foreground">Sign in</Link>
              <Link href="/signup" className="block text-center text-sm font-semibold text-white px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF]">
                Start Free Trial
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}