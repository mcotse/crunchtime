import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XIcon, AlertCircleIcon, LinkIcon } from 'lucide-react'
import { Button } from './ui/Button'
import { Poll } from '../data/pollsData'
import { Member } from '../data/mockData'
import type { CalendarAvailability } from '../data/calendarData'

interface CreateEventSheetProps {
  isOpen: boolean
  onClose: () => void
  onCreateEvent: (data: {
    title: string
    emoji: string
    description: string
    date: string
    time: string | null
    linkedPollId?: string
  }) => void | Promise<void>
  prefillDate?: string | null
  linkedPollId?: string | null
  availability?: CalendarAvailability
  polls?: Poll[]
  members?: Member[]
}

const EMOJI_PRESETS = ['🎉', '🍕', '🎮', '🏖️', '🍽️', '🎂', '🎬', '☕', '🏠', '🎵', '🛒', '✈️', '🏃', '📅', '🎯', '💡', '⚡', '❓']

export function CreateEventSheet({
  isOpen,
  onClose,
  onCreateEvent,
  prefillDate,
  linkedPollId: initialLinkedPollId,
  availability = {},
  polls = [],
  members = [],
}: CreateEventSheetProps) {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setEmoji('🎉')
      setShowEmojiPicker(false)
      setDate(prefillDate || new Date().toISOString().slice(0, 10))
      setTime('')
      setDescription('')
      setShowErrors(false)
      setShowUnsavedWarning(false)
      setSelectedPollId(initialLinkedPollId ?? null)
    }
  }, [isOpen, prefillDate, initialLinkedPollId])

  const hasContent = title.trim() !== '' || description.trim() !== ''
  const isValid = title.trim() !== '' && date !== ''

  // Availability for selected date
  const dayAvail = date ? availability[date] : null
  const morningMembers = dayAvail?.morning ?? []
  const eveningMembers = dayAvail?.evening ?? []
  const hasAvailability = morningMembers.length > 0 || eveningMembers.length > 0

  // Linkable polls (active, non-archived)
  const linkablePolls = polls.filter(
    p => !p.isArchived && (!p.expiresAt || new Date(p.expiresAt) > new Date())
  )

  const handleClose = () => {
    if (hasContent) {
      setShowUnsavedWarning(true)
    } else {
      onClose()
    }
  }

  const resetAndClose = () => {
    setShowUnsavedWarning(false)
    onClose()
  }

  const handleCreate = async () => {
    if (!isValid) {
      setShowErrors(true)
      return
    }

    await onCreateEvent({
      title: title.trim(),
      emoji,
      description: description.trim(),
      date,
      time: time || null,
      linkedPollId: selectedPollId ?? undefined,
    })
    onClose()
  }

  const getMember = (id: string) => members.find(m => m.id === id)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl z-[51] h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <h2 className="text-xl font-semibold text-black dark:text-white">Create Event</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-white"
              >
                <XIcon size={22} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-7">
              {/* Emoji + Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                  Event Name
                </label>
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(v => !v)}
                      className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                    >
                      {emoji}
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 grid grid-cols-6 gap-1 z-10">
                        {EMOJI_PRESETS.map(e => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => { setEmoji(e); setShowEmojiPicker(false) }}
                            className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-lg transition-colors"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Give it a name..."
                    className={`flex-1 text-base font-medium bg-transparent outline-none border-b-2 pb-2 transition-colors dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 ${showErrors && !title.trim() ? 'border-red-400' : 'border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white'}`}
                    autoFocus
                  />
                </div>
                {showErrors && !title.trim() && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircleIcon size={11} />
                    Event name is required
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-widest block">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className={`w-full text-sm bg-transparent outline-none border-b-2 pb-2 transition-colors dark:text-white dark:color-scheme-dark ${showErrors && !date ? 'border-red-400' : 'border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white'}`}
                />
              </div>

              {/* Availability for selected date */}
              {date && hasAvailability && (
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl px-4 py-3.5 space-y-3 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Who's free on {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  {morningMembers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">☀️</span>
                      <div className="flex items-center gap-1">
                        {morningMembers.slice(0, 6).map(id => {
                          const member = getMember(id)
                          if (!member) return null
                          return (
                            <div
                              key={id}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-semibold"
                              style={{ backgroundColor: member.color }}
                              title={member.name}
                            >
                              {member.initials.charAt(0)}
                            </div>
                          )
                        })}
                        {morningMembers.length > 6 && (
                          <span className="text-[10px] text-gray-400 ml-0.5">+{morningMembers.length - 6}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 ml-auto">{morningMembers.length} morning</span>
                    </div>
                  )}
                  {eveningMembers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">🌙</span>
                      <div className="flex items-center gap-1">
                        {eveningMembers.slice(0, 6).map(id => {
                          const member = getMember(id)
                          if (!member) return null
                          return (
                            <div
                              key={id}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-semibold"
                              style={{ backgroundColor: member.color }}
                              title={member.name}
                            >
                              {member.initials.charAt(0)}
                            </div>
                          )
                        })}
                        {eveningMembers.length > 6 && (
                          <span className="text-[10px] text-gray-400 ml-0.5">+{eveningMembers.length - 6}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 ml-auto">{eveningMembers.length} evening</span>
                    </div>
                  )}
                </div>
              )}

              {date && !hasAvailability && (
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl px-4 py-3 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    No availability data for {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}

              {/* Time */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-widest block">
                  Time
                  <span className="ml-1.5 normal-case font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full text-sm bg-transparent outline-none border-b-2 pb-2 border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white transition-colors dark:text-white dark:color-scheme-dark"
                />
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Leave empty for all-day event.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-widest block">
                  Description
                  <span className="ml-1.5 normal-case font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Add details..."
                  rows={3}
                  className="w-full text-sm bg-transparent outline-none border-b-2 pb-2 border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white transition-colors dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 resize-none"
                />
              </div>

              {/* Link a poll */}
              {linkablePolls.length > 0 && (
                <div className="space-y-2.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-widest block">
                    <LinkIcon size={10} className="inline mr-1 -mt-0.5" />
                    Link a Poll
                    <span className="ml-1.5 normal-case font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    {/* None option */}
                    <button
                      type="button"
                      onClick={() => setSelectedPollId(null)}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 transition-colors text-left ${
                        selectedPollId === null
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <span className="text-sm font-medium">No poll linked</span>
                      {selectedPollId === null && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </button>
                    {linkablePolls.map(poll => (
                      <button
                        key={poll.id}
                        type="button"
                        onClick={() => setSelectedPollId(poll.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors text-left ${
                          selectedPollId === poll.id
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white'
                        }`}
                      >
                        <span className="text-base">{poll.emoji}</span>
                        <span className="text-sm font-medium flex-1 truncate">{poll.title}</span>
                        {selectedPollId === poll.id && (
                          <span className="text-xs flex-shrink-0">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pinned CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                onClick={handleCreate}
                disabled={showErrors && !isValid}
                className="w-full h-12 text-base bg-black dark:bg-white text-white dark:text-black rounded-full disabled:opacity-40"
              >
                Create Event
              </Button>
            </div>
          </motion.div>

          {/* Unsaved changes warning */}
          <AnimatePresence>
            {showUnsavedWarning && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black z-[60]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm top-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 z-[61] shadow-2xl"
                >
                  <h3 className="text-base font-semibold text-black dark:text-white mb-1">
                    Discard event?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                    Your changes will be lost if you leave now.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowUnsavedWarning(false)}
                      variant="secondary"
                      className="flex-1 rounded-full"
                    >
                      Keep editing
                    </Button>
                    <Button
                      onClick={resetAndClose}
                      className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      Discard
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
