import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // 1. اسم التبويبة اللي بيظهر في المتصفح وجوجل
  title: "ملعب العيون | حجز أونلاين", 
  
  // 2. وصف مختصر للموقع (بيظهر في نتائج بحث جوجل)
  description: "الموقع الرسمي لحجز ملعب العيون في أم الفحم. اختر الوقت المناسب واحجز ملاعبك بسهولة.",
  
  // 3. الصورة/الأيقونة (Favicon)
  icons: {
    icon: "/logo.png", // أو favicon.ico حسب اسم صورتك
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}