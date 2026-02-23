import React from 'react'
import { Member, Transaction } from '../data/mockData'

export function FeedTab({ transactions, members }: { transactions: Transaction[]; members: Member[] }) {
  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  return (
    <div className="flex-1 px-4 pt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">All Transactions</p>
      {transactions.map((tx) => {
        const m = members.find((m) => m.id === tx.memberId)
        return (
          <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: m?.color }}>
                {m?.initials}
              </div>
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-gray-400">{m?.name} · {new Date(tx.date).toLocaleDateString()}</p>
              </div>
            </div>
            <p className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {tx.amount >= 0 ? '+' : '-'}{fmt(tx.amount)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
