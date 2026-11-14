import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot, BookOpen, ChevronDown, Clock3, LoaderCircle, MessageCircle,
  Plus, Send, Sparkles, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { courses } from '../data/courses'
import '../styles/nile-bot.css'

const suggestions = [
  'Teach me how to clean a dataset.',
  'Explain descriptive statistics with an example.',
  'Help me understand a regression result.',
]

function MessageContent({ content }) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return parts.map((part, index) => {
    const code = part.match(/^```[a-zA-Z0-9_+.-]*\s*\n([\s\S]*?)```$/)
    return code
      ? <pre key={index}><code>{code[1].replace(/\n$/, '')}</code></pre>
      : <span key={index}>{part}</span>
  })
}

function MessageBubble({ message }) {
  return (
    <article className={`nile-message ${message.role === 'user' ? 'nile-message-user' : 'nile-message-assistant'}`}>
      {message.role === 'assistant' && <span className="nile-message-avatar"><Bot size={15} /></span>}
      <div className="nile-message-body">
        <div className="nile-message-content"><MessageContent content={message.content} /></div>
        {message.sources?.length > 0 && (
          <div className="nile-message-sources">
            <span><BookOpen size={12} /> Course references</span>
            {message.sources.map((source, index) => (
              <small key={`${source.lessonTitle}-${index}`}>
                {source.lessonTitle} · {source.courseTitle}
              </small>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

export default function NileBot() {
  const { user, profile, loading: authLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [courseSlug, setCourseSlug] = useState('')
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [notice, setNotice] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!open || !user) return
    let active = true
    setLoadingHistory(true)
    supabase
      .from('nile_bot_conversations')
      .select('id, title, course_slug, updated_at')
      .order('updated_at', { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (!active) return
        if (error) setNotice('Nile Bot setup is not complete yet. Please try again after the administrator finishes setup.')
        else setConversations(data || [])
        setLoadingHistory(false)
      })
    return () => { active = false }
  }, [open, user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending])

  async function refreshConversations() {
    if (!user) return
    const { data, error } = await supabase
      .from('nile_bot_conversations')
      .select('id, title, course_slug, updated_at')
      .order('updated_at', { ascending: false })
      .limit(12)
    if (!error) setConversations(data || [])
  }

  function startNewConversation() {
    setConversationId(null)
    setMessages([])
    setCourseSlug('')
    setDraft('')
    setNotice('')
    setHistoryOpen(false)
    textareaRef.current?.focus()
  }

  async function openConversation(conversation) {
    setLoadingHistory(true)
    setNotice('')
    const { data, error } = await supabase
      .from('nile_bot_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(60)

    if (error) {
      setNotice('We could not load that conversation. Please try again.')
    } else {
      setConversationId(conversation.id)
      setCourseSlug(conversation.course_slug || '')
      setMessages((data || []).reverse())
      setHistoryOpen(false)
    }
    setLoadingHistory(false)
  }

  async function sendMessage(value = draft) {
    const message = value.trim()
    if (!message || sending) return
    if (!user) {
      setNotice('Please sign in to start learning with Nile Bot.')
      return
    }

    setNotice('')
    setDraft('')
    setSending(true)

    const temporaryId = `local-${Date.now()}`
    setMessages(previous => [...previous, {
      id: temporaryId,
      role: 'user',
      content: message,
    }])

    const { data, error } = await supabase.functions.invoke('nile-bot', {
      body: {
        message,
        conversationId,
        courseSlug: courseSlug || null,
      },
    })

    if (error || data?.error) {
      let errorMessage = data?.error || error?.message || 'Nile Bot could not respond. Please try again.'
      if (error?.context instanceof Response) {
        try {
          const payload = await error.context.clone().json()
          if (payload?.error) errorMessage = payload.error
        } catch {
          // Keep the safe fallback message.
        }
      }
      setMessages(previous => [...previous, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMessage,
      }])
      setSending(false)
      return
    }

    setConversationId(data.conversationId)
    setMessages(previous => [...previous, {
      id: `answer-${Date.now()}`,
      role: 'assistant',
      content: data.answer,
      sources: data.sources || [],
    }])
    await refreshConversations()
    setSending(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <button
        type="button"
        className={open ? 'nile-bot-launcher is-open' : 'nile-bot-launcher'}
        onClick={() => { setOpen(value => !value); setNotice('') }}
        aria-label={open ? 'Close Nile Bot' : 'Open Nile Bot learning assistant'}
        aria-expanded={open}
      >
        {open ? <X size={22} /> : <><Sparkles size={18} /><span>Ask Nile Bot</span></>}
      </button>

      {open && (
        <section className="nile-bot-panel" aria-label="Nile Bot learning assistant">
          <header className="nile-bot-header">
            <div className="nile-bot-brand">
              <span className="nile-bot-brand-icon"><Bot size={21} /></span>
              <div><strong>Nile Bot</strong><small>Your data learning assistant</small></div>
            </div>
            <div className="nile-bot-header-actions">
              {user && <>
                <button type="button" title="New conversation" aria-label="New conversation" onClick={startNewConversation}><Plus size={18} /></button>
                <button type="button" title="Conversation history" aria-label="Conversation history" onClick={() => setHistoryOpen(value => !value)}><Clock3 size={17} /></button>
              </>}
              <button type="button" title="Close" aria-label="Close Nile Bot" onClick={() => setOpen(false)}><X size={19} /></button>
            </div>
          </header>

          {!user && !authLoading ? (
            <div className="nile-bot-signin">
              <span className="nile-bot-welcome-icon"><Bot size={30} /></span>
              <h3>Learn with Nile Bot</h3>
              <p>Sign in to ask questions about Excel, Stata, R Programming and SPSS, and keep your conversation history.</p>
              <Link className="btn btn-primary full" to="/login" onClick={() => setOpen(false)}>Sign in</Link>
              <Link className="nile-bot-register" to="/register" onClick={() => setOpen(false)}>Create a learner account</Link>
            </div>
          ) : authLoading ? (
            <div className="nile-bot-loading"><LoaderCircle className="nile-bot-spin" size={23} /> Checking your account…</div>
          ) : historyOpen ? (
            <div className="nile-bot-history">
              <div className="nile-bot-history-heading"><strong>Recent conversations</strong><button type="button" onClick={startNewConversation}>New chat</button></div>
              {loadingHistory ? <div className="nile-bot-loading"><LoaderCircle className="nile-bot-spin" size={20} /> Loading history…</div> :
                conversations.length ? conversations.map(conversation => (
                  <button type="button" className="nile-bot-history-item" key={conversation.id} onClick={() => openConversation(conversation)}>
                    <MessageCircle size={16} />
                    <span><strong>{conversation.title}</strong><small>{conversation.course_slug ? courses.find(course => course.slug === conversation.course_slug)?.category || 'Course chat' : 'All courses'}</small></span>
                    <ChevronDown size={14} />
                  </button>
                )) : <p className="nile-bot-history-empty">Your conversations will appear here.</p>}
            </div>
          ) : (
            <>
              <div className="nile-bot-course-select">
                <label htmlFor="nile-bot-course">Learning area</label>
                <select
                  id="nile-bot-course"
                  value={courseSlug}
                  onChange={event => setCourseSlug(event.target.value)}
                  disabled={Boolean(conversationId) || sending}
                >
                  <option value="">All courses and data topics</option>
                  {courses.map(course => <option key={course.slug} value={course.slug}>{course.category}</option>)}
                </select>
              </div>

              <div className="nile-bot-chat" aria-live="polite">
                {messages.length === 0 ? (
                  <div className="nile-bot-welcome">
                    <span className="nile-bot-welcome-icon"><Bot size={30} /></span>
                    <h3>Hello{(profile?.full_name?.trim() || user.user_metadata?.full_name) ? `, ${(profile?.full_name?.trim() || user.user_metadata.full_name).split(/\s+/)[0]}` : ''}!</h3>
                    <p>I'm Nile Bot. Ask me to explain a concept, guide you through a data task, or help you understand code and statistical results.</p>
                    <div className="nile-bot-suggestions">
                      {suggestions.map(item => <button type="button" key={item} onClick={() => sendMessage(item)} disabled={sending}>{item}<span>↗</span></button>)}
                    </div>
                  </div>
                ) : messages.map(message => <MessageBubble key={message.id} message={message} />)}
                {sending && <div className="nile-bot-thinking"><span /><span /><span /> Nile Bot is thinking…</div>}
                <div ref={messagesEndRef} />
              </div>

              {notice && <div className="nile-bot-notice" role="alert">{notice}</div>}
              <form className="nile-bot-composer" onSubmit={event => { event.preventDefault(); sendMessage() }}>
                <textarea
                  ref={textareaRef}
                  rows="1"
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about data analysis…"
                  maxLength={4000}
                  disabled={sending}
                  aria-label="Message Nile Bot"
                />
                <button type="submit" disabled={!draft.trim() || sending} aria-label="Send message"><Send size={18} /></button>
              </form>
              <footer className="nile-bot-disclaimer">Chats are saved to your account and sent to OpenAI to generate replies. Don't share secrets. AI can make mistakes.</footer>
            </>
          )}
        </section>
      )}
    </>
  )
}
