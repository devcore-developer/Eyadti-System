// src/app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const alt = 'Nexora Pro - Premium Medical System'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#17212F', // dark.background من الـ tokens
        color: 'white',
        fontFamily: 'sans-serif',
      }}>
        {/* شريط لوني في الأعلى */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '8px',
          display: 'flex',
        }}>
          <div style={{ flex: 1, backgroundColor: '#5BC0BE' }} />
          <div style={{ flex: 1, backgroundColor: '#6B9CFF' }} />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          {/* أيقونة بسيطة كـ Logo بدل الصورة عشان الـ Edge Runtime */}
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #5BC0BE 0%, #6B9CFF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '20px',
            fontSize: '30px',
            fontWeight: 'bold',
            color: 'white',
          }}>N</div>
          <span style={{ fontSize: '60px', fontWeight: 'bold' }}>Nexora Pro</span>
        </div>
        
        <p style={{ fontSize: '28px', color: '#CBD5E1', margin: 0 }}>
          Premium Medical & Clinic Management System
        </p>
      </div>
    ),
    {
      ...size,
    }
  )
}