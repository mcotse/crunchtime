import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Member } from '../data/mockData'
import { GroupEvent } from '../data/eventsData'
import {
  CalendarAvailability,
  dateKey,
  today,
  isPast,
  isWithin90Days,
  getBestSlots,
} from '../data/calendarData'

interface CalendarTabProps {
  availability: CalendarAvailability
  members: Member[]
  currentUserId: string
  onDayTap: (dateStr: string) => void
  events?: GroupEvent[]
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function CalendarTab({
  availability,
  members,
  currentUserId,
  onDayTap,
  events = [],
}: CalendarTabProps) {
  const eventsByDate = new Map<string, GroupEvent[]>()
  for (const ev of events) {
    const arr = eventsByDate.get(ev.date) ?? []
    arr.push(ev)
    eventsByDate.set(ev.date, arr)
  }

  const now = today()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const todayKey = dateKey(now)
  const bestSlots = getBestSlots(availability, viewYear, viewMonth)
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth)

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    },
  )

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from(
      {
        length: daysInMonth,
      },
      (_, i) => i + 1,
    ),
  ]

  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="flex flex-col pb-24 px-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between pt-4 pb-4">
        <button
          onClick={handlePrevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <motion.h2
          key={`${viewYear}-${viewMonth}`}
          initial={{
            opacity: 0,
            y: -4,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.18,
          }}
          className="text-base font-semibold text-black dark:text-white"
        >
          {monthLabel}
        </motion.h2>
        <button
          onClick={handleNextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRightIcon size={20} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_OF_WEEK.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <motion.div
        key={`${viewYear}-${viewMonth}`}
        initial={{
          opacity: 0,
          x: 8,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.2,
          ease: 'easeOut',
        }}
        className="grid grid-cols-7 gap-1.5"
      >
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} />
          }

          const d = new Date(viewYear, viewMonth, day)
          const key = dateKey(d)
          const past = isPast(key)
          const inWindow = isWithin90Days(key)
          const isToday = key === todayKey
          const tappable = !past && inWindow

          const dayAvail = availability[key]
          const morningCount = dayAvail?.morning.length ?? 0
          const eveningCount = dayAvail?.evening.length ?? 0
          const uniqueCount = new Set([
            ...(dayAvail?.morning ?? []),
            ...(dayAvail?.evening ?? []),
          ]).size

          const hasBestMorning = bestSlots.has(`${key}:morning`)
          const hasBestEvening = bestSlots.has(`${key}:evening`)
          const hasAnyBest = hasBestMorning || hasBestEvening
          const hasAnyAvail = morningCount > 0 || eveningCount > 0

          return (
            <motion.button
              key={key}
              onClick={() => tappable && onDayTap(key)}
              disabled={!tappable}
              initial={{
                opacity: 0,
                scale: 0.92,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.15,
                delay: idx * 0.008,
              }}
              className={`
                relative flex flex-col items-center rounded-2xl py-2 px-1 min-h-[72px] transition-all
                ${tappable ? 'active:scale-95 cursor-pointer' : 'cursor-default'}
                ${past ? 'opacity-30' : ''}
                ${isToday && !hasAnyBest ? 'bg-gray-50 dark:bg-gray-800/60' : ''}
                ${hasAnyBest && !past ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-700/50' : ''}
              `}
            >
              {/* Date number */}
              <span
                className={`
                  w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1
                  ${isToday ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-black dark:text-white'}
                `}
              >
                {day}
              </span>

              {/* Event emoji indicator */}
              {eventsByDate.has(key) && (
                <span className="text-[11px] leading-none">
                  {eventsByDate.get(key)![0].emoji}
                </span>
              )}

              {/* Unique people count */}
              {hasAnyAvail && !past ? (
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded-full
                    ${hasAnyBest ? 'bg-amber-200 dark:bg-amber-700/60 text-amber-800 dark:text-amber-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                >
                  ☀️ {uniqueCount}
                </span>
              ) : !eventsByDate.has(key) ? (
                <div className="h-8" />
              ) : null}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Empty state */}
      {Object.keys(availability).length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 px-8 pt-12 text-center">
          <span className="text-5xl mb-4">📅</span>
          <p className="text-base font-semibold text-black dark:text-white mb-1">
            No availability yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Tap any upcoming date to mark when you're free
          </p>
        </div>
      )}
    </div>
  )
}
