import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import LandingPageContent from './landing-page-client'

export default async function RootPage() {
  const session = await auth()
  
  // If user is logged in, redirect to dashboard
  if (session?.user?.id) {
    redirect('/dashboard')
  }

  // Otherwise, show the landing page
  return (
    <>
      <Navbar />
      <LandingPageContent />
    </>
  )
}
