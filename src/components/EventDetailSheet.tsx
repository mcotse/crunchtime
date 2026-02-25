import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, PlusIcon } from 'lucide-react'
import { GroupEvent, GroupEventDetail, RsvpStatus } from '../data/eventsData'
import { Member } from '../data/mockData'

interface EventDetailSheetProps {
  event: GroupEvent | null
  members: Member[]
  currentUserId: string
  isOpen: boolean
  onClose: () => void
  onRsvp: (eventId: string, status: RsvpStatus) => void
  onOpenPoll?: (pollId: string) => void
  onAddExpense?: (eventId: string) => void
}

function formatDateLine(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTimeLine(time: string | null): string {
  if (!time) return 'All day'
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

const RSVP_CONFIG: Array<{
  status: RsvpStatus
  label: string
  emoji: string
  activeBg: string
  activeText: string
}> = [
  { status: 'going', label: 'Going', emoji: '🎉', activeBg: 'bg-emerald-500', activeText: 'text-white' },
  { status: 'maybe', label: 'Maybe', emoji: '🤔', activeBg: 'bg-amber-500', activeText: 'text-white' },
  { status: 'cant_go', label: "Can't Go", emoji: '😢', activeBg: 'bg-gray-500', activeText: 'text-white' },
]

function AttendeeChip({ member }: { member: Member }) {
  return (
    <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full pl-1.5 pr-3 py-1.5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
        style={{ backgroundColor: member.color }}
      >
        {member.initials}
      </div>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
        {member.name.split(' ')[0]}
      </span>
    </div>
  )
}

export function EventDetailSheet({
  event,
  members,
  currentUserId,
  isOpen,
  onClose,
  onRsvp,
  onOpenPoll,
  onAddExpense,
}: EventDetailSheetProps) {
  const [detail, setDetail] = useState<GroupEventDetail | null>(null)

  useEffect(() => {
    if (isOpen && event) {
      fetch(`/api/events/${event.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => d && setDetail(d))
    } else {
      setDetail(null)
    }
  }, [isOpen, event?.id])

  if (!event) return null

  const myRsvp = event.rsvps.find(r => r.memberId === currentUserId)
  const goingMembers = event.rsvps.filter(r => r.status === 'going')
  const maybeMembers = event.rsvps.filter(r => r.status === 'maybe')
  const cantGoMembers = event.rsvps.filter(r => r.status === 'cant_go')

  const getMember = (id: string) => members.find(m => m.id === id)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="absolute inset-0 z-50 bg-white dark:bg-gray-950 flex flex-col overflow-hidden"
        >
          {/* Back button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeftIcon size={20} className="text-gray-700 dark:text-gray-300" />
          </button>

          <div className="flex-1 overflow-y-auto">
            {/* Hero section */}
            <div className="relative px-6 pt-20 pb-8 text-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                className="text-7xl mb-5"
              >
                {event.emoji}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="text-2xl font-bold text-black dark:text-white mb-3 leading-tight"
              >
                {event.title}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <CalendarIcon size={14} />
                  <span>{formatDateLine(event.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <ClockIcon size={14} />
                  <span>{formatTimeLine(event.time)}</span>
                </div>
              </motion.div>

              {/* Attendee count summary */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="mt-5 flex items-center justify-center gap-4 text-xs font-medium"
              >
                {goingMembers.length > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {goingMembers.length} going
                  </span>
                )}
                {maybeMembers.length > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {maybeMembers.length} maybe
                  </span>
                )}
                {cantGoMembers.length > 0 && (
                  <span className="text-gray-400 dark:text-gray-500">
                    {cantGoMembers.length} can't go
                  </span>
                )}
              </motion.div>
            </div>

            {/* RSVP section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="px-6 py-5"
            >
              <div className="flex gap-2.5">
                {RSVP_CONFIG.map(btn => {
                  const isActive = myRsvp?.status === btn.status
                  return (
                    <button
                      key={btn.status}
                      onClick={() => onRsvp(event.id, btn.status)}
                      className={`flex-1 flex flex-col items-center gap-1 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.97] ${
                        isActive
                          ? `${btn.activeBg} ${btn.activeText} border-transparent shadow-lg`
                          : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className="text-lg">{btn.emoji}</span>
                      <span className="text-xs font-semibold">{btn.label}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>

            {/* Content sections */}
            <div className="px-6 pb-32 space-y-7">
              {/* Description */}
              {event.description && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.25 }}
                >
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5">
                    About
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900 rounded-2xl px-4 py-3.5">
                    {event.description}
                  </p>
                </motion.div>
              )}

              {/* Guest list */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.25 }}
                className="space-y-5"
              >
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Guest List ({event.rsvps.length})
                </h3>

                {goingMembers.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2.5">
                      Going ({goingMembers.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {goingMembers.map(r => {
                        const member = getMember(r.memberId)
                        if (!member) return null
                        return <AttendeeChip key={r.memberId} member={member} />
                      })}
                    </div>
                  </div>
                )}

                {maybeMembers.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2.5">
                      Maybe ({maybeMembers.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {maybeMembers.map(r => {
                        const member = getMember(r.memberId)
                        if (!member) return null
                        return <AttendeeChip key={r.memberId} member={member} />
                      })}
                    </div>
                  </div>
                )}

                {cantGoMembers.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                      Can't Go ({cantGoMembers.length})
                    </p>
                    <div className="flex flex-wrap gap-2 opacity-60">
                      {cantGoMembers.map(r => {
                        const member = getMember(r.memberId)
                        if (!member) return null
                        return <AttendeeChip key={r.memberId} member={member} />
                      })}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Expenses section */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.25 }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Expenses
                    {detail?.linkedTransactions && detail.linkedTransactions.length > 0 && (
                      <span className="ml-1.5 normal-case">
                        · ${Math.abs(detail.linkedTransactions.reduce((sum, tx) => sum + tx.amount, 0)).toFixed(2)} total
                      </span>
                    )}
                  </h3>
                </div>
                {detail?.linkedTransactions && detail.linkedTransactions.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden mb-2.5">
                    {detail.linkedTransactions.map(tx => {
                      const member = getMember(tx.memberId)
                      return (
                        <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                          {member && (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.initials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black dark:text-white truncate">
                              {tx.description}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{member?.name.split(' ')[0]}</p>
                          </div>
                          <span className={`text-sm font-bold tabular-nums ${tx.amount < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {onAddExpense && (
                  <button
                    onClick={() => onAddExpense(event.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-900 rounded-2xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <PlusIcon size={14} />
                    Add Expense
                  </button>
                )}
              </motion.div>

              {/* Linked Poll */}
              {detail?.linkedPoll && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.25 }}
                >
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5">
                    Linked Poll
                  </h3>
                  <button
                    onClick={() => onOpenPoll?.(detail.linkedPoll!.id)}
                    className="w-full flex items-center gap-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl px-4 py-4 text-left active:scale-[0.98] transition-transform"
                  >
                    <span className="text-2xl">{detail.linkedPoll.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-black dark:text-white truncate">
                        {detail.linkedPoll.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Tap to view poll</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">View →</span>
                  </button>
                </motion.div>
              )}

              {/* Availability */}
              {detail?.dateAvailability && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.25 }}
                >
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5">
                    Availability · {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl px-4 py-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        ☀️ Morning ({detail.dateAvailability.morning.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.dateAvailability.morning.length === 0 ? (
                          <span className="text-xs text-gray-400 dark:text-gray-500">No one available</span>
                        ) : (
                          detail.dateAvailability.morning.map(id => {
                            const member = getMember(id)
                            if (!member) return null
                            return (
                              <div
                                key={id}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
                                style={{ backgroundColor: member.color }}
                                title={member.name}
                              >
                                {member.initials.charAt(0)}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        🌙 Evening ({detail.dateAvailability.evening.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.dateAvailability.evening.length === 0 ? (
                          <span className="text-xs text-gray-400 dark:text-gray-500">No one available</span>
                        ) : (
                          detail.dateAvailability.evening.map(id => {
                            const member = getMember(id)
                            if (!member) return null
                            return (
                              <div
                                key={id}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
                                style={{ backgroundColor: member.color }}
                                title={member.name}
                              >
                                {member.initials.charAt(0)}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
