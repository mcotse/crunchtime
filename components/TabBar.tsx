import React from 'react'
import { HomeIcon, ActivityIcon, UsersIcon, BarChart2Icon, SettingsIcon } from 'lucide-react'

const TABS = [
  { id: 'home', icon: HomeIcon, label: 'Home' },
  { id: 'activity', icon: ActivityIcon, label: 'Activity' },
  { id: 'members', icon: UsersIcon, label: 'Members' },
  { id: 'analytics', icon: BarChart2Icon, label: 'Analytics' },
  { id: 'settings', icon: SettingsIcon, label: 'Settings' },
]

export function TabBar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (id: string) => void }) {
  return (
    <nav className="border-t border-gray-100 dark:border-gray-800 flex">
      {TABS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
            activeTab === id ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600'
          }`}
        >
          <Icon size={20} />
          {label}
        </button>
      ))}
    </nav>
  )
}
