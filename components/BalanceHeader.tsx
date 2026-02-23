import React from 'react'
import { PlusIcon } from 'lucide-react'

interface BalanceHeaderProps {
  balance: number
  onAddTransaction: () => void
}

export function BalanceHeader({ balance, onAddTransaction }: BalanceHeaderProps) {
  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  return (
    <header className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Group Balance</p>
        <p className={`text-2xl font-bold ${balance >= 0 ? 'text-black dark:text-white' : 'text-red-500'}`}>
          {balance < 0 ? '-' : ''}{fmt(balance)}
        </p>
      </div>
      <button
        onClick={onAddTransaction}
        className="w-9 h-9 rounded-full bg-black dark:bg-white flex items-center justify-center"
        aria-label="Add transaction"
      >
        <PlusIcon size={18} className="text-white dark:text-black" />
      </button>
    </header>
  )
}
