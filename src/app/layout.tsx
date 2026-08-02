import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // 1. اسم التبويبة اللي بيظهر في المتصفح وجوجل
  title: "حجز ملاعب أونلاين", 
  
  // 2. وصف مختصر للموقع (بيظهر في نتائج بحث جوجل)
  description: "الموقع الرسمي لحجز ملاعب في أم الفحم. اختر الوقت المناسب واحجز ملاعبك بسهولة.",
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