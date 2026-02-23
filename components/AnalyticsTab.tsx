import React from 'react'
import { Member, Transaction } from '../data/mockData'

export function AnalyticsTab({ members, transactions }: { members: Member[]; transactions: Transaction[] }) {
  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  const byCategory = transactions.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount
    return acc
  }, {})
  return (
    <div className="flex-1 px-4 pt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Spending by Category</p>
      {Object.entries(byCategory).map(([cat, total]) => (
        <div key={cat} className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-900">
          <p className="text-sm font-medium">{cat}</p>
          <p className={`text-sm font-semibold ${total >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {total >= 0 ? '+' : '-'}{fmt(total)}
          </p>
        </div>
      ))}
    </div>
  )
}
