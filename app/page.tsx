import { ChatWidget } from '@/components/ChatWidget'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-6xl mb-4">🏕️</div>
        <h1 className="text-3xl font-bold text-green-900 mb-2">Kemp Demo</h1>
        <p className="text-gray-600">Chat asistent je dostupný vpravo dole.</p>
      </div>
      <ChatWidget />
    </main>
  )
}
