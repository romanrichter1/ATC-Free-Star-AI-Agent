'use client'

import { useChat } from '@ai-sdk/react'
import { useRef, useEffect, useState } from 'react'
import { CalendarPicker } from './CalendarPicker'

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  )
}
function IconSend() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/>
      <path d="m21.854 2.147-10.94 10.939"/>
    </svg>
  )
}
function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  )
}

const WELCOME_CHIPS = [
  { label: 'Rezervovat ubytování', primary: true },
  { label: 'Volné termíny', primary: false },
  { label: 'Ceník', primary: false },
  { label: 'Aktivity v okolí', primary: false },
  { label: 'Kontakt', primary: false },
]

function currentTime() {
  return new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
}

// Parsuje text zprávy — extrahuje SHOW_CALENDAR marker a vrátí čistý text + config
function parseMessage(raw: string): { text: string; calendar: { accommodation?: string; guests?: number } | null } {
  const match = raw.match(/SHOW_CALENDAR:(\{[^}]+\})/)
  if (!match) return { text: raw, calendar: null }
  try {
    const calendar = JSON.parse(match[1])
    const text = raw.replace(/\s*SHOW_CALENDAR:\{[^}]+\}/, '').trim()
    return { text, calendar }
  } catch {
    return { text: raw, calendar: null }
  }
}

function extractText(msg: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!msg.parts) return ''
  return msg.parts
    .filter((p) => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text as string)
    .join('')
}

export function ChatWidgetEmbed() {
  const [inputValue, setInputValue] = useState('')
  const [calendarConfig, setCalendarConfig] = useState<{ accommodation?: string; guests?: number } | null>(null)
  const [calendarMsgId, setCalendarMsgId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status } = useChat({
    onError: (err) => console.error('[Hvězdička] chyba:', err),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Detekce SHOW_CALENDAR markeru v nové bot zprávě
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== 'assistant') return
    const raw = extractText(lastMsg as any)
    const { calendar } = parseMessage(raw)
    if (calendar && lastMsg.id !== calendarMsgId) {
      setCalendarConfig(calendar)
      setCalendarMsgId(lastMsg.id)
    }
  }, [messages, calendarMsgId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, calendarConfig])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  const handleSend = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    setCalendarConfig(null)
    sendMessage({ text: trimmed })
    setInputValue('')
  }

  const handleCalendarConfirm = (dateFrom: string, dateTo: string, nights: number) => {
    setCalendarConfig(null)
    const nightsLabel = nights === 1 ? 'noc' : nights < 5 ? 'noci' : 'nocí'
    handleSend(`📅 Termín: ${dateFrom} – ${dateTo} (${nights} ${nightsLabel})`)
  }

  const handleClose = () => {
    window.parent.postMessage({ type: 'hvezdicka:close' }, '*')
  }

  return (
    <div className="fs" style={{ borderRadius: 0, boxShadow: 'none', height: '100dvh' }}>
      {/* Header */}
      <div className="fs-h">
        <div className="fs-h__av"><IconStar /></div>
        <div className="fs-h__name">
          <div className="fs-h__title">
            <span className="fs-script">Hvězdička</span>
            <span className="fs-h__role">AI průvodce</span>
          </div>
          <div className="fs-h__sub">Online · obvykle odpoví do 5 vteřin</div>
        </div>
        <div className="fs-h__acts">
          <button className="fs-h__ib" title="Zavřít" onClick={handleClose}>
            <IconClose />
          </button>
        </div>
      </div>
      <div className="fs-h__rib" />

      {/* Messages */}
      <div className="fs-c">
        {messages.length === 0 && (
          <>
            <div className="fs-stamp">Dnes {currentTime()}</div>
            <div className="fs-m fs-m--bot">
              <span className="fs-m__av"><IconSparkle /></span>
              <div className="fs-b">
                Vítejte v kempu{' '}
                <b className="fs-script" style={{ fontSize: '1.4em', color: 'var(--fs-yellow-deep)' }}>
                  Free Star
                </b>{' '}✨<br />
                Jsem <b>Hvězdička</b>, váš AI průvodce. S čím vám mohu pomoci?
              </div>
            </div>
            <div className="fs-chips">
              {WELCOME_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  className={`fs-chip${chip.primary ? '' : ' fs-chip--ghost'}`}
                  onClick={() => handleSend(chip.label)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((msg) => {
          const raw = extractText(msg as any)
          if (msg.role === 'assistant' && !raw) return null

          const { text } = msg.role === 'assistant' ? parseMessage(raw) : { text: raw }

          return (
            <div key={msg.id} className={`fs-m fs-m--${msg.role === 'user' ? 'user' : 'bot'}`}>
              {msg.role === 'assistant' && (
                <span className="fs-m__av"><IconSparkle /></span>
              )}
              <div className="fs-b" dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          )
        })}

        {/* Interaktivní kalendář */}
        {calendarConfig && !isLoading && (
          <CalendarPicker
            accommodation={calendarConfig.accommodation}
            guests={calendarConfig.guests}
            onConfirm={handleCalendarConfirm}
          />
        )}

        {isLoading && (
          <div className="fs-m fs-m--bot">
            <span className="fs-m__av"><IconSparkle /></span>
            <div className="fs-typ"><span /><span /><span /></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fs-f">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(inputValue) }}>
          <div className="fs-in">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Napište zprávu…"
              disabled={isLoading}
            />
            <button type="submit" className="fs-in__send" disabled={isLoading || !inputValue.trim()}>
              <IconSend />
            </button>
          </div>
        </form>
        <div className="fs-f__legal">
          <b>Hvězdička</b> využívá AI · <span className="fs-yellow-dot">●</span> Vaše data zůstávají u nás
        </div>
      </div>
    </div>
  )
}
