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
  const prevDays = new Date(year, month, 0).getDate()
  const cells: { day: number; date: Date; inMonth: boolean }[] = []
  for (let i = startDow - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, date: new Date(year, month - 1, prevDays - i), inMonth: false })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, date: new Date(year, month, d), inMonth: true })
  while (cells.length % 7 !== 0) {
    const d = cells.length - startDow - daysInMonth + 1
    cells.push({ day: d, date: new Date(year, month + 1, d), inMonth: false })
  }
  return cells
}

function toISO(d: Date) { return d.toISOString().slice(0, 10) }
function fmtCS(d: Date) { return `${d.getDate()}. ${d.getMonth() + 1}.` }

export function CalendarPicker({ onConfirm, guests = 2 }: Props) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [start, setStart] = useState<Date | null>(null)
  const [end, setEnd] = useState<Date | null>(null)
  const [hover, setHover] = useState<Date | null>(null)

  const cells = buildMonth(year, month)

  const prevMonth = () => month === 0 ? (setMonth(11), setYear(y => y-1)) : setMonth(m => m-1)
  const nextMonth = () => month === 11 ? (setMonth(0), setYear(y => y+1)) : setMonth(m => m+1)

  const handleDay = (date: Date) => {
    if (date < today) return
    if (!start || (start && end)) { setStart(date); setEnd(null) }
    else if (date <= start) { setStart(date); setEnd(null) }
    else setEnd(date)
  }

  const nights = start && end ? Math.round((end.getTime() - start.getTime()) / 86400000) : 0
  const nightsLabel = nights === 1 ? 'noc' : nights < 5 ? 'noci' : 'nocí'
  const guestsLabel = guests === 1 ? 'osoba' : guests < 5 ? 'osoby' : 'osob'

  const getCls = (c: { day: number; date: Date; inMonth: boolean }) => {
    if (!c.inMonth) return 'hv-cal__d out'
    const cls = ['hv-cal__d']
    if (c.date < today) return 'hv-cal__d'  // disabled handled by button prop
    const ref = end || hover
    if (start && toISO(c.date) === toISO(start)) cls.push('is-start')
    if (end && toISO(c.date) === toISO(end)) cls.push('is-end')
    if (start && ref && c.date > start && c.date < ref) cls.push('in-range')
    if (toISO(c.date) === toISO(today)) cls.push('today')
    return cls.join(' ')
  }

  return (
    <div className="hv-cal">
        <div className="hv-cal__h">
          <button className="hv-cal__nb" onClick={prevMonth}>‹</button>
          <div className="hv-cal__t">{MONTHS_CS[month]} {year}</div>
          <button className="hv-cal__nb" onClick={nextMonth}>›</button>
        </div>

        <div className="hv-cal__g">
          {DAYS_CS.map(d => <div key={d} className="hv-cal__dow">{d}</div>)}
          {cells.map((c, i) => (
            <button
              key={i}
              className={getCls(c)}
              onClick={() => c.inMonth && handleDay(c.date)}
              onMouseEnter={() => c.inMonth && start && !end && setHover(c.date)}
              onMouseLeave={() => setHover(null)}
              disabled={c.inMonth && c.date < today}
            >
              {c.day}
            </button>
          ))}
        </div>

        {start && end ? (
          <>
            <div className="hv-cal__rg">
              <div className="hv-cal__rg-c">
                <div className="hv-cal__rg-l">Příjezd</div>
                <div className="hv-cal__rg-v">{fmtCS(start)}</div>
              </div>
              <span style={{color:'#233125',opacity:.4}}>→</span>
              <div className="hv-cal__rg-c">
                <div className="hv-cal__rg-l">Odjezd</div>
                <div className="hv-cal__rg-v">{fmtCS(end)}</div>
              </div>
              <div className="hv-cal__rg-n">{nights} {nightsLabel}</div>
            </div>
            <button className="hv-cal__confirm" onClick={() => onConfirm(toISO(start), toISO(end), nights)}>
              ✓ Potvrdit termín
            </button>
            <div className="hv-cal__sub">{guests} {guestsLabel} · check-in od 15:00</div>
          </>
        ) : (
          <div className="hv-cal__hint">
            {!start ? '👆 Klikni na datum příjezdu' : '👆 Klikni na datum odjezdu'}
          </div>
        )}
      </div>
  )
}
