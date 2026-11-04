import { utcMs } from '../../../lib/dates'

/** Strictly parse "YYYY-MM-DD" (4–6 digit year) and "HH:MM"; null if anything is out of range. */
export function parseDateTime(date: string, time: string) {
  const dm = /^(\d{4,6})-(\d{2})-(\d{2})$/.exec(date)
  const tm = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time)
  if (!dm || !tm) return null
  const [y, mo, d, h, mi] = [dm[1], dm[2], dm[3], tm[1], tm[2]].map(Number)
  if (y < 1 || y > 275000 || mo < 1 || mo > 12 || h > 23 || mi > 59) return null
  const check = new Date(utcMs(y, mo, d))
  if (d < 1 || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null
  return { y, mo, d, h, mi }
}
