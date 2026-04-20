'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SearchResult } from '../../../lib/FinanceService'
import SearchDropdown from './SearchDropdown'
import './Navbar.css'

interface NavbarProps {
  // Server action passed from layout.tsx so this client component can trigger
  // server-side Yahoo Finance searches without a /api/search route.
  onSearch: (q: string) => Promise<SearchResult[]>
}

export default function Navbar({ onSearch }: NavbarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
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
      return
    }

    // Debounce so we don't call the server action on every keystroke
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const data = await onSearch(value)
        setResults(data)
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
    router.push(`/stock/${result.symbol}`)
  }

  function handleFocus() {
    setIsFocused(true)
    setIsOpen(true)
  }

  function handleBlur() {
    setIsFocused(false)
    setIsOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <nav className={`navbar${isFocused ? ' navbar--search-focused' : ''}`}>
      <div className="navbar-left">
        <button className="navbar-logo" onClick={() => router.push('/')} aria-label="Go to home">
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="var(--accent)" />
            <polygon points="5,24 10,18 15,21 21,13 27,8 27,28 5,28" fill="white" opacity="0.2" />
            <polyline points="5,24 10,18 15,21 21,13 27,8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="27" cy="8" r="2.5" fill="white" />
          </svg>
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
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <SearchDropdown
            results={results}
            isLoading={isLoading}
            isOpen={isOpen}
            onSelect={handleSelect}
            query={query}
          />
        </div>
      </div>
      <div className="navbar-right">
        <button className="navbar-info-btn" onClick={() => router.push('/info')} aria-label="Go to info">
          i
        </button>
      </div>
    </nav>
  )
}
