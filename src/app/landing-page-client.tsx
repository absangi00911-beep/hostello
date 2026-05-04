'use client'

import { useRouter } from 'next/navigation'
import Hero from '@/components/Hero'

export default function LandingPageContent() {
  const router = useRouter()

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Navigate to search page with query
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return <Hero onSearch={handleSearch} />
}
