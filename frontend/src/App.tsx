import { useState } from 'react'
import type { FormEvent } from 'react'

const suggestedQuestions = [
  { label: 'Market intelligence', question: 'What are the latest trends in our supply market?' },
  { label: 'Supplier risk', question: 'Which supplier risks should we prioritize this quarter?' },
  { label: 'Cost analysis', question: 'How can we identify the biggest opportunities to reduce cost?' },
  { label: 'Strategic sourcing', question: 'Help me build a strategic sourcing brief for a new category.' },
]

function BrandMark() {
  return <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
}

function Sidebar({ onNewChat }: { onNewChat: () => void }) {
  return (
    <aside className="sidebar" aria-label="SupplyIQ navigation">
      <div className="sidebar-top">
        <a className="brand" href="/" aria-label="SupplyIQ home"><BrandMark /><span>SupplyIQ</span></a>
        <button className="new-chat-button" type="button" onClick={onNewChat}>
          <span className="plus" aria-hidden="true">+</span><span>New Chat</span>
        </button>
      </div>
      <div className="sidebar-bottom">
        <div className="workspace-pill"><span className="workspace-avatar">S</span><span className="workspace-name">Supply team</span><span className="workspace-status" aria-label="Active workspace" /></div>
        <span className="version-label">SUPPLYIQ · V4</span>
      </div>
    </aside>
  )
}

function SuggestedCard({ label, question, onSelect }: { label: string; question: string; onSelect: (question: string) => void }) {
  return <button className="suggested-card" type="button" onClick={() => onSelect(question)}><span className="card-label">{label}</span><span className="card-question">{question}</span><span className="card-arrow" aria-hidden="true">↗</span></button>
}

function Composer({ value, onChange, onSubmit }: { value: string; onChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="composer" onSubmit={onSubmit}>
      <input aria-label="Ask SupplyIQ a question" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Ask anything about your supply chain..." />
      <button className="send-button" type="submit" aria-label="Send question"><span aria-hidden="true">↑</span></button>
    </form>
  )
}

function App() {
  const [question, setQuestion] = useState('')
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => event.preventDefault()

  return (
    <div className="app-shell">
      <Sidebar onNewChat={() => setQuestion('')} />
      <main className="main-content">
        <div className="content-frame">
          <section className="hero" aria-labelledby="hero-title">
            <div className="eyebrow"><span className="eyebrow-dot" /> Intelligence for better decisions</div>
            <p className="greeting">Good morning, team.</p>
            <h1 id="hero-title">What will we <em>uncover</em><br />today?</h1>
            <p className="hero-copy">Ask SupplyIQ anything about your supply chain, suppliers, and markets.</p>
          </section>
          <section className="suggestions" aria-labelledby="suggestions-title">
            <div className="section-heading"><h2 id="suggestions-title">Start with a direction</h2><span>Suggested questions</span></div>
            <div className="card-grid">{suggestedQuestions.map((item) => <SuggestedCard key={item.label} {...item} onSelect={setQuestion} />)}</div>
          </section>
          <div className="composer-wrap">
            <Composer value={question} onChange={setQuestion} onSubmit={handleSubmit} />
            <p className="disclaimer">SupplyIQ can make mistakes. Check important information before making decisions.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
