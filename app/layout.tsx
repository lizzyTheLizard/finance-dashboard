import './globals.css'
import Navbar from './components/Navbar/Navbar'
import { searchStocks } from '../lib/FinanceService'

export const metadata = { title: 'Finance Spark' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Inline server action — defined here (a Server Component) so the Navbar
  // client component can trigger Yahoo Finance searches without a /api route.
  // Next.js serialises the action reference and sends it to the client.
  async function search(q: string) {
    'use server'
    return searchStocks(q)
  }

  return (
    <html lang="en">
      <body>
        <Navbar onSearch={search} />
        {children}
      </body>
    </html>
  )
}
