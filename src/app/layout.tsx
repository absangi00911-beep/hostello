import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HostelLo - Find Your Perfect Hostel',
  description: 'Discover and book verified hostels in Pakistan. Direct from owners, real reviews, transparent pricing.',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}