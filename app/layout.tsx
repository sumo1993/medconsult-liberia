import type { Metadata } from "next";
import "./globals.css";
import AppDialogsProvider from "@/components/AppDialogsProvider";

export const metadata: Metadata = {
  title: "MedConsult Liberia | Expert Medical Consultation Services",
  description: "Expert medical consultation and healthcare solutions in Monrovia, Liberia. Professional consultants providing quality healthcare services and medical research.",
  // ICO + PNG first for Safari, older Chrome, and implicit /favicon.ico requests; SVG last where supported
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/medconsult-favicon.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
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
        <AppDialogsProvider>{children}</AppDialogsProvider>
      </body>
    </html>
  );
}
