import React, { useState, useEffect } from 'react'
import { Member, Transaction } from '../data/mockData'
import { BalanceHeader } from '../components/BalanceHeader'
import { TabBar } from '../components/TabBar'
import { HomeTab } from '../components/HomeTab'
import { FeedTab } from '../components/FeedTab'
import { MembersTab } from '../components/MembersTab'
import { AnalyticsTab } from '../components/AnalyticsTab'
import { SettingsTab } from '../components/SettingsTab'
import { AddTransactionSheet } from '../components/AddTransactionSheet'

export function BudgetApp() {
  const [activeTab, setActiveTab] = useState('home')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [groupName, setGroupName] = useState('Crunch Fund')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/members').then((r) => r.json()),
      fetch('/api/transactions').then((r) => r.json()),
      fetch('/api/me').then((r) => r.json()),
    ]).then(([membersData, txData]) => {
      setMembers(membersData)
      setTransactions(txData)
    })
  }, [])

  const totalBalance = members.reduce((sum, m) => sum + m.balance, 0)

  const handleAddTransaction = (newTransaction: Transaction) => {
    setTransactions([newTransaction, ...transactions])
    setMembers(
      members.map((m) =>
        m.id === newTransaction.memberId ? { ...m, balance: m.balance + newTransaction.amount } : m,
      ),
    )
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-gray-200 ${isDark ? 'dark bg-gray-950 text-white' : 'bg-white text-black'}`}>
      <div className="max-w-md mx-auto min-h-screen relative flex flex-col">
        {activeTab !== 'home' && (
          <BalanceHeader balance={totalBalance} onAddTransaction={() => setIsSheetOpen(true)} />
        )}
        <main className="flex-1 flex flex-col">
          {activeTab === 'home' && (
            <HomeTab members={members} transactions={transactions} balance={totalBalance} onAddTransaction={() => setIsSheetOpen(true)} groupName={groupName} />
          )}
          {activeTab === 'activity' && <FeedTab transactions={transactions} members={members} />}
          {activeTab === 'members' && <MembersTab members={members} />}
          {activeTab === 'analytics' && <AnalyticsTab members={members} transactions={transactions} />}
          {activeTab === 'settings' && (
            <SettingsTab members={members} groupName={groupName} onGroupNameChange={setGroupName} isDark={isDark} onToggleDark={() => setIsDark((d) => !d)} />
          )}
        </main>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <AddTransactionSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} members={members} onAdd={handleAddTransaction} />
      </div>
    </div>
  )
}
