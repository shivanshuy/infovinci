import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { streamAgentChat } from './agent/chat'
import { PostPage } from './pages/PostPage'
import { PostsPage } from './pages/PostsPage'
import { NotFoundPage } from './pages/NotFoundPage'

type AppTheme = 'white-dwarf' | 'black-hole'
type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function useTheme() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window === 'undefined') return 'white-dwarf'
    const stored = window.localStorage.getItem('arkmind-theme')
    return stored === 'black-hole' ? 'black-hole' : 'white-dwarf'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('arkmind-theme', theme)
  }, [theme])

  return { theme, setTheme }
}

export default function App() {
  const { theme, setTheme } = useTheme()
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi. Ask me about Infovinci posts.',
    },
  ])
  const [chatThreadId] = useState(() => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `chat-${Date.now()}`
  })
  const streamingAssistantIndexRef = useRef<number | null>(null)

  const themeSwitcher = useMemo(
    () => (
      <div className="theme-switch" role="group" aria-label="Choose your destination">
        <div className="theme-switch__control">
          <span
            className={`theme-switch__option${theme === 'white-dwarf' ? ' theme-switch__option--active' : ''}`}
          >
            White Dwarf
          </span>
          <label className="theme-switch__toggle">
            <input
              type="checkbox"
              checked={theme === 'black-hole'}
              onChange={(e) =>
                setTheme(e.target.checked ? 'black-hole' : 'white-dwarf')
              }
              aria-label="Toggle between White Dwarf and Black Hole theme"
            />
            <span className="theme-switch__slider" aria-hidden="true" />
          </label>
          <span
            className={`theme-switch__option${theme === 'black-hole' ? ' theme-switch__option--active' : ''}`}
          >
            Black Hole
          </span>
        </div>
      </div>
    ),
    [setTheme, theme],
  )

  async function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = chatInput.trim()
    if (!text || chatLoading) return

    setChatInput('')
    setChatError(null)
    setChatLoading(true)
    setChatMessages((messages) => {
      const next: ChatMessage[] = [
        ...messages,
        { role: 'user', content: text },
        { role: 'assistant', content: '' },
      ]
      streamingAssistantIndexRef.current = next.length - 1
      return next
    })

    const updateAssistant = (content: string) => {
      const idx = streamingAssistantIndexRef.current
      if (idx == null || idx < 0) return
      setChatMessages((messages) => {
        if (idx >= messages.length) return messages
        const next = [...messages]
        next[idx] = { role: 'assistant', content }
        return next
      })
    }

    try {
      const assistantText = await streamAgentChat(chatThreadId, text, {
        onToken: updateAssistant,
      })
      setChatMessages((messages) => {
        const idx = streamingAssistantIndexRef.current
        if (idx == null || idx >= messages.length) return messages
        const current = messages[idx]?.content ?? ''
        const finalText =
          assistantText.trim() || current.trim() || 'I could not generate a response.'
        if (finalText === current) return messages
        const next = [...messages]
        next[idx] = { role: 'assistant', content: finalText }
        return next
      })
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'unknown error'
      setChatMessages((messages) => {
        const idx = streamingAssistantIndexRef.current
        const next = [...messages]
        if (
          idx != null &&
          idx < next.length &&
          next[idx].role === 'assistant' &&
          !next[idx].content.trim()
        ) {
          next.splice(idx, 1)
        }
        return next
      })
      setChatError(
        detail.includes('agent ')
          ? `Chat failed (${detail}). Is \`langgraph dev\` running on :2024 with Ollama up?`
          : `Chat failed: ${detail}`,
      )
    } finally {
      streamingAssistantIndexRef.current = null
      setChatLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-bar">
          <div className="app__header-brand">
            <h1 className="app__title">Infovinci</h1>
          </div>
          <nav className="app__header-nav" aria-label="Primary navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `app__header-nav-link${isActive ? ' app__header-nav-link--active' : ''}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/posts"
              className={({ isActive }) =>
                `app__header-nav-link${isActive ? ' app__header-nav-link--active' : ''}`
              }
            >
              Posts
            </NavLink>
            <button type="button" className="app__header-nav-link">
              About
            </button>
          </nav>
          <div className="app__header-rail">
            <button
              type="button"
              className={`app__chat-toggle${chatOpen ? ' app__chat-toggle--active' : ''}`}
              aria-label="Open chat"
              aria-expanded={chatOpen}
              onClick={() => setChatOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="app__chat-toggle-icon">
                <path className="bot-icon__line" d="M12 3.6v4.1" />
                <circle className="bot-icon__antenna" cx="12" cy="3" r="1.45" />
                <path className="bot-icon__ear" d="M3.1 12.2h2.35v5.2H3.1a1.35 1.35 0 0 1-1.35-1.35v-2.5A1.35 1.35 0 0 1 3.1 12.2Z" />
                <path className="bot-icon__ear" d="M20.9 12.2h-2.35v5.2h2.35a1.35 1.35 0 0 0 1.35-1.35v-2.5a1.35 1.35 0 0 0-1.35-1.35Z" />
                <rect className="bot-icon__head" x="4.75" y="7.6" width="14.5" height="12.25" rx="2.65" />
                <path className="bot-icon__shine" d="M7.2 8.85h4.9v9.15H7.2a1.15 1.15 0 0 1-1.15-1.15V10A1.15 1.15 0 0 1 7.2 8.85Z" />
                <circle className="bot-icon__eye" cx="9.25" cy="13.1" r="1.05" />
                <circle className="bot-icon__eye-dot" cx="9.25" cy="13.1" r="0.28" />
                <circle className="bot-icon__eye" cx="14.75" cy="13.1" r="1.05" />
                <circle className="bot-icon__eye-dot" cx="14.75" cy="13.1" r="0.28" />
                <path className="bot-icon__smile" d="M9.1 16.15c1.55 1.05 4.25 1.05 5.8 0" />
              </svg>
            </button>
            {themeSwitcher}
          </div>
        </div>
      </header>

      <div className="app__content">
        <main className="app__main">
          <Routes>
            <Route path="/" element={<PostsPage variant="landing" />} />
            <Route path="/posts" element={<PostsPage variant="posts" />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        {chatOpen && (
          <aside className="enduser-chat" aria-label="Infovinci chat">
            <div className="enduser-chat__header">
              <div>
                <div className="enduser-chat__title">Infovinci Chat</div>
                <div className="enduser-chat__subtitle">Ask about blog posts</div>
              </div>
              <button
                type="button"
                className="enduser-chat__close"
                aria-label="Close chat"
                onClick={() => setChatOpen(false)}
              >
                x
              </button>
            </div>

            <div className="enduser-chat__messages">
              {chatMessages.map((message, index) => {
                const isStreamingAssistant =
                  chatLoading && index === streamingAssistantIndexRef.current
                const display =
                  message.content || (isStreamingAssistant ? 'Thinking…' : '')
                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`enduser-chat__message enduser-chat__message--${message.role}`}
                  >
                    {display}
                  </div>
                )
              })}
              {chatError && <div className="enduser-chat__error">{chatError}</div>}
            </div>

            <form className="enduser-chat__form" onSubmit={sendChatMessage}>
              <label className="visually-hidden" htmlFor="enduser-chat-input">
                Message
              </label>
              <input
                id="enduser-chat-input"
                className="enduser-chat__input"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask about posts..."
                disabled={chatLoading}
              />
              <button type="submit" className="enduser-chat__send" disabled={chatLoading}>
                Send
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  )
}

