import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Code Debug Tool',
  description: 'Created with AI Code Debug',
  generator: 'AI Code Debug',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
