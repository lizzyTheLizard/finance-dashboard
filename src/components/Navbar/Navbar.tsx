import { useNavigate } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="navbar-logo" onClick={() => navigate('/')} aria-label="Go to home">
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="var(--accent)" />
            <polygon points="5,24 10,18 15,21 21,13 27,8 27,28 5,28" fill="white" opacity="0.2" />
            <polyline points="5,24 10,18 15,21 21,13 27,8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="27" cy="8" r="2.5" fill="white" />
          </svg>
          <span className="navbar-logo-text">finance.gutschi.site</span>
        </button>
      </div>
      <div className="navbar-center">
        <input className="navbar-search" type="search" placeholder="Enter a Company, Stock, or Index" />
      </div>
      <div className="navbar-right">
        <button className="navbar-info-btn" onClick={() => navigate('/info')} aria-label="Go to info">
          i
        </button>
      </div>
    </nav>
  )
}
