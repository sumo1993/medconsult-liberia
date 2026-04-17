import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedConsult Liberia | Expert Medical Consultation Services",
  description: "Expert medical consultation and healthcare solutions in Monrovia, Liberia. Professional consultants providing quality healthcare services and medical research.",
  icons: {
    icon: [
      { url: '/medconsult-favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    apple: '/medconsult-favicon.svg',
    shortcut: '/medconsult-favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
