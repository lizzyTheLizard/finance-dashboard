'use client'
import { useRouter } from 'next/navigation'

// Isolated as a Client Component because router.back() requires browser APIs.
// Keeping this separate lets the parent StockPage remain a Server Component.
export default function BackButton() {
  const router = useRouter()
  return (
    <button className="stock-back-btn" onClick={() => router.back()}>
      ← Back
    </button>
  )
}
