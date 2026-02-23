import React, { useState, useEffect, useCallback } from 'react';
import { Member, Transaction } from '../data/mockData';
import { BalanceHeader } from '../components/BalanceHeader';
import { TabBar } from '../components/TabBar';
import { HomeTab } from '../components/HomeTab';
import { FeedTab } from '../components/FeedTab';
import { MembersTab } from '../components/MembersTab';
import { AnalyticsTab } from '../components/AnalyticsTab';
import { SettingsTab } from '../components/SettingsTab';
import { AddTransactionSheet } from '../components/AddTransactionSheet';

export function BudgetApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState('Crunch Fund');
  const [isDark, setIsDark] = useState(false);

  const totalBalance = members.reduce((sum, m) => sum + m.balance, 0);

  // Fetch all initial data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/members').then(r => r.ok ? r.json() : []),
      fetch('/api/transactions').then(r => r.ok ? r.json() : []),
      fetch('/api/settings').then(r => r.ok ? r.json() : null),
    ]).then(([membersData, txData, settingsData]) => {
      setMembers(membersData);
      setTransactions(txData);
      if (settingsData) setGroupName(settingsData.groupName);
    });
  }, []);

  // SSE: real-time updates from server
  useEffect(() => {
    const es = new EventSource('/api/events');

    es.addEventListener('transaction_added', () => {
      // Refetch both members (balance changes) and transactions
      Promise.all([
        fetch('/api/members').then(r => r.ok ? r.json() : []),
        fetch('/api/transactions').then(r => r.ok ? r.json() : []),
      ]).then(([membersData, txData]) => {
        setMembers(membersData);
        setTransactions(txData);
      });
    });

    es.addEventListener('settings_updated', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setGroupName(data.groupName);
    });

    return () => es.close();
  }, []);

  // POST new transaction then immediately sync state; SSE handles other clients
  const handleAddTransaction = async (data: Omit<Transaction, 'id' | 'editHistory'>) => {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const [membersData, txData] = await Promise.all([
      fetch('/api/members').then(r => r.ok ? r.json() : []),
      fetch('/api/transactions').then(r => r.ok ? r.json() : []),
    ]);
    setMembers(membersData);
    setTransactions(txData);
  };

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsSheetOpen(true);
  }, []);

  const handleUpdateTransaction = async (id: string, data: Omit<Transaction, 'id' | 'editHistory'>) => {
    await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const [membersData, txData] = await Promise.all([
      fetch('/api/members').then(r => r.ok ? r.json() : []),
      fetch('/api/transactions').then(r => r.ok ? r.json() : []),
    ]);
    setMembers(membersData);
    setTransactions(txData);
  };

  // PATCH group name; also update local state optimistically
  const handleGroupNameChange = async (name: string) => {
    setGroupName(name);
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupName: name }),
    });
  };

  return (
    <div
      className={`h-dvh overflow-hidden font-sans selection:bg-gray-200 ${isDark ? 'dark bg-gray-950 text-white' : 'bg-white text-black'}`}>

      <div className="max-w-md mx-auto h-full relative flex flex-col">
        {activeTab !== 'home' &&
        <BalanceHeader
          balance={totalBalance}
          onAddTransaction={() => setIsSheetOpen(true)} />

        }

        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'home' &&
          <HomeTab
            members={members}
            transactions={transactions}
            balance={totalBalance}
            onAddTransaction={() => setIsSheetOpen(true)}
            groupName={groupName} />

          }
          {activeTab === 'activity' &&
          <FeedTab transactions={transactions} members={members} onEdit={handleEditTransaction} />
          }
          {activeTab === 'members' && <MembersTab members={members} />}
          {activeTab === 'analytics' &&
          <AnalyticsTab members={members} transactions={transactions} />
          }
          {activeTab === 'settings' &&
          <SettingsTab
            members={members}
            groupName={groupName}
            onGroupNameChange={handleGroupNameChange}
            isDark={isDark}
            onToggleDark={() => setIsDark((d) => !d)} />

          }
        </main>

        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <AddTransactionSheet
          isOpen={isSheetOpen}
          onClose={() => { setIsSheetOpen(false); setEditingTransaction(null); }}
          members={members}
          onAdd={handleAddTransaction}
          editingTransaction={editingTransaction}
          onUpdate={handleUpdateTransaction} />

      </div>
    </div>);

}
