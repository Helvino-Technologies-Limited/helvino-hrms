import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Helvino Technologies Limited — HRMS',
  description: 'Human Resource Management System for Helvino Technologies Limited',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif' },
              success: { style: { background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' } },
              error: { style: { background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
