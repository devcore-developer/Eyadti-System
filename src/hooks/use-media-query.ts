import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    // ✨ تحديث الحالة بالقيمة الحالية فوراً عند التركيب (Mount)
    // هذا يمنع مشاكل الـ Hydration في Next.js
    setMatches(media.matches)

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // الاستماع لتغييرات حجم الشاشة
    media.addEventListener("change", listener)
    
    // تنظيف المستمع عند الإزالة (Unmount)
    return () => media.removeEventListener("change", listener)
  }, [query]) // ✨ الاعتماد فقط على الـ query لمنع إعادة التشغيل غير الضرورية

  return matches
}