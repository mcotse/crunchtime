import React from 'react';
import { Transaction, Member } from '../data/mockData';
import { Edit2Icon, PencilIcon, Trash2Icon } from 'lucide-react';
interface FeedTabProps {
  transactions: Transaction[];
  members: Member[];
  onEdit: (transaction: Transaction) => void;
  isAdmin?: boolean;
  onDelete?: (id: string, title: string) => void;
}
export function FeedTab({ transactions, members, onEdit, isAdmin, onDelete }: FeedTabProps) {
  const getMember = (id: string) => members.find((m) => m.id === id);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4 space-y-6">
      <h2 className="text-lg font-semibold text-black dark:text-white px-2">
        Recent Activity
      </h2>
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <span className="text-5xl">📒</span>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No transactions yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Add one to start tracking expenses
            </p>
          </div>
        </div>
      ) : (
      <div className="space-y-0">
        {transactions.map((transaction) => {
          const member = getMember(transaction.memberId);
          const isIncome = transaction.amount > 0;
          return (
            <div
              key={transaction.id}
              className="group flex items-start py-5 px-2 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg">

              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 mr-4"
                style={{
                  backgroundColor: member?.color || '#000'
                }}>

                {member?.initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-sm font-medium text-black dark:text-white truncate pr-4">
                    {transaction.description}
                  </h3>
                  <span
                    className={`text-sm font-semibold whitespace-nowrap tabular-nums flex-shrink-0 ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-black dark:text-white'}`}>

                    {isIncome ? '+' : ''}
                    {transaction.amount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <span>{member?.name}</span>
                    <span>•</span>
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                  <div className="flex items-center gap-1 -mr-1">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all text-gray-400 hover:text-black dark:hover:text-white"
                      aria-label="Edit transaction">
                      <PencilIcon size={12} />
                    </button>
                    {isAdmin && onDelete && (
                      <button
                        onClick={() => onDelete(transaction.id, transaction.description)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all text-gray-400 hover:text-red-500"
                        aria-label="Delete transaction">
                        <Trash2Icon size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {transaction.editHistory &&
                transaction.editHistory.length > 0 &&
                <div className="mt-2 flex items-start space-x-1.5 text-[11px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                      <Edit2Icon size={10} className="mt-0.5" />
                      <span>
                        Edited by {transaction.editHistory[0].editedBy}:{' '}
                        {transaction.editHistory[0].change}
                      </span>
                    </div>
                }
              </div>
            </div>);

        })}
      </div>
      )}
    </div>);

}