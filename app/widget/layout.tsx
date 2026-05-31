import type { Metadata } from 'next'
import '../chatbot.css'

export const metadata: Metadata = {
  title: 'Hvězdička – AI průvodce',
}

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body style={{ margin: 0, padding: 0, background: 'transparent', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
