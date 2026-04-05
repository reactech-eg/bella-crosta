import './globals.css'
import { Manrope, Epilogue } from 'next/font/google'
import { AuthProvider } from '@/components/auth-provider'
import { getCurrentUser } from '@/lib/auth'
import type { Metadata } from 'next'

const fontSans = Manrope({ subsets: ['latin'], variable: '--font-sans' })
const fontDisplay = Epilogue({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'Bella Crosta — Premium Pizza Delivery',
  description: 'Authentic Italian pizzas delivered fresh to your door',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <html lang="en" className={`dark ${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <AuthProvider initialUser={user}>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}