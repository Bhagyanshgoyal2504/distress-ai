import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'D.I.S.T.R.E.S.S. A.I.',
  description: 'AI-Powered Dynamic Mental Health Monitoring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased selection:bg-teal-200 selection:text-teal-900`}>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/50 via-slate-50 to-slate-100"></div>
        <header className="bg-white/70 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl text-teal-700 flex items-center gap-2 tracking-tight">
              D.I.S.T.R.E.S.S. A.I.
            </Link>
            <nav className="flex space-x-8">
              <Link href="/test" className="text-slate-600 hover:text-teal-700 transition-colors font-medium">Test</Link>
              <Link href="/dashboard" className="text-slate-600 hover:text-teal-700 transition-colors font-medium">Dashboard</Link>
              <Link href="/support" className="text-slate-600 hover:text-teal-700 transition-colors font-medium">Support</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative">
          {children}
        </main>
      </body>
    </html>
  )
}
