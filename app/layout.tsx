import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mockify',
  description: 'A flight simulator for interviews: face a panel built from your own resume, with a coach on your side.',
}

export const viewport: Viewport = {
  themeColor: '#0b0e1f',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden antialiased">{children}</body>
    </html>
  )
}
