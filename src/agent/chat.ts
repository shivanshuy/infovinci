/** LangGraph Agent Server streaming client (proxied as /agent in Vite dev). */

const ASSISTANT_ID =
  (import.meta.env.VITE_LANGGRAPH_ASSISTANT_ID as string | undefined) ?? 'agent'

const SKIP_EVENTS = new Set(['metadata', 'end', 'feedback', 'heartbeat'])

function agentUrl(path: string): string {
  const base = (import.meta.env.VITE_LANGGRAPH_URL as string | undefined)?.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  if (!base) {
    return `/agent${p}`
  }
  return `${base}${p}`
}

type MessageLike = {
  type?: string
  role?: string
  content?: unknown
}

function eventBaseName(event?: string): string {
  if (!event) return ''
  return event.split('|')[0]?.trim() ?? event
}

function messageContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text?: string }).text ?? '')
        }
        return ''
      })
      .join('')
  }
  if (content == null) return ''
  return String(content)
}

function isAssistantMessage(msg: MessageLike): boolean {
  const role = String(msg.role ?? msg.type ?? '').toLowerCase()
  if (role === 'human' || role === 'user' || role === 'system') return false
  return (
    role === 'ai' ||
    role === 'assistant' ||
    role.endsWith('aimessage') ||
    role.includes('aichunk')
  )
}

function textFromMessage(msg: unknown): string | null {
  if (!msg || typeof msg !== 'object') return null
  const m = msg as MessageLike
  if (!isAssistantMessage(m)) return null
  return messageContent(m.content)
}

/** Merge cumulative snapshots and per-token deltas from LangGraph SSE. */
export function mergeStreamText(previous: string, incoming: string): string {
  if (!incoming) return previous
  if (!previous) return incoming
  if (incoming === previous) return previous
  if (incoming.startsWith(previous)) return incoming
  if (previous.startsWith(incoming)) return previous
  // Server often re-sends the full assistant message on values/updates/complete.
  if (incoming.includes(previous) || previous.includes(incoming)) {
    return incoming.length >= previous.length ? incoming : previous
  }
  const overlap = longestSuffixPrefixOverlap(previous, incoming)
  if (overlap > 0) {
    return previous + incoming.slice(overlap)
  }
  return previous + incoming
}

function longestSuffixPrefixOverlap(a: string, b: string): number {
  const max = Math.min(a.length, b.length, 512)
  for (let len = max; len > 0; len -= 1) {
    if (a.endsWith(b.slice(0, len))) return len
  }
  return 0
}

function isSnapshotStreamEvent(event?: string): boolean {
  const base = eventBaseName(event)
  return base === 'values' || base === 'updates' || base === 'messages/complete'
}

function extractAssistantText(data: unknown, event?: string): string | null {
  if (data == null) return null
  const base = eventBaseName(event)

  if (
    base === 'messages/partial' ||
    base === 'messages/complete' ||
    base === 'messages'
  ) {
    if (Array.isArray(data)) {
      if (data.length >= 1) {
        const fromMsg = textFromMessage(data[0])
        if (fromMsg != null) return fromMsg
        return messageContent((data[0] as MessageLike).content) || null
      }
    }
  }

  if (typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (Array.isArray(record.messages)) {
      for (let i = record.messages.length - 1; i >= 0; i -= 1) {
        const text = textFromMessage(record.messages[i])
        if (text != null && text.length > 0) return text
      }
    }
    for (const value of Object.values(record)) {
      const nested = extractAssistantText(value, event)
      if (nested != null && nested.length > 0) return nested
    }
  }

  return textFromMessage(data)
}

/** Line-based SSE decoder (matches langgraph_sdk.sse.SSEDecoder). */
class LangGraphSSEDecoder {
  private event = ''
  private dataParts: string[] = []

  pushLine(line: string): { event: string; data: unknown } | null {
    if (line === '') {
      if (!this.event && this.dataParts.length === 0) {
        return null
      }
      const raw = this.dataParts.join('\n')
      let data: unknown = null
      if (raw) {
        try {
          data = JSON.parse(raw) as unknown
        } catch {
          this.event = ''
          this.dataParts = []
          return null
        }
      }
      const out = { event: this.event, data }
      this.event = ''
      this.dataParts = []
      return out
    }

    if (line.startsWith(':')) {
      return null
    }

    const colon = line.indexOf(':')
    if (colon === -1) {
      return null
    }

    const field = line.slice(0, colon)
    let value = line.slice(colon + 1)
    if (value.startsWith(' ')) {
      value = value.slice(1)
    }

    if (field === 'event') {
      this.event = value
    } else if (field === 'data') {
      this.dataParts.push(value)
    }
    return null
  }
}

function parseErrorDetail(data: unknown): string {
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (typeof o.detail === 'string') return o.detail
    if (typeof o.message === 'string') return o.message
    if (typeof o.error === 'string') return o.error
  }
  return JSON.stringify(data).slice(0, 500)
}

export type StreamAgentChatOptions = {
  onToken?: (text: string) => void
}

/**
 * Stream a chat turn from Agent Server.
 * `onToken` receives the growing assistant reply (merged partials + values).
 */
export async function streamAgentChat(
  threadId: string,
  userText: string,
  options?: StreamAgentChatOptions,
): Promise<string> {
  const response = await fetch(agentUrl('/runs/stream'), {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assistant_id: ASSISTANT_ID,
      input: {
        messages: [{ role: 'human', content: userText }],
      },
      config: {
        configurable: { thread_id: threadId },
      },
      stream_mode: ['messages-tuple', 'values', 'updates'],
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`agent ${response.status}${errText ? `: ${errText.slice(0, 200)}` : ''}`)
  }
  if (!response.body) {
    throw new Error('agent: no response body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const sse = new LangGraphSSEDecoder()
  let lineCarry = ''
  let assistantText = ''

  const publish = (piece: string, event?: string) => {
    if (!piece) return
    const merged = isSnapshotStreamEvent(event)
      ? piece.length >= assistantText.length
        ? piece
        : assistantText
      : mergeStreamText(assistantText, piece)
    if (merged === assistantText) return
    assistantText = merged
    options?.onToken?.(merged)
  }

  const handleEvent = (event: string, data: unknown) => {
    const base = eventBaseName(event)
    if (SKIP_EVENTS.has(base)) return
    if (base === 'error') {
      throw new Error(parseErrorDetail(data))
    }
    const text = extractAssistantText(data, event)
    if (text != null) publish(text, event)
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    lineCarry += decoder.decode(value, { stream: true })
    const normalized = lineCarry.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalized.split('\n')
    lineCarry = lines.pop() ?? ''

    for (const line of lines) {
      const part = sse.pushLine(line)
      if (part) handleEvent(part.event, part.data)
    }
  }

  if (lineCarry) {
    const tail = lineCarry.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    for (const line of tail.split('\n')) {
      const part = sse.pushLine(line)
      if (part) handleEvent(part.event, part.data)
    }
  }

  const flushed = sse.pushLine('')
  if (flushed) handleEvent(flushed.event, flushed.data)

  return assistantText
}
