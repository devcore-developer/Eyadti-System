"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Stethoscope, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${
        isScrolled 
          ? "shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-b border-[#E5E7EB]/50" 
          : "border-b border-[#E5E7EB]"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-[8px] bg-[#378ADD] flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Eyadti</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="text-sm font-medium text-white px-4 py-2 rounded-[8px] bg-[#378ADD] hover:bg-[#2e7ac7] transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-gray-900">
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
            className="md:hidden bg-white border-b border-[#E5E7EB]"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-sm text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="block text-sm text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#faq" className="block text-sm text-gray-600 hover:text-gray-900">FAQ</a>
              <Link href="/login" className="block text-sm font-medium text-gray-700 py-2">Sign In</Link>
              <Link href="/signup" className="block text-center text-sm font-medium text-white px-4 py-2 rounded-[8px] bg-[#378ADD]">
                Start Free Trial
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}