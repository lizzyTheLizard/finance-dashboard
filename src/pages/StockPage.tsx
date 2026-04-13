import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { QuoteData, ApiError } from '../types/finance'
import './StockPage.css'

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
  const symbol = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs >= 1e12) return `${symbol}${(abs / 1e12).toFixed(2)}T ${curr}`
  if (abs >= 1e9) return `${symbol}${(abs / 1e9).toFixed(2)}B ${curr}`
  if (abs >= 1e6) return `${symbol}${(abs / 1e6).toFixed(2)}M ${curr}`
  return `${symbol}${abs.toLocaleString()} ${curr}`
}

function formatVolume(value: number | null): string {
  if (value == null) return '—'
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
  return value.toLocaleString()
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  )
}

export default function StockPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<QuoteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    setIsLoading(true)
    setError(null)
    setData(null)

    fetch(`/api/quote/${encodeURIComponent(symbol)}`)
      .then((res) => res.json())
      .then((json: QuoteData | ApiError) => {
        if ('error' in json) {
          setError(json.error)
        } else {
          setData(json)
        }
      })
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setIsLoading(false))
  }, [symbol])

  if (isLoading) {
    return (
      <main className="page-content">
        <div className="stock-loading">Loading {symbol}…</div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="page-content">
        <div className="stock-error">
          <p>Could not load data for <strong>{symbol}</strong>.</p>
          <p className="stock-error-detail">{error}</p>
          <button className="stock-back-btn" onClick={() => navigate(-1)}>← Go back</button>
        </div>
      </main>
    )
  }

  const changePositive = (data.regularMarketChangePercent ?? 0) >= 0

  return (
    <main className="page-content">
      <div className="stock-header">
        <button className="stock-back-btn" onClick={() => navigate(-1)}>← Back</button>
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
