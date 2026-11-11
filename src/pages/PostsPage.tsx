import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  fetchPostsPage,
  postSummaryToCardPost,
  type PostSummaryApi,
} from '../blog/api'
import { staticPostsWithIds, type BlogPostWithId } from '../blog/posts'

const FRIENDS = [
  { name: 'Maya Chen', role: 'Ink & layout', initial: 'M' },
  { name: 'Jordan Blake', role: 'Color flats', initial: 'J' },
  { name: 'Sam Ortiz', role: 'Letters', initial: 'S' },
  { name: 'Riley Park', role: 'Co-writer', initial: 'R' },
  { name: 'Alex Kim', role: 'Editor', initial: 'A' },
]

const EVENTS = [
  { day: '02', month: 'MAY', title: 'Virtual studio tour', desc: 'Live Q&A + process walkthrough.' },
  { day: '18', month: 'MAY', title: 'Sketch night', desc: 'Open prompts, timed rounds.' },
  { day: '06', month: 'JUN', title: 'Print swap', desc: 'Mail-friendly mini-zines.' },
]

function Thumb({ variant }: { variant: number }) {
  return <div className={`landing-thumb landing-thumb--v${variant}`} aria-hidden />
}

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 50

type PostsPageProps = {
  variant: 'landing' | 'posts'
}

export function PostsPage({ variant }: PostsPageProps) {
  const isLanding = variant === 'landing'
  const [searchParams, setSearchParams] = useSearchParams()
  const pageRaw = Number(searchParams.get('page') ?? 1)
  const pageSizeRaw = Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE)
  const searchQuery = isLanding ? '' : (searchParams.get('q') ?? '')
  const page = isLanding ? 1 : Math.max(1, Number.isFinite(pageRaw) ? Math.floor(pageRaw) : 1)
  const pageSize = isLanding
    ? DEFAULT_PAGE_SIZE
    : Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, Number.isFinite(pageSizeRaw) ? Math.floor(pageSizeRaw) : DEFAULT_PAGE_SIZE),
      )

  const [items, setItems] = useState<BlogPostWithId[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [usedFallback, setUsedFallback] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const normalizedSearch = searchQuery.trim().toLowerCase()
      try {
        const data = await fetchPostsPage(
          normalizedSearch ? 1 : page,
          normalizedSearch ? MAX_PAGE_SIZE : pageSize,
          searchQuery,
        )
        if (cancelled) return
        const mapped = data.items
          .map((s: PostSummaryApi) => postSummaryToCardPost(s))
          .filter((post) =>
            normalizedSearch ? post.title.toLowerCase().includes(normalizedSearch) : true,
          )
        const start = (page - 1) * pageSize
        setItems(normalizedSearch ? mapped.slice(start, start + pageSize) : mapped)
        setTotal(normalizedSearch ? mapped.length : data.total)
        setUsedFallback(false)
      } catch {
        if (cancelled) return
        const fallbackPosts = normalizedSearch
          ? staticPostsWithIds().filter((post) =>
              post.title.toLowerCase().includes(normalizedSearch),
            )
          : staticPostsWithIds()
        const start = (page - 1) * pageSize
        setItems(fallbackPosts.slice(start, start + pageSize))
        setTotal(fallbackPosts.length)
        setUsedFallback(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [page, pageSize, searchQuery])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const [featured, ...gridPosts] = items

  function goToPage(nextPage: number) {
    const safePage = Math.min(totalPages, Math.max(1, nextPage))
    const nextParams: Record<string, string> = {
      page: String(safePage),
      pageSize: String(pageSize),
    }
    if (searchQuery.trim()) {
      nextParams.q = searchQuery.trim()
    }
    setSearchParams(nextParams)
  }

  function updateSearch(nextSearch: string) {
    const nextParams: Record<string, string> = {
      page: '1',
      pageSize: String(pageSize),
    }
    if (nextSearch.trim()) {
      nextParams.q = nextSearch
    }
    setSearchParams(nextParams)
  }

  return (
    <div className="landing">
      <div className="landing__shell">
        <aside className="landing__sidebar">
          <section className="landing-widget">
            <h3 className="landing-widget__title">
              <span className="landing-widget__title-icon" aria-hidden />
              Sign up to newsletter
            </h3>
            <p className="landing-widget__text">
              Dummy copy: occasional posts, no spam—unsubscribe any time.
            </p>
            <form
              className="landing-newsletter"
              onSubmit={(e) => {
                e.preventDefault()
              }}
            >
              <label htmlFor="nl-email" className="visually-hidden">
                Email
              </label>
              <input
                id="nl-email"
                type="email"
                className="landing-newsletter__input"
                placeholder="you@example.com"
                autoComplete="email"
              />
              <button type="submit" className="landing-newsletter__btn">
                Submit
              </button>
            </form>
          </section>

          <section className="landing-widget">
            <h3 className="landing-widget__title">Friends & people we like</h3>
            <ul className="landing-friends">
              {FRIENDS.map((f) => (
                <li key={f.name} className="landing-friends__row">
                  <div className="landing-friends__avatar" aria-hidden>
                    {f.initial}
                  </div>
                  <div>
                    <div className="landing-friends__name">{f.name}</div>
                    <div className="landing-friends__role">{f.role}</div>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className="landing-widget__btn landing-widget__btn--blue">
              See the rest
            </button>
          </section>

          <section className="landing-widget">
            <h3 className="landing-widget__title">Upcoming events</h3>
            <ul className="landing-events">
              {EVENTS.map((ev) => (
                <li key={ev.title} className="landing-events__row">
                  <div className="landing-events__date" aria-hidden>
                    <span className="landing-events__date-month">{ev.month}</span>
                    <span className="landing-events__date-day">{ev.day}</span>
                  </div>
                  <div>
                    <div className="landing-events__title">{ev.title}</div>
                    <div className="landing-events__desc">{ev.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className="landing-widget__btn landing-widget__btn--green">
              See the rest
            </button>
          </section>
        </aside>

        <div className="landing__feed">
          <div className="landing__feed-header">
            {isLanding ? (
              <h2 className="landing__feed-heading">Recent posts</h2>
            ) : (
              <p className="landing__feed-meta">
                Page {Math.min(page, totalPages)} of {totalPages} · {total} posts
              </p>
            )}
            {!isLanding && (
              <div className="landing-pagination" aria-label="Posts pagination">
                <label className="visually-hidden" htmlFor="posts-search">
                  Search posts by title
                </label>
                <input
                  id="posts-search"
                  className="landing-search"
                  type="search"
                  value={searchQuery}
                  placeholder="Search posts"
                  onChange={(event) => updateSearch(event.target.value)}
                />
                <button
                  type="button"
                  className="landing-pagination__btn"
                  disabled={page <= 1 || loading}
                  onClick={() => goToPage(page - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="landing-pagination__btn"
                  disabled={page >= totalPages || loading}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {usedFallback && (
            <p className="lead" style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.85 }}>
              Showing bundled posts (infovinci-serve unavailable). Start the API on port 8080 for
              live data.
            </p>
          )}

          {loading ? (
            <p className="lead">Loading posts…</p>
          ) : items.length === 0 ? (
            <p className="lead">{searchQuery.trim() ? 'No matching posts.' : 'No posts yet.'}</p>
          ) : isLanding ? (
            <>
              {featured && (
                <Link to={`/post/${featured.id}`} className="landing-feature">
                  <div className="landing-feature__content">
                    <span className="landing-card__cat">{featured.category}</span>
                    <h3 className="landing-feature__title">{featured.title}</h3>
                    <p className="landing-feature__excerpt">{featured.summary}</p>
                    <span className="landing-card__date">
                      {new Date(featured.dateISO).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="landing-feature__cta">Read more {'->'}</span>
                  </div>
                  <Thumb variant={featured.imageVariant} />
                </Link>
              )}

              <div className="landing-grid">
                {gridPosts.map((p) => (
                  <Link key={p.id} to={`/post/${p.id}`} className="landing-card">
                    <Thumb variant={p.imageVariant} />
                    <div className="landing-card__body">
                      <span className="landing-card__cat">{p.category}</span>
                      <h3 className="landing-card__title">{p.title}</h3>
                      <p className="landing-card__excerpt">{p.summary}</p>
                      <span className="landing-card__date">
                        {new Date(p.dateISO).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="landing-grid">
              {items.map((p) => (
                <Link key={p.id} to={`/post/${p.id}`} className="landing-card">
                  <Thumb variant={p.imageVariant} />
                  <div className="landing-card__body">
                    <span className="landing-card__cat">{p.category}</span>
                    <h3 className="landing-card__title">{p.title}</h3>
                    <p className="landing-card__excerpt">{p.summary}</p>
                    <span className="landing-card__date">
                      {new Date(p.dateISO).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!isLanding && !loading && totalPages > 1 && (
            <div className="landing-pagination landing-pagination--bottom" aria-label="Posts pagination">
              <button
                type="button"
                className="landing-pagination__btn"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </button>
              <span className="landing-pagination__status">
                Page {Math.min(page, totalPages)} of {totalPages}
              </span>
              <button
                type="button"
                className="landing-pagination__btn"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="landing-footer">
        <div className="landing-footer__strip" aria-hidden />
        <div className="landing-footer__cols">
          <div>
            <div className="landing-footer__col-title">Follow</div>
            <ul className="landing-footer__links">
              <li>Social (dummy)</li>
              <li>RSS (dummy)</li>
            </ul>
          </div>
          <div>
            <div className="landing-footer__col-title">Elsewhere</div>
            <ul className="landing-footer__links">
              <li>Studio site</li>
              <li>Shop</li>
            </ul>
          </div>
          <div>
            <div className="landing-footer__col-title">Colophon</div>
            <ul className="landing-footer__links">
              <li>Fonts: DM Sans, Outfit, IBM Plex Mono</li>
              <li>Theme tokens match Arkmind</li>
            </ul>
          </div>
          <div>
            <div className="landing-footer__col-title">Infovinci</div>
            <p className="landing-footer__blurb">
              Posts load from infovinci-serve (<code style={{ fontSize: '0.85em' }}>GET /api/posts</code>
              ); Vite proxies to port 8080 in dev.
            </p>
          </div>
        </div>
        <div className="landing-footer__copy">© {new Date().getFullYear()} Infovinci demo</div>
      </footer>
    </div>
  )
}
