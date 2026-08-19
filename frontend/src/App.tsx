import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

const suggestedQuestions = [
  { label: 'Market intelligence', question: 'What are the latest trends in our supply market?' },
  { label: 'Supplier risk', question: 'Which supplier risks should we prioritize this quarter?' },
  { label: 'Cost analysis', question: 'How can we identify the biggest opportunities to reduce cost?' },
  { label: 'Strategic sourcing', question: 'Help me build a strategic sourcing brief for a new category.' },
]

type Source = { sourceId?: string; name?: string; organization?: string; url?: string; limitations?: string }
type ChatResponse = { answer?: string; sources?: Source[]; limitations?: string[]; supportLevel?: string }
type Message = { question: string; response: ChatResponse }

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    return <span key={index}>{part}</span>
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
function Sidebar({ onNewChat }: { onNewChat: () => void }) { return <aside className="sidebar" aria-label="SupplyIQ navigation"><div className="sidebar-top"><a className="brand" href="/" aria-label="SupplyIQ home"><BrandMark /><span>SupplyIQ</span></a><button className="new-chat-button" type="button" onClick={onNewChat}><span className="plus" aria-hidden="true">+</span><span>New Chat</span></button></div><div className="sidebar-bottom"><div className="workspace-pill"><span className="workspace-avatar">S</span><span className="workspace-name">Supply team</span><span className="workspace-status" aria-label="Active workspace" /></div><span className="version-label">SUPPLYIQ · V4</span></div></aside> }
function SuggestedCard({ label, question, onSelect }: { label: string; question: string; onSelect: (question: string) => void }) { return <button className="suggested-card" type="button" onClick={() => onSelect(question)}><span className="card-label">{label}</span><span className="card-question">{question}</span><span className="card-arrow" aria-hidden="true">↗</span></button> }
function Composer({ value, onChange, onSubmit, loading }: { value: string; onChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; loading: boolean }) { return <form className="composer" onSubmit={onSubmit}><input aria-label="Ask SupplyIQ a question" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Ask anything about your supply chain..." disabled={loading} /><button className="send-button" type="submit" aria-label="Send question" disabled={loading}><span aria-hidden="true">{loading ? '…' : '↑'}</span></button></form> }

function App() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = question.trim()
    if (!message || loading) return
    setLoading(true); setError('')
    try {
      const response = await fetch('http://127.0.0.1:3000/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) })
      const data = await response.json().catch(() => ({})) as ChatResponse & { message?: string }
      if (!response.ok) throw new Error(data.message || 'Não foi possível obter uma resposta agora.')
      setMessages((current) => [...current, { question: message, response: data }]); setQuestion('')
    } catch { setError('Não foi possível conectar ao SupplyIQ. Verifique se o backend está ligado e tente novamente.') } finally { setLoading(false) }
  }
  return <div className="app-shell"><Sidebar onNewChat={() => { setQuestion(''); setMessages([]); setError('') }} /><main className="main-content"><div className="content-frame">
    <section className="hero" aria-labelledby="hero-title"><div className="eyebrow"><span className="eyebrow-dot" /> Intelligence for better decisions</div><p className="greeting">Good morning, team.</p><h1 id="hero-title">What will we <em>uncover</em><br />today?</h1><p className="hero-copy">Ask SupplyIQ anything about your supply chain, suppliers, and markets.</p></section>
    <section className="suggestions" aria-labelledby="suggestions-title"><div className="section-heading"><h2 id="suggestions-title">Start with a direction</h2><span>Suggested questions</span></div><div className="card-grid">{suggestedQuestions.map((item) => <SuggestedCard key={item.label} {...item} onSelect={setQuestion} />)}</div></section>
    {messages.length > 0 && <section className="conversation" aria-label="Conversation">{messages.map(({ question: sentQuestion, response }, index) => <article className="conversation-item" key={`${sentQuestion}-${index}`}><div className="user-message"><span className="message-label">You</span><p>{sentQuestion}</p></div><div className="agent-message"><span className="message-label">SupplyIQ agent</span><MarkdownAnswer content={response.answer || 'No answer was returned.'} />{response.supportLevel && <p className="support-level">Support level: <strong>{response.supportLevel}</strong></p>}{!!response.sources?.length && <div className="response-meta"><span className="meta-title">Fontes</span>{response.sources.map((source, sourceIndex) => <div className="source-item" key={`${source.sourceId || source.name || 'source'}-${sourceIndex}`}><span>{source.name || source.sourceId || 'Unnamed source'}{source.organization ? ` · ${source.organization}` : ''}</span>{source.url && <a href={source.url} target="_blank" rel="noreferrer">Open source</a>}</div>)}</div>}</div></article>)}</section>}
    {error && <p className="chat-error" role="alert">{error}</p>}
    <div className="composer-wrap"><Composer value={question} onChange={setQuestion} onSubmit={handleSubmit} loading={loading} /><p className="disclaimer">SupplyIQ can make mistakes. Check important information before making decisions.</p></div>
  </div></main></div>
}
export default App
