import Footer from './components/Footer/Footer'
import './home.css'

export default function HomePage() {
  return (
    <>
      <main className="page-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>An overview of your financial information</p>
        </div>

        <div className="cards-container">
          <div className="card">
            <h2>Chart / Widget</h2>
            <p className="card-description">e.g. Portfolio performance chart</p>
            <div className="chart-placeholder"></div>
          </div>

          <div className="card">
            <h2>Data Table / List</h2>
            <p className="card-description">e.g. Watchlist, top movers</p>
            <div className="chart-placeholder"></div>
          </div>

          <div className="card">
            <h2>Info Panel</h2>
            <p className="card-description">e.g. News feed, quick facts</p>
            <div className="chart-placeholder"></div>
          </div>
        </div>

        <div className="disclaimer-bar">
          <p>ⓘ The information on this page is for educational purposes only and does not constitute investment advice.</p>
        </div>
      </main>

      <Footer />
    </>
  )
}
