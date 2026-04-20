'use client'
import { useRouter } from 'next/navigation'
import './Footer.css'

export default function Footer() {
  const router = useRouter()

  return (
    <footer className="page-footer">
      <a href="https://github.com/lizzyTheLizard/finance-dashboard" target="_blank" rel="noopener noreferrer">
        Repository
      </a>
      <button onClick={() => router.push('/impressum')}>Impressum</button>
      <button onClick={() => router.push('/contact')}>Contact</button>
      <span>© 2026</span>
    </footer>
  )
}
