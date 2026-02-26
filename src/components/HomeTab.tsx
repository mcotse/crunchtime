import React from 'react';
import { Member, Transaction } from '../data/mockData';
import { motion } from 'framer-motion';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon } from 'lucide-react';
import { Button } from './ui/Button';
interface HomeTabProps {
  members: Member[];
  transactions: Transaction[];
  balance: number;
  onAddTransaction: () => void;
  groupName: string;
}
export function HomeTab({
  members,
  transactions,
  balance,
  onAddTransaction,
  groupName
}: HomeTabProps) {
  const totalIncome = transactions.
  filter((t) => t.amount > 0).
  reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.
  filter((t) => t.amount < 0).
  reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(n);
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Math.abs(balance));
  return (
    <div className="flex-1 flex items-center justify-center px-4 pb-24 pt-6">
      <motion.div
        initial={{
          opacity: 0,
          y: 10
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          duration: 0.25,
          ease: 'easeOut'
        }}
        className="w-full space-y-6">

        {/* Balance + stats combined */}
        <div className="flex flex-col items-center space-y-6 pb-4">
          {/* Label */}
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
            {groupName}
          </span>

          {/* Big balance */}
          <h1
            className={`text-[48px] font-bold leading-none tracking-tight ${balance >= 0 ? 'text-black dark:text-white' : 'text-red-600'}`}>

            {balance < 0 && '-'}
            {formattedBalance}
          </h1>

          {/* Income / Expenses row */}
          <motion.div
            initial={{
              opacity: 0,
              y: 4
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.3,
              delay: 0.1,
              ease: 'easeOut'
            }}
            className="grid grid-cols-2 gap-4 w-full">

            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 flex flex-col space-y-2 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-1.5 text-green-600">
                <ArrowUpIcon size={12} strokeWidth={2.5} />
                <span className="text-xs font-medium uppercase tracking-widest">
                  Income
                </span>
              </div>
              <span className="text-base font-semibold text-black dark:text-white tracking-tight">
                {fmt(totalIncome)}
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 flex flex-col space-y-2 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-1.5 text-red-600">
                <ArrowDownIcon size={12} strokeWidth={2.5} />
                <span className="text-xs font-medium uppercase tracking-widest">
                  Expenses
                </span>
              </div>
              <span className="text-base font-semibold text-black dark:text-white tracking-tight">
                -{fmt(totalExpenses)}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Add Transaction button */}
        <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            duration: 0.3,
            delay: 0.2
          }}
          className="flex justify-center pt-2">

          <Button
            onClick={onAddTransaction}
            className="rounded-full h-10 px-6 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100">

            <PlusIcon size={16} className="mr-2" />
            Add Transaction
          </Button>
        </motion.div>
      </motion.div>
    </div>);

}