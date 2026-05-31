'use client'

import { useState } from 'react'

interface Props {
  onConfirm: (dateFrom: string, dateTo: string, nights: number) => void
  accommodation?: string
  guests?: number
}

const MONTHS_CS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec']
const DAYS_CS = ['Po','Út','St','Čt','Pá','So','Ne']

const CSS = `
.hv-cal { background:#fff; border:1px solid rgba(35,49,37,.10); border-radius:14px; padding:14px; box-shadow:0 1px 2px rgba(35,49,37,.05),0 6px 16px rgba(35,49,37,.08); margin-left:34px; }
.hv-cal__h { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.hv-cal__t { font-family:'Playfair Display',Georgia,serif; font-size:17px; font-weight:700; color:#233125; }
.hv-cal__nb { width:28px; height:28px; border-radius:8px; border:1px solid rgba(35,49,37,.10); background:#fff; cursor:pointer; font-size:16px; display:inline-flex; align-items:center; justify-content:center; color:#233125; }
.hv-cal__nb:hover { background:#F2E9D4; }
.hv-cal__g { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
.hv-cal__dow { text-align:center; font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#9A9382; padding:4px 0; }
.hv-cal__d { aspect-ratio:1; display:inline-flex; align-items:center; justify-content:center; font-size:13px; font-weight:500; color:#233125; border-radius:8px; background:transparent; border:none; cursor:pointer; font-family:inherit; width:100%; }
.hv-cal__d:hover:not(:disabled) { background:#F2E9D4; }
.hv-cal__d:disabled { color:#9A9382; opacity:.4; cursor:not-allowed; text-decoration:line-through; }
.hv-cal__d.out { color:#9A9382; opacity:.3; cursor:default; pointer-events:none; }
.hv-cal__d.today { font-weight:800; }
.hv-cal__d.today::after { content:""; display:block; width:3px; height:3px; border-radius:999px; background:#C68E1C; margin:-2px auto 0; }
.hv-cal__d.in-range { background:#F6E7BE; border-radius:0; }
.hv-cal__d.is-start { background:#233125; color:#fff; border-radius:8px 0 0 8px; }
.hv-cal__d.is-end { background:#233125; color:#fff; border-radius:0 8px 8px 0; }
.hv-cal__d.is-start.is-end { border-radius:8px; }
.hv-cal__rg { display:flex; align-items:center; gap:10px; background:#FBF2D9; border:1px solid #E0A82E; border-radius:14px; padding:10px 12px; margin-top:12px; }
.hv-cal__rg-c { flex:1; }
.hv-cal__rg-l { font-size:9px; letter-spacing:.08em; text-transform:uppercase; font-weight:700; color:#6B6553; }
.hv-cal__rg-v { font-size:14px; font-weight:700; color:#233125; margin-top:2px; }
.hv-cal__rg-n { font-size:10px; font-weight:700; color:#233125; background:#fff; border:1px solid rgba(35,49,37,.10); border-radius:999px; padding:4px 9px; white-space:nowrap; }
.hv-cal__confirm { width:100%; margin-top:10px; padding:12px; border-radius:999px; background:#C77A52; border:none; color:#fff; font-weight:700; font-size:14px; cursor:pointer; font-family:inherit; }
.hv-cal__confirm:hover { background:#D38E66; }
.hv-cal__hint { text-align:center; font-size:12px; color:#6B6553; margin-top:10px; }
.hv-cal__sub { text-align:center; font-size:11px; color:#9A9382; margin-top:6px; }
`

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
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
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
    </>
  )
}
