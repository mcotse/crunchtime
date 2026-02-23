import React from 'react'
import { Member } from '../data/mockData'

export function MembersTab({ members }: { members: Member[] }) {
  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  return (
    <div className="flex-1 px-4 pt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Members</p>
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: m.color }}>
              {m.initials}
            </div>
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-xs text-gray-400">{m.phone}</p>
            </div>
          </div>
          <p className={`text-sm font-semibold ${m.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {m.balance >= 0 ? '+' : '-'}{fmt(m.balance)}
          </p>
        </div>
      ))}
    </div>
  )
}
