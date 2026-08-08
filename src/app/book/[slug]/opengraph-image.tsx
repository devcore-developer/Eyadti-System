// src/app/book/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/db'

export const runtime = 'edge'
export const alt = 'Book your appointment now'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // جلب بيانات العيادة
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: { name: true },
  })

  const clinicName = clinic?.name || 'Medical Clinic'

  // تحميل خط Cairo عشان العربي يظهر صح في الصورة
  const cairoFont = await fetch(
    new URL('https://cdn.jsdelivr.net/gh/nicefont/cairo@master/fonts/Cairo-Bold.ttf'),
  ).then((res) => res.arrayBuffer())

  const interFont = await fetch(
    new URL('https://cdn.jsdelivr.net/gh/nicefont/inter@master/Inter-Bold.woff2'),
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#F5F9FF', // background.main من الـ tokens
        fontFamily: 'Cairo',
        padding: '60px',
      }}>
        
        {/* الهيدر */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0F172A',
            fontFamily: 'Inter',
            display: 'flex',
            alignItems: 'center',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '10px',
              background: 'linear-gradient(135deg, #5BC0BE 0%, #6B9CFF 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', marginRight: '12px', fontSize: '20px'
            }}>N</div>
            Nexora Pro
          </div>
          <div style={{
            backgroundColor: '#5BC0BE',
            color: 'white',
            padding: '10px 24px',
            borderRadius: '12px', // radii.button
            fontSize: '22px',
            fontWeight: 'bold',
          }}>
            احجز الآن
          </div>
        </div>

        {/* المحتوى الأساسي */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
        }}>
          <p style={{ fontSize: '28px', color: '#64748B', margin: '0 0 20px 0' }}>
            مرحباً بك في
          </p>
          
          {/* اسم العيادة */}
          <h1 style={{
            fontSize: '70px',
            fontWeight: 800,
            color: '#0F172A',
            margin: 0,
            textAlign: 'center',
            maxWidth: '1000px',
            lineHeight: 1.2,
            wordBreak: 'break-word',
          }}>
            {clinicName}
          </h1>

          <div style={{
            width: '120px',
            height: '6px',
            background: 'linear-gradient(90deg, #5BC0BE 0%, #6B9CFF 100%)',
            borderRadius: '3px',
            marginTop: '30px',
            marginBottom: '30px',
          }} />

          <p style={{ fontSize: '30px', color: '#475569', margin: 0 }}>
            يمكنك الآن حجز موعدك بسهولة وسرعة
          </p>
        </div>

        {/* الفوتر */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: '20px',
          color: '#94A3B8'
        }}>
          Powered by Nexora Pro
        </div>

      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Cairo', data: cairoFont, weight: 700 },
        { name: 'Inter', data: interFont, weight: 700 },
      ],
    }
  )
}