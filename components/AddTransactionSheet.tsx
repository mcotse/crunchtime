import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XIcon } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Member } from '../data/mockData'

interface AddTransactionSheetProps {
  isOpen: boolean
  onClose: () => void
  members: Member[]
  onAdd: (transaction: any) => void
}

export function AddTransactionSheet({ isOpen, onClose, members, onAdd }: AddTransactionSheetProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMember, setSelectedMember] = useState(members[0]?.id ?? '')
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [showErrors, setShowErrors] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLInputElement>(null)

  const isValid = amount !== '' && parseFloat(amount) > 0 && description.trim() !== ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    onAdd({
      amount: type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount)),
      description,
      memberId: selectedMember,
      date: new Date().toISOString(),
      category: 'General',
      id: Math.random().toString(36).substr(2, 9),
    })
    setAmount('')
    setDescription('')
    setShowErrors(false)
    onClose()
  }

  const handleCTAClick = () => {
    if (!isValid) {
      setShowErrors(true)
      if (!amount || parseFloat(amount) <= 0) amountRef.current?.focus()
      else if (!description.trim()) descriptionRef.current?.focus()
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
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl p-6 max-w-md mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Transaction</h2>
              <button onClick={onClose}><XIcon size={20} /></button>
            </div>

            <form id="transaction-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex gap-2">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      type === t ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <Input
                ref={amountRef}
                label="Amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={showErrors && (!amount || parseFloat(amount) <= 0) ? 'Enter a valid amount' : undefined}
              />

              <Input
                ref={descriptionRef}
                label="Description"
                placeholder="What was this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={showErrors && !description.trim() ? 'Description required' : undefined}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Member</label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </form>

            <Button className="w-full mt-4" onClick={handleCTAClick}>
              Add Transaction
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
