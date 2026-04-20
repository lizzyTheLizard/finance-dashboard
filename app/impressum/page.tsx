'use client'
import { useRouter } from 'next/navigation'
import Footer from '../components/Footer/Footer'

export default function ImpressumPage() {
  const router = useRouter()

  return (
    <>
      <main className="page-content" style={{ maxWidth: '800px' }}>
        <button
          onClick={() => router.back()}
          style={{
            marginBottom: '24px',
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: 0,
          }}
        >
          ← Back
        </button>

        <h1>Impressum</h1>
        <p style={{ color: 'var(--text)', fontSize: '16px' }}>Impressum content will be added here.</p>
      </main>

      <Footer />
    </>
  )
}
