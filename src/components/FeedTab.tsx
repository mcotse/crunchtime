import React from 'react';
import { Transaction, Member } from '../data/mockData';
import { Edit2Icon, PencilIcon } from 'lucide-react';
interface FeedTabProps {
  transactions: Transaction[];
  members: Member[];
  onEdit: (transaction: Transaction) => void;
}
export function FeedTab({ transactions, members, onEdit }: FeedTabProps) {
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
    <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-6">
      <h2 className="text-lg font-semibold text-black dark:text-white px-2 pt-2">
        Recent Activity
      </h2>
      <div className="space-y-0">
        {transactions.map((transaction) => {
          const member = getMember(transaction.memberId);
          const isIncome = transaction.amount > 0;
          return (
            <div
              key={transaction.id}
              className="group flex items-start py-5 px-2 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors rounded-lg">

              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 mr-4"
                style={{
                  backgroundColor: member?.color || '#000'
                }}>

                {member?.initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-base font-medium text-black dark:text-white truncate pr-4">
                    {transaction.description}
                  </h3>
                  <span
                    className="text-base font-semibold whitespace-nowrap text-black dark:text-white">

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
                  <button
                    onClick={() => onEdit(transaction)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all text-gray-400 hover:text-black dark:hover:text-white -mr-1"
                    aria-label="Edit transaction">
                    <PencilIcon size={12} />
                  </button>
                </div>

                {transaction.editHistory &&
                transaction.editHistory.length > 0 &&
                <div className="mt-2 flex items-start space-x-1.5 text-[11px] text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded">
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
    </div>);

}