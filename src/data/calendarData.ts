import { MEMBERS } from './mockData'

export interface DayAvailability {
  morning: string[] // memberIds
  evening: string[] // memberIds
}

// dateKey format: "YYYY-MM-DD"
export type CalendarAvailability = Record<string, DayAvailability>

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function today(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function isPast(dateStr: string): boolean {
  return dateStr < dateKey(today())
}

export function isWithin90Days(dateStr: string): boolean {
  const limit = new Date(today())
  limit.setDate(limit.getDate() + 90)
  return dateStr >= dateKey(today()) && dateStr <= dateKey(limit)
}

// Seed mock availability data
function seedAvailability(): CalendarAvailability {
  const data: CalendarAvailability = {}
  const base = today()

  const scenarios: Array<{
    offset: number
    morning: string[]
    evening: string[]
  }> = [
    {
      offset: 0,
      morning: ['m1', 'm2', 'm3'],
      evening: ['m1', 'm4', 'm5', 'm6'],
    },
    { offset: 1, morning: ['m2', 'm5', 'm7', 'm8'], evening: ['m2', 'm3'] },
    {
      offset: 2,
      morning: ['m1', 'm3', 'm9'],
      evening: ['m1', 'm2', 'm3', 'm9', 'm10'],
    },
    { offset: 3, morning: ['m4', 'm6', 'm11', 'm12'], evening: ['m4', 'm6'] },
    {
      offset: 5,
      morning: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'],
      evening: ['m1', 'm2', 'm3', 'm7'],
    },
    {
      offset: 6,
      morning: ['m7', 'm8', 'm9'],
      evening: ['m5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11'],
    },
    { offset: 8, morning: ['m1', 'm11'], evening: ['m1', 'm2', 'm11', 'm12'] },
    { offset: 9, morning: ['m3', 'm5', 'm6', 'm8'], evening: ['m3', 'm5'] },
    {
      offset: 10,
      morning: ['m2', 'm4', 'm9', 'm10'],
      evening: ['m2', 'm4', 'm9', 'm10', 'm11', 'm12'],
    },
    {
      offset: 12,
      morning: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'],
      evening: ['m1', 'm2', 'm3', 'm4'],
    },
    { offset: 13, morning: ['m6', 'm7'], evening: ['m6', 'm7', 'm8', 'm9'] },
    {
      offset: 15,
      morning: ['m1', 'm3', 'm5', 'm7', 'm9', 'm11'],
      evening: ['m2', 'm4', 'm6', 'm8', 'm10', 'm12'],
    },
    {
      offset: 17,
      morning: ['m2', 'm4'],
      evening: ['m1', 'm2', 'm3', 'm4', 'm5'],
    },
    { offset: 19, morning: ['m8', 'm9', 'm10', 'm11'], evening: ['m8', 'm9'] },
    {
      offset: 20,
      morning: ['m1', 'm5', 'm6'],
      evening: ['m1', 'm2', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'],
    },
    { offset: 22, morning: ['m3', 'm4', 'm7', 'm12'], evening: ['m3', 'm4'] },
    {
      offset: 25,
      morning: ['m1', 'm2', 'm3', 'm4', 'm5'],
      evening: ['m6', 'm7', 'm8'],
    },
    {
      offset: 27,
      morning: ['m9', 'm10', 'm11', 'm12'],
      evening: ['m9', 'm10', 'm11'],
    },
    {
      offset: 30,
      morning: ['m1', 'm2', 'm6', 'm7'],
      evening: ['m1', 'm2', 'm3', 'm6', 'm7', 'm8'],
    },
    {
      offset: 33,
      morning: ['m4', 'm5', 'm8', 'm9', 'm10'],
      evening: ['m4', 'm5'],
    },
    {
      offset: 35,
      morning: ['m1', 'm3', 'm5', 'm7', 'm9', 'm11', 'm12'],
      evening: ['m2', 'm4', 'm6', 'm8', 'm10'],
    },
    {
      offset: 38,
      morning: ['m2', 'm6', 'm11'],
      evening: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9'],
    },
    { offset: 40, morning: ['m7', 'm8', 'm9', 'm10'], evening: ['m7', 'm8'] },
    {
      offset: 42,
      morning: ['m1', 'm4', 'm12'],
      evening: ['m1', 'm4', 'm5', 'm12'],
    },
    {
      offset: 45,
      morning: ['m2', 'm3', 'm5', 'm6', 'm10', 'm11'],
      evening: ['m2', 'm3', 'm5', 'm6'],
    },
    {
      offset: 48,
      morning: ['m1', 'm7', 'm8', 'm9'],
      evening: ['m1', 'm2', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'],
    },
    {
      offset: 50,
      morning: ['m4', 'm6', 'm11', 'm12'],
      evening: ['m4', 'm6', 'm11'],
    },
    {
      offset: 55,
      morning: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10'],
      evening: ['m1', 'm2', 'm3'],
    },
  ]

  for (const s of scenarios) {
    const d = new Date(base)
    d.setDate(d.getDate() + s.offset)
    const key = dateKey(d)
    data[key] = { morning: s.morning, evening: s.evening }
  }

  return data
}

export const INITIAL_CALENDAR_AVAILABILITY: CalendarAvailability =
  seedAvailability()

export function getBestSlots(
  availability: CalendarAvailability,
  year: number,
  month: number,
): Set<string> {
  let max = 0
  const candidates: string[] = []

  Object.entries(availability).forEach(([key, val]) => {
    const d = new Date(key + 'T00:00:00')
    if (d.getFullYear() !== year || d.getMonth() !== month) return
    if (val.morning.length > max) max = val.morning.length
    if (val.evening.length > max) max = val.evening.length
  })

  if (max === 0) return new Set()

  Object.entries(availability).forEach(([key, val]) => {
    const d = new Date(key + 'T00:00:00')
    if (d.getFullYear() !== year || d.getMonth() !== month) return
    if (val.morning.length === max) candidates.push(`${key}:morning`)
    if (val.evening.length === max) candidates.push(`${key}:evening`)
  })

  return new Set(candidates)
}
