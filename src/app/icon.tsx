import { ImageResponse } from 'next/og'

// حجم الأيقونة
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// توليد الأيقونة باستخدام إيموجي الكرة
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ⚽
      </div>
    ),
    {
      ...size,
    }
  )
}