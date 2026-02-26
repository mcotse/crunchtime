import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { GroupEvent } from '../data/eventsData'
import { Member } from '../data/mockData'
import { EventCard } from './EventCard'
import { Button } from './ui/Button'

interface EventsTabProps {
  events: GroupEvent[]
  members: Member[]
  currentUserId: string
  onCreateEvent: () => void
  onOpenEvent: (event: GroupEvent) => void
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function isPastEvent(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dateStr + 'T00:00:00') < today
}

export function EventsTab({
  events,
  members,
  currentUserId,
  onCreateEvent,
  onOpenEvent,
}: EventsTabProps) {
  const [pastExpanded, setPastExpanded] = useState(false)

  const upcomingEvents = events.filter(e => !isPastEvent(e.date))
  const pastEvents = events.filter(e => isPastEvent(e.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Group upcoming by month
  const grouped = new Map<string, GroupEvent[]>()
  for (const ev of upcomingEvents) {
    const key = getMonthKey(ev.date)
    const arr = grouped.get(key) ?? []
    arr.push(ev)
    grouped.set(key, arr)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4 space-y-6">
      <div className="flex justify-center pt-2 pb-2">
        <Button
          onClick={onCreateEvent}
          className="rounded-full h-10 px-6 bg-black dark:bg-white text-white dark:text-black"
        >
          <PlusIcon size={16} className="mr-2" />
          Create Event
        </Button>
      </div>

      {/* Upcoming events grouped by month */}
      {upcomingEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 space-y-4"
        >
          <span className="text-5xl">🎉</span>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No upcoming events
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Create one to get the group together
            </p>
          </div>
        </motion.div>
      ) : (
        Array.from(grouped.entries()).map(([month, monthEvents]) => (
          <div key={month} className="space-y-2.5">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest px-2">
              {month}
            </h3>
            {monthEvents.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                members={members}
                currentUserId={currentUserId}
                onTap={onOpenEvent}
                index={i}
              />
            ))}
          </div>
        ))
      )}

      {/* Past events */}
      {pastEvents.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setPastExpanded(v => !v)}
            className="flex items-center justify-between w-full px-2"
          >
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest">
              Past ({pastEvents.length})
            </h3>
            <motion.div
              animate={{ rotate: pastExpanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDownIcon size={14} className="text-gray-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {pastExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-2">
                  {pastEvents.map((event, i) => (
                    <motion.button
                      key={event.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: i * 0.04, ease: 'easeOut' }}
                      onClick={() => onOpenEvent(event)}
                      className="w-full flex items-center gap-3 py-3.5 px-2 border-b border-gray-100 dark:border-gray-800 last:border-0 text-left"
                    >
                      <span className="text-lg">{event.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {event.rsvps.filter(r => r.status === 'going').length} went
                      </span>
                      <ChevronRightIcon size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
