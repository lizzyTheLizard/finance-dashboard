// Server Component — Next.js fetches the quote on the server before sending HTML.
// No 'use client', no useEffect, no client-side loading spinner needed.
import { fetchQuote } from '../../../lib/FinanceService'
import type { QuoteData } from '../../../lib/FinanceService'
import BackButton from './BackButton'
import './StockPage.css'

// params is a Promise in Next.js 15+ and must be awaited before reading fields.
export default async function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params

  let data: QuoteData
  try {
    data = await fetchQuote(symbol)
  } catch {
    return (
      <main className="page-content">
        <div className="stock-error">
          <p>Could not load data for <strong>{symbol}</strong>.</p>
          <BackButton />
        </div>
      </main>
    )
  }

  const changePositive = (data.regularMarketChangePercent ?? 0) >= 0

  return (
    <main className="page-content">
      <div className="stock-header">
        <BackButton />
        <div className="stock-title-row">
          <h1 className="stock-symbol">{data.symbol}</h1>
          {data.longName && <p className="stock-name">{data.longName}</p>}
        </div>
        <div className="stock-price-row">
          <span className="stock-price">
            {formatPrice(data.regularMarketPrice, data.currency)}
          </span>
          {data.regularMarketChangePercent != null && (
            <span className={`stock-change ${changePositive ? 'positive' : 'negative'}`}>
              {changePositive ? '+' : ''}{data.regularMarketChangePercent.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      <div className="stock-grid">
        <StatCard label="Market Cap" value={formatMarketCap(data.marketCap, data.currency)} />
        <StatCard label="Volume" value={formatVolume(data.regularMarketVolume)} />
        <StatCard label="52W High" value={formatPrice(data.fiftyTwoWeekHigh, data.currency)} />
        <StatCard label="52W Low" value={formatPrice(data.fiftyTwoWeekLow, data.currency)} />
        {data.sector && <StatCard label="Sector" value={data.sector} />}
        {data.industry && <StatCard label="Industry" value={data.industry} />}
      </div>

      {data.longBusinessSummary && (
        <section className="stock-about">
          <h2>About</h2>
          <p>{data.longBusinessSummary}</p>
        </section>
      )}
    </main>
  )
}

// ── Formatting helpers ─────────────────────────────────────────────────────────
// These are pure functions used only on this page, so they live here rather
// than in a shared utility file.

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  )
}

function formatPrice(value: number | null, currency: string | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatMarketCap(value: number | null, currency: string | null): string {
  if (value == null) return '—'
  const curr = currency ?? 'USD'
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T ${curr}`
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B ${curr}`
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M ${curr}`
  return `${sign}${abs.toLocaleString()} ${curr}`
}

function formatVolume(value: number | null): string {
  if (value == null) return '—'
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
  return value.toLocaleString()
}
