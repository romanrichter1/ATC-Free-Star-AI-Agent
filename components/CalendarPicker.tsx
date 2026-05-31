'use client'

import { useState } from 'react'

interface Props {
  onConfirm: (dateFrom: string, dateTo: string, nights: number) => void
  accommodation?: string
  guests?: number
}

const MONTHS_CS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec']
const DAYS_CS = ['Po','Út','St','Čt','Pá','So','Ne']

function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startDow = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: { day: number; date: Date; inMonth: boolean }[] = []
  const prevDays = new Date(year, month, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, date: new Date(year, month - 1, prevDays - i), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, month, d), inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const d = cells.length - startDow - daysInMonth + 1
    cells.push({ day: d, date: new Date(year, month + 1, d), inMonth: false })
  }
  return cells
}

function toISO(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatCS(date: Date) {
  return `${date.getDate()}. ${date.getMonth() + 1}.`
}

export function CalendarPicker({ onConfirm, guests = 2 }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [start, setStart] = useState<Date | null>(null)
  const [end, setEnd] = useState<Date | null>(null)
  const [hover, setHover] = useState<Date | null>(null)

  const cells = buildMonth(year, month)

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const handleDay = (date: Date) => {
    if (date < today) return
    if (!start || (start && end)) {
      setStart(date); setEnd(null)
    } else {
      if (date <= start) { setStart(date); setEnd(null) }
      else setEnd(date)
    }
  }

  const isStart = (date: Date) => start && toISO(date) === toISO(start)
  const isEnd = (date: Date) => end && toISO(date) === toISO(end)
  const isInRange = (date: Date) => {
    const ref = end || hover
    if (!start || !ref) return false
    return date > start && date < ref
  }

  const nights = start && end ? Math.round((end.getTime() - start.getTime()) / 86400000) : 0

  const confirm = () => {
    if (!start || !end) return
    onConfirm(toISO(start), toISO(end), nights)
  }

  return (
    <div className="fs-cal" style={{ marginLeft: 34 }}>
      <div className="fs-cal__h">
        <button className="fs-cal__nb" onClick={prevMonth}>&#8249;</button>
        <div className="fs-cal__t">{MONTHS_CS[month]} {year}</div>
        <button className="fs-cal__nb" onClick={nextMonth}>&#8250;</button>
      </div>
      <div className="fs-cal__g">
        {DAYS_CS.map(d => <div key={d} className="fs-cal__dow">{d}</div>)}
        {cells.map((c, i) => {
          if (!c.inMonth) return <div key={i} className="fs-cal__d is-out">{c.day}</div>
          const isPast = c.date < today
          const cls = ['fs-cal__d']
          if (isPast) cls.push('is-dis')
          if (isStart(c.date)) cls.push('is-s')
          if (isEnd(c.date)) cls.push('is-e')
          if (isInRange(c.date)) cls.push('is-in')
          if (toISO(c.date) === toISO(today)) cls.push('is-today')
          return (
            <button
              key={i}
              className={cls.join(' ')}
              onClick={() => handleDay(c.date)}
              onMouseEnter={() => start && !end && setHover(c.date)}
              onMouseLeave={() => setHover(null)}
              disabled={isPast}
            >
              {c.day}
            </button>
          )
        })}
      </div>

      {start && end && (
        <>
          <div className="fs-cal__rg">
            <div className="fs-cal__rg-c">
              <div className="fs-cal__rg-l">Příjezd</div>
              <div className="fs-cal__rg-v">{formatCS(start)}</div>
            </div>
            <span className="fs-cal__rg-ar">→</span>
            <div className="fs-cal__rg-c">
              <div className="fs-cal__rg-l">Odjezd</div>
              <div className="fs-cal__rg-v">{formatCS(end)}</div>
            </div>
            <div className="fs-cal__rg-n">{nights} {nights === 1 ? 'noc' : nights < 5 ? 'noci' : 'nocí'}</div>
          </div>
          <button
            className="fs-cta"
            style={{ width: '100%', marginTop: 10 }}
            onClick={confirm}
          >
            ✓ Potvrdit termín
          </button>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--fs-subtle)', marginTop: 6 }}>
            {guests} {guests === 1 ? 'osoba' : guests < 5 ? 'osoby' : 'osob'} · check-in od 15:00
          </div>
        </>
      )}

      {start && !end && (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--fs-mute)', marginTop: 10 }}>
          Nyní klikni na datum odjezdu 👆
        </div>
      )}

      {!start && (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--fs-mute)', marginTop: 10 }}>
          Klikni na datum příjezdu 👆
        </div>
      )}
    </div>
  )
}
