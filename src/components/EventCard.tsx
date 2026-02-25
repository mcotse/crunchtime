import React from 'react'
import { motion } from 'framer-motion'
import { GroupEvent, RsvpStatus } from '../data/eventsData'
import { Member } from '../data/mockData'

interface EventCardProps {
  event: GroupEvent
  members: Member[]
  currentUserId: string
  onTap: (event: GroupEvent) => void
  index?: number
}

function formatEventDate(date: string, time: string | null): string {
  const d = new Date(date + 'T00:00:00')
  const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (!time) return dayStr + ' · All day'
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${dayStr} · ${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function getRsvpPill(status: RsvpStatus): { label: string; className: string } {
  switch (status) {
    case 'going':
      return { label: 'Going', className: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' }
    case 'maybe':
      return { label: 'Maybe', className: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' }
    case 'cant_go':
      return { label: "Can't go", className: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' }
  }
}

export function EventCard({ event, members, currentUserId, onTap, index = 0 }: EventCardProps) {
  const goingCount = event.rsvps.filter(r => r.status === 'going').length
  const maybeCount = event.rsvps.filter(r => r.status === 'maybe').length
  const myRsvp = event.rsvps.find(r => r.memberId === currentUserId)

  const goingMemberIds = event.rsvps
    .filter(r => r.status === 'going')
    .map(r => r.memberId)
    .slice(0, 4)

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.05, ease: 'easeOut' }}
      onClick={() => onTap(event)}
      className="w-full flex items-center gap-3.5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-left active:scale-[0.98] transition-transform"
    >
      {/* Emoji */}
      <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl flex-shrink-0">
        {event.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold text-black dark:text-white truncate">
          {event.title}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {formatEventDate(event.date, event.time)}
        </p>
        <div className="flex items-center gap-2">
          {/* Stacked avatars */}
          {goingMemberIds.length > 0 && (
            <div className="flex items-center">
              {goingMemberIds.map((id, i) => {
                const member = members.find(m => m.id === id)
                if (!member) return null
                return (
                  <div
                    key={id}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-semibold border-2 border-white dark:border-gray-900 flex-shrink-0"
                    style={{
                      backgroundColor: member.color,
                      marginLeft: i === 0 ? 0 : -6,
                      zIndex: goingMemberIds.length - i,
                      position: 'relative',
                    }}
                  >
                    {member.initials.charAt(0)}
                  </div>
                )
              })}
            </div>
          )}
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {goingCount} going{maybeCount > 0 ? ` · ${maybeCount} maybe` : ''}
          </span>
        </div>
      </div>

      {/* User's RSVP pill */}
      {myRsvp && (
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${getRsvpPill(myRsvp.status).className}`}>
          {getRsvpPill(myRsvp.status).label}
        </span>
      )}
    </motion.button>
  )
}
