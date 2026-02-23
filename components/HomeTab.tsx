import React from 'react'
import { PlusIcon } from 'lucide-react'
import { Member, Transaction } from '../data/mockData'

interface HomeTabProps {
  members: Member[]
  transactions: Transaction[]
  balance: number
  onAddTransaction: () => void
  groupName: string
}

export function HomeTab({ members, transactions, balance, onAddTransaction, groupName }: HomeTabProps) {
  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  const recent = transactions.slice(0, 5)
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-6 pb-4 flex flex-col gap-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">{groupName}</p>
        <p className={`text-4xl font-bold tracking-tight ${balance >= 0 ? '' : 'text-red-500'}`}>
          {balance < 0 ? '-' : ''}{fmt(balance)}
        </p>
        <p className="text-xs text-gray-400">{members.length} members</p>
      </div>
      <button
        onClick={onAddTransaction}
        className="mx-4 mb-4 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold flex items-center justify-center gap-2"
      >
        <PlusIcon size={18} /> Add Transaction
      </button>
      <div className="px-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent</p>
        {recent.map((tx) => {
          const m = members.find((m) => m.id === tx.memberId)
          return (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-900">
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-gray-400">{m?.name}</p>
              </div>
              <p className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {tx.amount >= 0 ? '+' : '-'}{fmt(tx.amount)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
