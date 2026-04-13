import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SearchResult, ApiError } from '../../types/finance'
import SearchDropdown from './SearchDropdown'
import './Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (value.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true)
      setIsOpen(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`)
        const json: SearchResult[] | ApiError = await res.json()
        if ('error' in json) {
          setResults([])
        } else {
          setResults(json)
        }
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }

  function handleSelect(result: SearchResult) {
    setIsOpen(false)
    setQuery('')
    setResults([])
    navigate(`/stock/${result.symbol}`)
  }

  function handleFocus() {
    if (results.length > 0 && query.length >= 2) {
      setIsOpen(true)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="navbar-logo" onClick={() => navigate('/')} aria-label="Go to home">
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="16" fill="currentColor" />
            <polygon points="16,8 26,24 6,24" fill="white" />
          </svg>
          <span className="navbar-logo-text">finance.gutschi.site</span>
        </button>
      </div>
      <div className="navbar-center">
        <div ref={wrapperRef} className="navbar-search-wrapper">
          <input
            className="navbar-search"
            type="search"
            placeholder="Enter a Company, Stock, or Index"
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <SearchDropdown
            results={results}
            isLoading={isLoading}
            isOpen={isOpen}
            onSelect={handleSelect}
          />
        </div>
      </div>
      <div className="navbar-right">
        <button className="navbar-info-btn" onClick={() => navigate('/info')} aria-label="Go to info">
          i
        </button>
      </div>
    </nav>
  )
}
