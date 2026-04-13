import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance()

export type SearchResult = {
  symbol: string
  name: string
  typeDisplay: string
  exchange: string
}

export type QuoteData = {
  symbol: string
  longName: string | null
  regularMarketPrice: number | null
  regularMarketChangePercent: number | null
  marketCap: number | null
  sector: string | null
  industry: string | null
  longBusinessSummary: string | null
  currency: string | null
  regularMarketVolume: number | null
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
}

// Only these asset classes are meaningful for this dashboard.
// Futures, currencies, and crypto are intentionally excluded because they
// flood short queries and the dashboard doesn't support them.
const PRIMARY_TYPES = new Set(['EQUITY', 'ETF', 'INDEX', 'MUTUALFUND'])

// Internal row shape used during the search pipeline before mapping to SearchResult.
type Row = { symbol: string; name: string; typeDisplay: string; exchange: string }

/** Searches Yahoo Finance and returns up to 10 ranked, deduplicated results. */
export async function searchStocks(q: string): Promise<SearchResult[]> {
  if (q.length < 2) return []
  const rows = await runParallelSearches(q)
  const deduped = deduplicateByName(rows)
  return rankResults(deduped, q).slice(0, 10)
}

// Three parallel searches are needed because a single query is often insufficient:
//   1. Bare query      — general results
//   2. + ' corp'       — biases Yahoo's ranking toward equities; short queries like
//                        "Micro" would otherwise be dominated by futures/derivatives
//   3. + ' index'      — surfaces index symbols (^GSPC, ^DJI) that would otherwise
//                        be buried below equities and ETFs
// The union of all three, after deduplication, gives better coverage.
async function runParallelSearches(q: string): Promise<Row[]> {
  const opts = { quotesCount: 10, newsCount: 0 } as const
  const [primary, secondary, tertiary] = await Promise.all([
    yahooFinance.search(q, opts),
    yahooFinance.search(q + ' corp', opts),
    yahooFinance.search(q + ' index', opts),
  ])
  // Primary results come first so deduplication prefers them over secondary/tertiary
  return [
    ...mapQuotes(primary.quotes),
    ...mapQuotes(secondary.quotes),
    ...mapQuotes(tertiary.quotes),
  ]
}

// Filters a raw Yahoo Finance quotes array to PRIMARY_TYPES and maps to Row.
// Returns an empty array on null/undefined input so one failing branch
// does not collapse the whole search.
function mapQuotes(quotes: Awaited<ReturnType<typeof yahooFinance.search>>['quotes']): Row[] {
  return (quotes ?? [])
    .filter((q) => 'quoteType' in q && PRIMARY_TYPES.has((q.quoteType ?? '').toUpperCase()))
    .map((q) => ({
      symbol: 'symbol' in q ? (q.symbol ?? '') : '',
      name: ('longname' in q ? q.longname : null) ?? ('shortname' in q ? q.shortname : null) ?? '',
      typeDisplay: 'typeDisp' in q ? (q.typeDisp ?? '') : '',
      exchange: 'exchDisp' in q ? (q.exchDisp ?? '') : '',
    }))
    .filter((r) => r.symbol.length > 0)
}

// Deduplicates rows by normalized name (lowercase, punctuation stripped).
// When two symbols share the same name — e.g. NESN and NESN.SW for Nestlé —
// the symbol WITHOUT a dot is preferred because it is the primary listing.
// Symbols with no name are keyed by symbol to prevent collisions.
function deduplicateByName(rows: Row[]): Row[] {
  const seen = new Map<string, Row>()
  for (const r of rows) {
    const key = normalizeName(r.name) || r.symbol
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, r)
      continue
    }
    // Prefer the symbol that doesn't contain a dot (primary exchange listing)
    if (existing.symbol.includes('.') && !r.symbol.includes('.')) {
      seen.set(key, r)
    }
  }
  return Array.from(seen.values())
}

// Strips punctuation and lowercases a string for use as a stable dedup key.
// e.g. "Apple Inc." → "apple inc"
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

// Scores and sorts rows by relevance to the query. Returns a new sorted array.
function rankResults(rows: Row[], q: string): Row[] {
  return [...rows].sort((a, b) => prefixScore(b, q) - prefixScore(a, q))
}

// Assigns a relevance score to a single row given the query string.
// Scoring tiers (higher = more relevant):
//   Index type:           +100 base (indices are hardest to find without boosting)
//   Exact symbol match:   +30
//   Symbol prefix match:  +20
//   Name prefix match:    +10
//   Any non-matching index: +5  (slightly beats non-matching equities)
//   Everything else:        0
// The ^ prefix is stripped from index symbols before comparison
// so users can type "GSPC" instead of "^GSPC".
function prefixScore(row: Row, q: string): number {
  const qLower = q.toLowerCase()
  const isIndex = row.typeDisplay.toLowerCase() === 'index'
  const sym = row.symbol.toLowerCase().replace(/^\^/, '') // strip leading ^ for comparison
  const name = row.name.toLowerCase()
  const typeBonus = isIndex ? 100 : 0

  if (sym === qLower) return typeBonus + 30
  if (sym.startsWith(qLower)) return typeBonus + 20
  if (name.startsWith(qLower)) return typeBonus + 10
  if (isIndex) return 5
  return 0
}

/** Fetches and normalises a full quote for a given symbol. */
export async function fetchQuote(symbol: string): Promise<QuoteData> {
  const summary = await fetchQuoteSummary(symbol)
  return normalizeQuoteData(symbol, summary)
}

// Requests only the three modules we actually render.
// Limiting modules reduces the response payload and avoids Yahoo rate-limiting
// on data we don't use.
async function fetchQuoteSummary(symbol: string) {
  return yahooFinance.quoteSummary(symbol, {
    modules: ['price', 'assetProfile', 'summaryDetail'],
  })
}

// Maps a raw quoteSummary response to the QuoteData shape the UI expects.
//
// regularMarketChangePercent: Yahoo returns this as a decimal fraction (0.02 = 2%),
// so we multiply by 100 for direct percentage display.
//
// assetProfile fields (sector, industry, longBusinessSummary) only exist for
// equities — other asset types (ETFs, indices) have a different profile shape.
// We guard with 'in' checks rather than type assertions to stay safe.
function normalizeQuoteData(
  symbol: string,
  summary: Awaited<ReturnType<typeof fetchQuoteSummary>>
): QuoteData {
  const price = summary.price
  const profile = summary.assetProfile
  const detail = summary.summaryDetail

  return {
    symbol,
    longName: price?.longName ?? price?.shortName ?? null,
    regularMarketPrice: price?.regularMarketPrice ?? null,
    regularMarketChangePercent:
      price?.regularMarketChangePercent != null
        ? price.regularMarketChangePercent * 100
        : null,
    marketCap: price?.marketCap ?? null,
    sector: profile && 'sector' in profile ? ((profile as { sector?: string }).sector ?? null) : null,
    industry: profile && 'industry' in profile ? ((profile as { industry?: string }).industry ?? null) : null,
    longBusinessSummary:
      profile && 'longBusinessSummary' in profile
        ? ((profile as { longBusinessSummary?: string }).longBusinessSummary ?? null)
        : null,
    currency: price?.currency ?? null,
    regularMarketVolume: price?.regularMarketVolume ?? null,
    fiftyTwoWeekHigh: detail?.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: detail?.fiftyTwoWeekLow ?? null,
  }
}
