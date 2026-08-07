"use client"
import React from "react"

// ملف وهمي محدث لتعطيل اللغات نهائياً
export const LangProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const useLang = () => {
  return {
    lang: "en",
    locale: "en",
    setLang: () => {},
    setLocale: (newLocale: string) => {}, // <--- التعديل هنا: قبلنا الـ argument وسجلناه متغير جديد
    isRTL: false,
    t: (text: string) => text 
  }
}