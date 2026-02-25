import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XIcon, LinkIcon } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Member, Transaction } from '../data/mockData'
import { GroupEvent } from '../data/eventsData'

interface AddTransactionSheetProps {
  isOpen: boolean
  onClose: () => void
  members: Member[]
  onAdd: (transaction: any) => void
  editingTransaction?: Transaction | null
  onUpdate?: (id: string, transaction: any) => void
  events?: GroupEvent[]
  prefillEventId?: string | null
}

function formatEventDate(date: string, time: string | null): string {
  const d = new Date(date + 'T00:00:00')
  const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (!time) return dayStr
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${dayStr} · ${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function AddTransactionSheet({
  isOpen,
  onClose,
  members,
  onAdd,
  editingTransaction,
  onUpdate,
  events = [],
  prefillEventId,
}: AddTransactionSheetProps) {
  const isEditMode = !!editingTransaction
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMember, setSelectedMember] = useState(members[0]?.id ?? '')
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [showErrors, setShowErrors] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [showEventPicker, setShowEventPicker] = useState(false)

  useEffect(() => {
    if (isOpen && editingTransaction) {
      setAmount(String(Math.abs(editingTransaction.amount)))
      setDescription(editingTransaction.description)
      setSelectedMember(editingTransaction.memberId)
      setType(editingTransaction.amount >= 0 ? 'income' : 'expense')
      setDate(editingTransaction.date.slice(0, 10))
      setShowErrors(false)
      setSelectedEventId((editingTransaction as any).eventId ?? null)
      setShowEventPicker(false)
    } else if (isOpen && !editingTransaction) {
      setAmount('')
      setDescription('')
      setSelectedMember(members[0]?.id ?? '')
      setType('expense')
      setShowErrors(false)
      setShowEventPicker(false)

      if (prefillEventId) {
        setSelectedEventId(prefillEventId)
        const ev = events.find(e => e.id === prefillEventId)
        if (ev) setDate(ev.date)
        else setDate(new Date().toISOString().slice(0, 10))
      } else {
        setSelectedEventId(null)
        setDate(new Date().toISOString().slice(0, 10))
      }
    }
  }, [isOpen, editingTransaction, prefillEventId])

  const amountRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLInputElement>(null)
  const isValid = amount !== '' && parseFloat(amount) > 0 && description.trim() !== ''

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null

  const handleSelectEvent = (eventId: string | null) => {
    setSelectedEventId(eventId)
    setShowEventPicker(false)
    if (eventId) {
      const ev = events.find(e => e.id === eventId)
      if (ev) setDate(ev.date)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    const payload = {
      amount: type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount)),
      description,
      memberId: selectedMember,
      date: new Date(date + 'T00:00:00').toISOString(),
      category: 'General',
      eventId: selectedEventId,
    }
    if (isEditMode && onUpdate && editingTransaction) {
      onUpdate(editingTransaction.id, payload)
    } else {
      onAdd(payload)
    }
    setAmount('')
    setDescription('')
    setShowErrors(false)
    onClose()
  }

  const handleCTAClick = () => {
    if (!isValid) {
      setShowErrors(true)
      if (!amount || parseFloat(amount) <= 0) {
        amountRef.current?.focus()
      } else if (!description.trim()) {
        descriptionRef.current?.focus()
      }
      return
    }
    const form = document.getElementById('transaction-form') as HTMLFormElement
    form?.requestSubmit()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ x: '-50%' }}
            className="fixed bottom-0 left-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl z-50 h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold dark:text-white">
                {isEditMode ? 'Edit Transaction' : 'New Transaction'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-white"
              >
                <XIcon size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-32">
              <form id="transaction-form" onSubmit={handleSubmit} className="space-y-8 max-w-md mx-auto">
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'income' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'expense' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    Expense
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount
                    </label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold ${type === 'expense' ? 'text-red-500' : 'text-green-600'}`}>
                        {type === 'expense' ? '-$' : '+$'}
                      </span>
                      <input
                        ref={amountRef}
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setAmount(val)
                          }
                          if (showErrors) setShowErrors(false)
                        }}
                        placeholder="0.00"
                        className={`w-full pl-16 pr-4 py-4 text-4xl font-bold border-b-2 outline-none transition-colors bg-transparent dark:text-white placeholder:text-gray-200 dark:placeholder:text-gray-700 ${showErrors && (!amount || parseFloat(amount) <= 0) ? 'border-red-400 focus:border-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white'}`}
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <Input
                    label="Description"
                    inputRef={descriptionRef}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      if (showErrors) setShowErrors(false)
                    }}
                    placeholder="What is this for?"
                    error={showErrors && !description.trim() ? 'Please add a description' : undefined}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none bg-transparent dark:text-white focus:border-black dark:focus:border-white transition-colors"
                    />
                  </div>

                  {/* Event linker */}
                  {events.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <LinkIcon size={12} className="inline mr-1 -mt-0.5" />
                        Linked Event <span className="text-gray-400 font-normal">(optional)</span>
                      </label>

                      {selectedEvent ? (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                          <div className="flex items-center gap-3 px-4 py-3">
                            <span className="text-xl">{selectedEvent.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-black dark:text-white truncate">
                                {selectedEvent.title}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {formatEventDate(selectedEvent.date, selectedEvent.time)}
                                {' · '}
                                {selectedEvent.rsvps.filter(r => r.status === 'going').length} going
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectEvent(null)}
                              className="text-xs text-red-500 font-medium flex-shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowEventPicker(v => !v)}
                          className="w-full px-4 py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-left"
                        >
                          Tap to link an event...
                        </button>
                      )}

                      <AnimatePresence>
                        {showEventPicker && !selectedEvent && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="overflow-hidden mt-2"
                          >
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-48 overflow-y-auto">
                              {events.map(ev => (
                                <button
                                  key={ev.id}
                                  type="button"
                                  onClick={() => handleSelectEvent(ev.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                >
                                  <span className="text-base">{ev.emoji}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-black dark:text-white truncate">{ev.title}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                      {formatEventDate(ev.date, ev.time)}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Member
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                      {[...members]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => setSelectedMember(member.id)}
                            className={`w-full flex items-center px-4 py-3 transition-all border-b border-gray-100 dark:border-gray-700 last:border-0 ${selectedMember === member.id ? 'bg-black dark:bg-white text-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white'}`}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mr-3"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.initials}
                            </div>
                            <span className={`text-sm font-medium ${selectedMember === member.id ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>
                              {member.name}
                            </span>
                            {selectedMember === member.id && (
                              <span className="ml-auto text-white dark:text-black text-xs">✓</span>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Pinned CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                onClick={handleCTAClick}
                aria-label="Submit transaction"
                className="w-full h-14 text-lg bg-black dark:bg-white text-white dark:text-black rounded-xl"
              >
                {isEditMode ? 'Update' : 'Add Transaction'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
