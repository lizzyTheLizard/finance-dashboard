import { defineConfig, type Plugin, type ViteDevServer, type PreviewServer } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

function financeApiPlugin(): Plugin {
  function registerRoutes(server: ViteDevServer | PreviewServer) {
    server.middlewares.use('/api/search', async (req: IncomingMessage, res: ServerResponse) => {
      try {
        const url = new URL(req.url ?? '', 'http://localhost')
        const q = url.searchParams.get('q') ?? ''
        if (q.length < 2) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify([]))
          return
        }
        const { default: YahooFinance } = await import('yahoo-finance2')
        const yahooFinance = new YahooFinance()
        // Run searches in parallel:
        //  - primary: standard query
        //  - secondary: biases toward equities (futures dominate short queries like "Micro")
        //  - tertiary: biases toward indices
        const [primary, secondary, tertiary] = await Promise.all([
          yahooFinance.search(q, { quotesCount: 10, newsCount: 0 }),
          yahooFinance.search(q + ' corp', { quotesCount: 10, newsCount: 0 }),
          yahooFinance.search(q + ' index', { quotesCount: 10, newsCount: 0 }),
        ])
        const primaryTypes = new Set(['EQUITY', 'ETF', 'INDEX', 'MUTUALFUND'])
        const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
        type Row = { symbol: string; name: string; typeDisplay: string; exchange: string }
        function mapQuotes(quotes: typeof primary.quotes): Row[] {
          return (quotes ?? [])
            .filter((quote) => 'quoteType' in quote && primaryTypes.has((quote.quoteType ?? '').toUpperCase()))
            .map((quote) => ({
              symbol: 'symbol' in quote ? (quote.symbol ?? '') : '',
              name: ('longname' in quote ? quote.longname : null) ?? ('shortname' in quote ? quote.shortname : null) ?? '',
              typeDisplay: 'typeDisp' in quote ? (quote.typeDisp ?? '') : '',
              exchange: 'exchDisp' in quote ? (quote.exchDisp ?? '') : '',
            }))
            .filter((r) => r.symbol.length > 0)
        }
        // Primary results come first so dedup prefers them over secondary/tertiary
        const allMapped = [
          ...mapQuotes(primary.quotes),
          ...mapQuotes(secondary.quotes),
          ...mapQuotes(tertiary.quotes),
        ]
        // Deduplicate by name: prefer the symbol without a dot (primary listing)
        const seen = new Map<string, Row>()
        for (const r of allMapped) {
          const key = normName(r.name)
          if (!key) { seen.set(r.symbol, r); continue }
          const existing = seen.get(key)
          if (!existing) { seen.set(key, r); continue }
          const currHasDot = r.symbol.includes('.')
          const existingHasDot = existing.symbol.includes('.')
          if (existingHasDot && !currHasDot) seen.set(key, r)
        }
        // Rank: index results are prioritized; within same type, exact > symbol prefix > name prefix
        const qLower = q.toLowerCase()
        function prefixScore(r: Row): number {
          const isIndex = r.typeDisplay.toLowerCase() === 'index'
          // Strip ^ from index symbols (^SSMI → ssmi) for prefix comparison
          const sym = r.symbol.toLowerCase().replace(/^\^/, '')
          const name = r.name.toLowerCase()
          const typeBonus = isIndex ? 100 : 0
          if (sym === qLower) return typeBonus + 30
          if (sym.startsWith(qLower)) return typeBonus + 20
          if (name.startsWith(qLower)) return typeBonus + 10
          if (isIndex) return 5  // any index slightly beats non-matching equities
          return 0
        }
        const results = Array.from(seen.values())
          .sort((a, b) => prefixScore(b) - prefixScore(a))
          .slice(0, 10)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(results))
      } catch (err) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: String(err) }))
      }
    })

    server.middlewares.use('/api/quote', async (req: IncomingMessage, res: ServerResponse) => {
      try {
        const symbol = (req.url ?? '').slice(1).split('?')[0]
        if (!symbol) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Symbol required' }))
          return
        }
        const { default: YahooFinance } = await import('yahoo-finance2')
        const yahooFinance = new YahooFinance()
        const summary = await yahooFinance.quoteSummary(symbol, {
          modules: ['price', 'assetProfile', 'summaryDetail'],
        })
        const price = summary.price
        const profile = summary.assetProfile
        const data = {
          symbol,
          longName: price?.longName ?? price?.shortName ?? null,
          regularMarketPrice: price?.regularMarketPrice ?? null,
          regularMarketChangePercent: price?.regularMarketChangePercent != null
            ? price.regularMarketChangePercent * 100
            : null,
          marketCap: price?.marketCap ?? null,
          sector: 'sector' in (profile ?? {}) ? ((profile as { sector?: string }).sector ?? null) : null,
          industry: 'industry' in (profile ?? {}) ? ((profile as { industry?: string }).industry ?? null) : null,
          longBusinessSummary: 'longBusinessSummary' in (profile ?? {})
            ? ((profile as { longBusinessSummary?: string }).longBusinessSummary ?? null)
            : null,
          currency: price?.currency ?? null,
          regularMarketVolume: price?.regularMarketVolume ?? null,
          fiftyTwoWeekHigh: summary.summaryDetail?.fiftyTwoWeekHigh ?? null,
          fiftyTwoWeekLow: summary.summaryDetail?.fiftyTwoWeekLow ?? null,
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      } catch (err) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: String(err) }))
      }
    })
  }

  return {
    name: 'finance-api',
    configureServer: registerRoutes,
    configurePreviewServer: registerRoutes,
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), financeApiPlugin()],
})
