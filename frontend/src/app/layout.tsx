import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import ClientLayout from './components/ClientLayout'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })

export const metadata: Metadata = {
  title: 'VaultID - Device Protection Dashboard',
  description: 'Decentralized anti-theft mobile device tracking application on the Solana blockchain.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FDFCFB' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1917' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${jakarta.variable} light`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen font-['Plus_Jakarta_Sans'] text-base bg-[#fff8f1] dark:bg-stone-950 text-[#1e1b17] dark:text-stone-100 transition-colors">
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  )
}
