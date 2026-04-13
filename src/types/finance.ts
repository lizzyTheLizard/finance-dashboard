export interface SearchResult {
  symbol: string;
  name: string;
  typeDisplay: string;
  exchange: string;
}

export interface QuoteData {
  symbol: string;
  longName: string | null;
  regularMarketPrice: number | null;
  regularMarketChangePercent: number | null;
  marketCap: number | null;
  sector: string | null;
  industry: string | null;
  longBusinessSummary: string | null;
  currency: string | null;
  regularMarketVolume: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

export interface ApiError {
  error: string;
}
