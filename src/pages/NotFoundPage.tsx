import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="page">
      <span className="kicker">404</span>
      <p className="lead">This route doesn’t exist.</p>
      <Link className="app__header-nav-link" to="/">
        Go home
      </Link>
    </div>
  )
}

