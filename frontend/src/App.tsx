import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

const suggestedQuestions = [
  { label: 'Supplier evaluation', question: 'What factors should be considered when evaluating a supplier?' },
  { label: 'Procurement lifecycle', question: 'What are the main procurement lifecycle steps?' },
  { label: 'Contract performance', question: 'How should contract performance be monitored?' },
  { label: 'Supply chain risks', question: 'What are common supply chain risks according to the selected guidance?' },
]

const storageKey = 'supplyiq.chat-history.v1'
const maximumConversations = 20
const maximumStorageCharacters = 180_000
const maximumSavedAnswerCharacters = 12_000
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')

type Source = { sourceId?: string; name?: string; organization?: string; url?: string; limitations?: string }
type ChatResponse = { answer?: string; sources?: Source[]; limitations?: string[]; supportLevel?: string; code?: string }
type Message = { question: string; response: ChatResponse }
type Conversation = { id: string; title: string; createdAt: number; messages: Message[] }

function createConversationId() { return typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}` }
function makeTitle(question: string) { return question.length > 58 ? `${question.slice(0, 58).trim()}…` : question }

function loadConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const candidate = item as Record<string, unknown>
      if (typeof candidate.id !== 'string' || typeof candidate.title !== 'string' || typeof candidate.createdAt !== 'number' || !Array.isArray(candidate.messages)) return []
      const messages = candidate.messages.flatMap((rawMessage): Message[] => {
        if (!rawMessage || typeof rawMessage !== 'object') return []
        const message = rawMessage as Record<string, unknown>
        if (typeof message.question !== 'string' || !message.response || typeof message.response !== 'object') return []
        const rawResponse = message.response as Record<string, unknown>
        const sources = Array.isArray(rawResponse.sources) ? rawResponse.sources.flatMap((rawSource): Source[] => {
          if (!rawSource || typeof rawSource !== 'object') return []
          const source = rawSource as Record<string, unknown>
          return [{ sourceId: typeof source.sourceId === 'string' ? source.sourceId : undefined, name: typeof source.name === 'string' ? source.name : undefined, organization: typeof source.organization === 'string' ? source.organization : undefined, url: typeof source.url === 'string' ? source.url : undefined }]
        }) : []
        return [{ question: message.question, response: { answer: typeof rawResponse.answer === 'string' ? rawResponse.answer : undefined, sources, supportLevel: typeof rawResponse.supportLevel === 'string' ? rawResponse.supportLevel : undefined } }]
      })
      return [{ id: candidate.id, title: candidate.title, createdAt: candidate.createdAt, messages }]
    }).slice(0, maximumConversations)
  } catch { return [] }
}

function persistConversations(conversations: Conversation[]) {
  try {
    const persisted = conversations.slice(0, maximumConversations).map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      messages: conversation.messages.map(({ question, response }) => ({
        question: question.slice(0, 1_000),
        response: {
          answer: response.answer?.slice(0, maximumSavedAnswerCharacters),
          sources: response.sources?.slice(0, 20).map((source) => ({
            sourceId: source.sourceId,
            name: source.name,
            organization: source.organization,
            url: source.url,
          })),
          supportLevel: response.supportLevel,
        },
      })),
    }))
    while (JSON.stringify(persisted).length > maximumStorageCharacters) {
      if (persisted.length > 1) persisted.pop()
      else if (persisted[0]?.messages.length) persisted[0].messages.shift()
      else break
    }
    localStorage.setItem(storageKey, JSON.stringify(persisted))
  } catch { /* localStorage may be unavailable or full; the chat still works in memory. */ }
}

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2).replace(/\*+/g, '')}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1).replace(/\*+/g, '')}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1).replace(/\*+/g, '')}</code>
    return <span key={index}>{part.replace(/\*+/g, '').replace(/#{3,}/g, '')}</span>
  })
}

function MarkdownAnswer({ content }: { content: string }) {
  const blocks: ReactNode[] = []
  let paragraph: string[] = []
  let list: string[] = []
  const flushParagraph = () => { if (paragraph.length) { blocks.push(<p key={blocks.length}>{renderInlineMarkdown(paragraph.join(' '))}</p>); paragraph = [] } }
  const flushList = () => { if (list.length) { blocks.push(<ul key={blocks.length}>{list.map((item, index) => <li key={index}>{renderInlineMarkdown(item)}</li>)}</ul>); list = [] } }

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) { flushParagraph(); flushList(); return }
    const heading = trimmed.match(/^#{1,6}\s+(.+)$/)
    const bullet = trimmed.match(/^(?:[-*]|\d+\.)\s+(.+)$/)
    if (heading) { flushParagraph(); flushList(); blocks.push(<h3 key={blocks.length}>{renderInlineMarkdown(heading[1])}</h3>); return }
    if (bullet) { flushParagraph(); list.push(bullet[1]); return }
    flushList(); paragraph.push(trimmed)
  })
  flushParagraph(); flushList()
  return <div className="answer-content">{blocks}</div>
}

function BrandMark() { return <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div> }
function Sidebar({ conversations, activeId, onNewChat, onOpen, onDelete }: { conversations: Conversation[]; activeId: string | null; onNewChat: () => void; onOpen: (id: string) => void; onDelete: (id: string) => void }) {
  return <aside className="sidebar" aria-label="SupplyIQ navigation"><div className="sidebar-top"><a className="brand" href="/" aria-label="SupplyIQ home"><BrandMark /><span>SupplyIQ</span></a><button className="new-chat-button" type="button" onClick={onNewChat}><span className="plus" aria-hidden="true">+</span><span>New Chat</span></button>{conversations.length > 0 && <div className="chat-history"><span className="history-label">Previous chats</span>{conversations.map((conversation) => <div className={`history-item${conversation.id === activeId ? ' active' : ''}`} key={conversation.id}><button className="history-open" type="button" onClick={() => onOpen(conversation.id)} title={conversation.title}>{conversation.title}</button><button className="history-delete" type="button" onClick={() => onDelete(conversation.id)} aria-label={`Delete ${conversation.title}`}>×</button></div>)}</div>}</div><div className="sidebar-bottom"><div className="workspace-pill"><span className="workspace-avatar">S</span><span className="workspace-name">Supply team</span><span className="workspace-status" aria-label="Active workspace" /></div><span className="version-label">SUPPLYIQ · V4</span></div></aside>
}
function SuggestedCard({ label, question, onSelect, loading }: { label: string; question: string; onSelect: (question: string) => void; loading: boolean }) { return <button className="suggested-card" type="button" onClick={() => onSelect(question)} disabled={loading}><span className="card-label">{label}</span><span className="card-question">{question}</span><span className="card-arrow" aria-hidden="true">↗</span></button> }
function Composer({ value, onChange, onSubmit, loading }: { value: string; onChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; loading: boolean }) { return <form className="composer" onSubmit={onSubmit}><input aria-label="Ask SupplyIQ a question" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Ask anything about your supply chain..." disabled={loading} /><button className="send-button" type="submit" aria-label="Send question" disabled={loading}><span aria-hidden="true">{loading ? '…' : '↑'}</span></button></form> }

function App() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations)
  const [activeId, setActiveId] = useState<string | null>(() => loadConversations()[0]?.id ?? null)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const loadingRef = useRef(false)
  const activeConversation = conversations.find((conversation) => conversation.id === activeId)
  const messages = activeConversation?.messages ?? []

  useEffect(() => { persistConversations(conversations) }, [conversations])

  const startNewChat = () => { setActiveId(null); setQuestion(''); setError('') }
  const openConversation = (id: string) => { setActiveId(id); setQuestion(''); setError('') }
  const deleteConversation = (id: string) => { setConversations((current) => current.filter((conversation) => conversation.id !== id)); if (activeId === id) startNewChat() }

  const submitQuestion = async (submittedQuestion: string) => {
    const message = submittedQuestion.trim()
    if (!message || loadingRef.current) return
    loadingRef.current = true
    setQuestion(message)
    const conversationId = activeId ?? createConversationId()
    setActiveId(conversationId); setLoading(true); setError('')
    try {
      const response = await fetch(`${apiBaseUrl}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) })
      const data = await response.json().catch(() => ({})) as ChatResponse & { message?: string }
      if (!response.ok) {
        if (data.code === 'AI_USAGE_LIMIT_REACHED') {
          setError('The AI is temporarily unavailable because the API usage limit has been reached. Please try again later.')
          return
        }
        throw new Error(data.message || 'Não foi possível obter uma resposta agora.')
      }
      setConversations((current) => {
        const existing = current.find((conversation) => conversation.id === conversationId)
        const updated: Conversation = existing
          ? { ...existing, messages: [...existing.messages, { question: message, response: data }] }
          : { id: conversationId, title: makeTitle(message), createdAt: Date.now(), messages: [{ question: message, response: data }] }
        return [updated, ...current.filter((conversation) => conversation.id !== conversationId)].slice(0, maximumConversations)
      })
      setQuestion('')
    } catch { setError('Não foi possível conectar ao SupplyIQ. Verifique se o backend está ligado e tente novamente.') } finally { loadingRef.current = false; setLoading(false) }
  }
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void submitQuestion(question) }

  return <div className="app-shell"><Sidebar conversations={conversations} activeId={activeId} onNewChat={startNewChat} onOpen={openConversation} onDelete={deleteConversation} /><main className="main-content"><div className="content-frame">
    <section className="hero" aria-labelledby="hero-title"><div className="eyebrow"><span className="eyebrow-dot" /> Intelligence for better decisions</div><p className="greeting">Good morning, team.</p><h1 id="hero-title">What will we <em>uncover</em><br />today?</h1><p className="hero-copy">Ask SupplyIQ anything about your supply chain, suppliers, and markets.</p></section>
    <section className="suggestions" aria-labelledby="suggestions-title"><div className="section-heading"><h2 id="suggestions-title">Start with a direction</h2><span>Suggested questions</span></div><div className="card-grid">{suggestedQuestions.map((item) => <SuggestedCard key={item.label} {...item} onSelect={(selectedQuestion) => { void submitQuestion(selectedQuestion) }} loading={loading} />)}</div></section>
    {messages.length > 0 && <section className="conversation" aria-label="Conversation">{messages.map(({ question: sentQuestion, response }, index) => <article className="conversation-item" key={`${sentQuestion}-${index}`}><div className="user-message"><span className="message-label">You</span><p>{sentQuestion}</p></div><div className="agent-message"><span className="message-label">SupplyIQ agent</span><MarkdownAnswer content={response.answer || 'No answer was returned.'} />{response.supportLevel && <p className="support-level">Support level: <strong>{response.supportLevel}</strong></p>}{!!response.sources?.length && <div className="response-meta"><span className="meta-title">Fontes</span>{response.sources.map((source, sourceIndex) => <div className="source-item" key={`${source.sourceId || source.name || 'source'}-${sourceIndex}`}><span>{source.name || source.sourceId || 'Unnamed source'}{source.organization ? ` · ${source.organization}` : ''}</span>{source.url && <a href={source.url} target="_blank" rel="noreferrer">Open source</a>}</div>)}</div>}</div></article>)}</section>}
    {error && <p className="chat-error" role="alert">{error}</p>}
    <div className="composer-wrap"><Composer value={question} onChange={setQuestion} onSubmit={handleSubmit} loading={loading} /><p className="disclaimer">SupplyIQ can make mistakes. Check important information before making decisions.</p></div>
  </div></main></div>
}
export default App
