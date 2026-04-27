import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'

import { MSC_Projectz_SessionGuard } from '@/components/MSC-Projectz-SessionGuard'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const geistSans = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist-sans',
})
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'MSC-Projectz | Studio Command Center',
  description: 'High-performance project management dashboard powered by the MSC Media Engine',
  generator: 'v0.app',
  icons: {
    icon: '/media/msc-icon.png',
    apple: '/media/msc-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#121212',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning: extensions may inject attrs on <html> (e.g. webcrx) before React hydrates.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <MSC_Projectz_SessionGuard>{children}</MSC_Projectz_SessionGuard>
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
