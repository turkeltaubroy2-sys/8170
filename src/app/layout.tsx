import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "פלוגה 8170 | מערכת ניהול מילואים",
  description: "פלטפורמת ניהול לוגיסטית לפלוגה 8170 - מילואים",
};

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
      <body>{children}</body>
    </html>
  );
}
