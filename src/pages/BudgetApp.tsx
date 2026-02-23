import React, { useState, useEffect } from 'react';
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState('Crunch Fund');
  const [isDark, setIsDark] = useState(false);

  const totalBalance = members.reduce((sum, m) => sum + m.balance, 0);

  // Fetch all initial data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/members').then(r => r.json()),
      fetch('/api/transactions').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([membersData, txData, settingsData]) => {
      setMembers(membersData);
      setTransactions(txData);
      setGroupName(settingsData.groupName);
    });
  }, []);

  // SSE: real-time updates from server
  useEffect(() => {
    const es = new EventSource('/api/events');

    es.addEventListener('transaction_added', () => {
      // Refetch both members (balance changes) and transactions
      Promise.all([
        fetch('/api/members').then(r => r.json()),
        fetch('/api/transactions').then(r => r.json()),
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

  // POST new transaction; SSE will deliver the updated state
  const handleAddTransaction = async (data: Omit<Transaction, 'id' | 'editHistory'>) => {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
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
      className={`min-h-screen font-sans selection:bg-gray-200 ${isDark ? 'dark bg-gray-950 text-white' : 'bg-white text-black'}`}>

      <div className="max-w-md mx-auto min-h-screen relative flex flex-col">
        {activeTab !== 'home' &&
        <BalanceHeader
          balance={totalBalance}
          onAddTransaction={() => setIsSheetOpen(true)} />

        }

        <main className="flex-1 flex flex-col">
          {activeTab === 'home' &&
          <HomeTab
            members={members}
            transactions={transactions}
            balance={totalBalance}
            onAddTransaction={() => setIsSheetOpen(true)}
            groupName={groupName} />

          }
          {activeTab === 'activity' &&
          <FeedTab transactions={transactions} members={members} />
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
          onClose={() => setIsSheetOpen(false)}
          members={members}
          onAdd={handleAddTransaction} />

      </div>
    </div>);

}
