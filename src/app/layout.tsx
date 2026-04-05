import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "פלוגה 8170 | מערכת ניהול מילואים",
  description: "פלטפורמת ניהול לוגיסטית לפלוגה 8170 - מילואים",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import AuthWrapper from "@/components/AuthWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div style={{ position: 'fixed', top: 5, left: 5, zIndex: 9999, fontSize: '0.65rem', color: 'rgba(0,0,0,0.4)', pointerEvents: 'none', fontWeight: 800 }}>
          v1.0.5
        </div>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
