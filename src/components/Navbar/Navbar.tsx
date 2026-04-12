import { useNavigate } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()

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
