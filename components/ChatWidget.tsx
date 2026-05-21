'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useRef, useEffect } from 'react'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat()

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <>
      {/* Plovoucí tlačítko */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-700 hover:bg-green-800 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all"
        aria-label={isOpen ? 'Zavřít chat' : 'Otevřít chat asistenta'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat okno */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          style={{ height: '480px' }}>
          {/* Hlavička */}
          <div className="bg-green-700 text-white px-4 py-3 flex items-center gap-2">
            <span className="text-lg">🏕️</span>
            <div>
              <div className="font-semibold text-sm">Asistent kempu</div>
              <div className="text-xs text-green-200">Online — odpovím za okamžik</div>
            </div>
          </div>

          {/* Zprávy */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                <div className="text-3xl mb-2">👋</div>
                <p>Ahoj! Jak vám mohu pomoci?</p>
                <p className="mt-1 text-xs">Zeptejte se na dostupnost, ceny nebo vybavení.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-green-700 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.parts
                    .filter((p) => p.type === 'text')
                    .map((p) => (p as { type: 'text'; text: string }).text)
                    .join('')}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 text-gray-400 text-sm shadow-sm">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center text-red-500 text-xs py-2">
                Chyba připojení. Zkuste to znovu.
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Napište dotaz..."
                disabled={isLoading}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-full w-9 h-9 flex items-center justify-center text-sm transition-colors flex-shrink-0"
              >
                →
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
