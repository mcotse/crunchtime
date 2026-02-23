import React from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from './ui/Button';
interface BalanceHeaderProps {
  balance: number;
  onAddTransaction: () => void;
}
export function BalanceHeader({
  balance,
  onAddTransaction
}: BalanceHeaderProps) {
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Math.abs(balance));
  return (
    <div className="pt-6 pb-4 px-6 bg-white dark:bg-gray-950 sticky top-0 z-30">
      <div className="flex flex-col items-center justify-center space-y-1">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Total Balance
        </span>
        <h1
          className={`text-[44px] font-bold leading-none tracking-tight ${balance >= 0 ? 'text-black dark:text-white' : 'text-red-600'}`}>

          {balance < 0 && '-'}
          {formattedBalance}
        </h1>
        <div className="pt-3">
          <Button
            onClick={onAddTransaction}
            className="rounded-full h-10 px-5 shadow-none bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100">

            <PlusIcon size={16} className="mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>
    </div>);

}