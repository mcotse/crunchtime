import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XIcon, PlusIcon, Trash2Icon, AlertCircleIcon } from 'lucide-react'
import { Poll, PollOption } from '../data/pollsData'
import { Button } from './ui/Button'

interface CreatePollSheetProps {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  onCreatePoll: (poll: Poll) => void | Promise<void>
}

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function CreatePollSheet({
  isOpen,
  onClose,
  currentUserId,
  onCreatePoll,
}: CreatePollSheetProps) {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('📊')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [options, setOptions] = useState(['', ''])
  const [allowMembersToAddOptions, setAllowMembersToAddOptions] = useState(true)
  const [allowMultiSelect, setAllowMultiSelect] = useState(false)
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [showErrors, setShowErrors] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)

  const hasContent = title.trim() !== '' || options.some((o) => o.trim() !== '')
  const validOptions = options.filter((o) => o.trim() !== '')
  const hasDuplicates = validOptions.some(
    (o, i) =>
      validOptions.findIndex((x) => x.toLowerCase() === o.toLowerCase()) !== i,
  )
  const isValid =
    title.trim() !== '' &&
    validOptions.length >= 2 &&
    !hasDuplicates

  const handleClose = () => {
    if (hasContent) {
      setShowUnsavedWarning(true)
    } else {
      resetAndClose()
    }
  }

  const resetAndClose = () => {
    setTitle('')
    setEmoji('📊')
    setShowEmojiPicker(false)
    setOptions(['', ''])
    setAllowMembersToAddOptions(true)
    setAllowMultiSelect(false)
    const d = new Date()
    d.setDate(d.getDate() + 7)
    setExpiresAt(d.toISOString().split('T')[0])
    setShowErrors(false)
    setShowUnsavedWarning(false)
    onClose()
  }

  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  const handleCreate = async () => {
    if (!isValid) {
      setShowErrors(true)
      return
    }

    const pollOptions: PollOption[] = options
      .filter((text) => text.trim() !== '')
      .map((text) => ({
        id: generateId(),
        text: text.trim(),
        voterIds: [],
      }))

    const newPoll: Poll = {
      id: generateId(),
      emoji,
      title: title.trim(),
      options: pollOptions,
      creatorId: currentUserId,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt
        ? new Date(expiresAt + 'T23:59:59').toISOString()
        : undefined,
      isArchived: false,
      allowMembersToAddOptions,
      allowMultiSelect,
    }

    await onCreatePoll(newPoll)
    resetAndClose()
  }

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
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
            }}
            style={{ x: '-50%' }}
            className="fixed bottom-0 left-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl z-50 h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <h2 className="text-xl font-bold dark:text-white">Create Poll</h2>
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
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Question
                </label>
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((v) => !v)}
                      className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                    >
                      {emoji}
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 grid grid-cols-6 gap-1 z-10">
                        {['📊', '🍽️', '📺', '📅', '💰', '✈️', '🏷️', '🎉', '🏠', '🎮', '🛒', '☕', '🎵', '💡', '🗳️', '⚡', '🎯', '❓'].map((e) => (
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
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ask the group something..."
                    className={`flex-1 text-base font-medium bg-transparent outline-none border-b-2 pb-2 transition-colors dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 ${showErrors && !title.trim() ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white'}`}
                    autoFocus
                  />
                </div>
                {showErrors && !title.trim() && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircleIcon size={11} />
                    Question is required
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">
                  Options
                </label>
                <div className="space-y-2">
                  {options.map((option, index) => {
                    const isDuplicate =
                      showErrors &&
                      option.trim() !== '' &&
                      options.findIndex(
                        (o, i) =>
                          i !== index &&
                          o.toLowerCase() === option.toLowerCase(),
                      ) !== -1
                    const isEmpty = showErrors && option.trim() === ''
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xs text-gray-300 dark:text-gray-600 w-5 text-right flex-shrink-0 font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <input
                            value={option}
                            onChange={(e) =>
                              handleOptionChange(index, e.target.value)
                            }
                            placeholder={`Option ${index + 1}`}
                            className={`w-full text-sm bg-transparent outline-none border-b pb-1.5 transition-colors dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 ${isDuplicate || isEmpty ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white'}`}
                          />
                          {isDuplicate && (
                            <p className="text-[11px] text-red-500 mt-0.5">
                              Duplicate option
                            </p>
                          )}
                          {isEmpty && (
                            <p className="text-[11px] text-red-500 mt-0.5">
                              Cannot be empty
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          disabled={options.length <= 2}
                          className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-400 disabled:opacity-0 disabled:pointer-events-none transition-colors flex-shrink-0"
                        >
                          <Trash2Icon size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors py-1"
                >
                  <PlusIcon size={14} />
                  Add option
                </button>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">
                  Settings
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-medium text-black dark:text-white">
                        Members can add options
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Allow anyone to suggest new choices
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAllowMembersToAddOptions((v) => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${allowMembersToAddOptions ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black shadow transition-transform ${allowMembersToAddOptions ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-medium text-black dark:text-white">
                        Allow multiple selections
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Members can vote for more than one option
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAllowMultiSelect((v) => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${allowMultiSelect ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black shadow transition-transform ${allowMultiSelect ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">
                  Expiration Date
                  <span className="ml-1.5 normal-case font-normal text-gray-300 dark:text-gray-600">
                    (optional)
                  </span>
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full text-sm bg-transparent outline-none border-b-2 pb-2 border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white transition-colors dark:text-white dark:color-scheme-dark"
                />
                <p className="text-[11px] text-gray-400">
                  Poll closes at end of day (local time).
                </p>
              </div>
            </div>

            {/* Pinned CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                onClick={handleCreate}
                disabled={showErrors && !isValid}
                className="w-full h-14 text-base bg-black dark:bg-white text-white dark:text-black rounded-xl disabled:opacity-40"
              >
                Create Poll
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
                  className="fixed inset-x-6 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 z-[61] shadow-2xl"
                >
                  <h3 className="text-base font-bold text-black dark:text-white mb-1">
                    Discard poll?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                    Your changes will be lost if you leave now.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowUnsavedWarning(false)}
                      variant="secondary"
                      className="flex-1 rounded-xl"
                    >
                      Keep editing
                    </Button>
                    <Button
                      onClick={resetAndClose}
                      className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
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
