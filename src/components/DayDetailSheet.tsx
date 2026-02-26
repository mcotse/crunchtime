import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XIcon } from 'lucide-react'
import { Member } from '../data/mockData'
import { CalendarAvailability, isPast } from '../data/calendarData'

interface DayDetailSheetProps {
  dateStr: string | null
  isOpen: boolean
  onClose: () => void
  availability: CalendarAvailability
  members: Member[]
  currentUserId: string
  onToggle: (dateStr: string, slot: 'morning' | 'evening') => void
  onCreateEvent?: (dateStr: string) => void
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

interface SlotSectionProps {
  emoji: string
  label: string
  slotKey: 'morning' | 'evening'
  memberIds: string[]
  members: Member[]
  currentUserId: string
  isAvailable: boolean
  isPastDate: boolean
  onToggle: () => void
}

function SlotSection({
  emoji,
  label,
  slotKey,
  memberIds,
  members,
  currentUserId,
  isAvailable,
  isPastDate,
  onToggle,
}: SlotSectionProps) {
  const availableMembers = memberIds
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean) as Member[]

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Toggle row */}
      <div className="flex items-center justify-between px-4 py-4 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <span className="text-xl">{emoji}</span>
          <div>
            <p className="text-sm font-semibold text-black dark:text-white">
              {label}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {availableMembers.length}{' '}
              {availableMembers.length === 1 ? 'person' : 'people'} available
            </p>
          </div>
        </div>
        {!isPastDate && (
          <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isAvailable ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-600'}`}
            aria-label={`Toggle ${label} availability`}
          >
            <motion.span
              layout
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
              }}
              className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black shadow transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        )}
        {isPastDate && (
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Past
          </span>
        )}
      </div>

      {/* Member list */}
      {availableMembers.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {availableMembers.map((member) => (
              <motion.div
                key={member.id}
                initial={{
                  opacity: 0,
                  scale: 0.85,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.85,
                }}
                transition={{
                  duration: 0.15,
                }}
                className="flex items-center gap-1.5 bg-white dark:bg-gray-900 rounded-full pl-1 pr-2.5 py-1 border border-gray-100 dark:border-gray-800"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{
                    backgroundColor: member.color,
                  }}
                >
                  {member.initials.charAt(0)}
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {member.name.split(' ')[0]}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for slot */}
      {availableMembers.length === 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 px-4 py-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            No one marked available yet
          </p>
        </div>
      )}
    </div>
  )
}

export function DayDetailSheet({
  dateStr,
  isOpen,
  onClose,
  availability,
  members,
  currentUserId,
  onToggle,
  onCreateEvent,
}: DayDetailSheetProps) {
  if (!dateStr) return null

  const dayAvail = availability[dateStr] ?? {
    morning: [],
    evening: [],
  }
  const past = isPast(dateStr)
  const isMorningAvail = dayAvail.morning.includes(currentUserId)
  const isEveningAvail = dayAvail.evening.includes(currentUserId)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 0.5,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{
              y: '100%',
            }}
            animate={{
              y: 0,
            }}
            exit={{
              y: '100%',
            }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
            }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-900 rounded-t-3xl z-[51] max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-2 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  {formatDateLabel(dateStr)}
                </h2>
                {past && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    Past date — view only
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white transition-colors"
                aria-label="Close"
              >
                <XIcon size={22} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Your availability summary (if not past) */}
              {!past && (
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl px-4 py-3">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                    Your availability
                  </p>
                  <div className="flex gap-2">
                    <span
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isMorningAvail ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                    >
                      ☀️ Morning
                    </span>
                    <span
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isEveningAvail ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                    >
                      🌙 Evening
                    </span>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                <SlotSection
                  key={`morning-${dateStr}`}
                  emoji="☀️"
                  label="Morning"
                  slotKey="morning"
                  memberIds={dayAvail.morning}
                  members={members}
                  currentUserId={currentUserId}
                  isAvailable={isMorningAvail}
                  isPastDate={past}
                  onToggle={() => onToggle(dateStr, 'morning')}
                />
                <SlotSection
                  key={`evening-${dateStr}`}
                  emoji="🌙"
                  label="Evening"
                  slotKey="evening"
                  memberIds={dayAvail.evening}
                  members={members}
                  currentUserId={currentUserId}
                  isAvailable={isEveningAvail}
                  isPastDate={past}
                  onToggle={() => onToggle(dateStr, 'evening')}
                />
              </AnimatePresence>

              {/* Disabled state message for past */}
              {past && (
                <div className="flex flex-col items-center py-4 text-center">
                  <span className="text-3xl mb-2">🔒</span>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Availability can't be edited for past dates
                  </p>
                </div>
              )}

              {/* Create Event button */}
              {!past && onCreateEvent && (
                <button
                  onClick={() => onCreateEvent(dateStr)}
                  className="w-full mt-4 h-12 text-sm font-semibold text-black dark:text-white bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  🎉 Create Event
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
