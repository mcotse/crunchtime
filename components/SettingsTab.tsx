import React, { useState } from 'react'
import { PencilIcon, CheckIcon, MoonIcon, SunIcon } from 'lucide-react'
import { Member } from '../data/mockData'

interface SettingsTabProps {
  members: Member[]
  groupName: string
  onGroupNameChange: (name: string) => void
  isDark: boolean
  onToggleDark: () => void
}

export function SettingsTab({ members, groupName, onGroupNameChange, isDark, onToggleDark }: SettingsTabProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(groupName)

  const handleSaveName = () => {
    const trimmed = nameInput.trim()
    if (trimmed) onGroupNameChange(trimmed)
    setIsEditingName(false)
  }

  return (
    <div className="flex-1 px-4 pt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Settings</p>

      <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-900">
        <p className="text-sm font-medium">Group Name</p>
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
              autoFocus
            />
            <button onClick={handleSaveName} aria-label="Save">
              <CheckIcon size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">{groupName}</p>
            <button onClick={() => setIsEditingName(true)} aria-label="Edit">
              <PencilIcon size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-900">
        <p className="text-sm font-medium">Dark Mode</p>
        <button onClick={onToggleDark} aria-label="Toggle dark mode">
          {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Members</p>
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: m.color }}>
              {m.initials}
            </div>
            <p className="text-sm">{m.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
