'use client'
import type { SearchResult } from '../../../lib/FinanceService'
import './SearchDropdown.css'

interface SearchDropdownProps {
  results: SearchResult[]
  isLoading: boolean
  isOpen: boolean
  onSelect: (result: SearchResult) => void
}

interface SearchDropdownPropsWithQuery extends SearchDropdownProps {
  query: string
}

export default function SearchDropdown({ results, isLoading, isOpen, onSelect, query }: SearchDropdownPropsWithQuery) {
  if (!isOpen) return null

  return (
    <ul className="search-dropdown" role="listbox">
      {query.length < 2 ? (
        <li className="search-dropdown-status">Type something to search</li>
      ) : isLoading ? (
        <li className="search-dropdown-status">Searching…</li>
      ) : results.length === 0 ? (
        <li className="search-dropdown-status">No results found</li>
      ) : (
        results.map((result, i) => (
          <li
            key={`${result.symbol}-${result.exchange}-${i}`}
            className="search-dropdown-item"
            role="option"
            onMouseDown={(e) => {
              // Use mousedown so it fires before the input's onBlur
              e.preventDefault()
              onSelect(result)
            }}
          >
            <span className="search-item-symbol">{result.symbol}</span>
            <span className="search-item-name">{result.name}</span>
            <span className="search-item-type">{result.typeDisplay}</span>
          </li>
        ))
      )}
    </ul>
  )
}
