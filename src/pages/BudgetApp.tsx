import React, { useState, useEffect, useCallback } from 'react';
import { SettingsIcon } from 'lucide-react';
import { Member, Transaction } from '../data/mockData';
import { Poll } from '../data/pollsData';
import { BalanceHeader } from '../components/BalanceHeader';
import { TabBar } from '../components/TabBar';
import { HomeTab } from '../components/HomeTab';
import { FeedTab } from '../components/FeedTab';
import { MembersTab } from '../components/MembersTab';
import { AnalyticsTab } from '../components/AnalyticsTab';
import { SettingsTab } from '../components/SettingsTab';
import { PollsTab } from '../components/PollsTab';
import { AddTransactionSheet } from '../components/AddTransactionSheet';
import { CreatePollSheet } from '../components/CreatePollSheet';
import { PollDetailSheet } from '../components/PollDetailSheet';
import { CalendarTab } from '../components/CalendarTab';
import { DayDetailSheet } from '../components/DayDetailSheet';
import type { CalendarAvailability } from '../data/calendarData';

export function BudgetApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState('Crunch Fund');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Polls state
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [isPollDetailOpen, setIsPollDetailOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Calendar state
  const [calendarAvailability, setCalendarAvailability] =
    useState<CalendarAvailability>({})
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false)

  const CURRENT_USER_ID = 'm1';

  useEffect(() => {
    document.body.style.backgroundColor = isDark ? '#030712' : '#ffffff';
  }, [isDark]);

  const totalBalance = members.reduce((sum, m) => sum + m.balance, 0);

  const fetchPolls = () => fetch('/api/polls').then(r => r.ok ? r.json() : []);
  const fetchCalendar = () => fetch('/api/calendar').then(r => r.ok ? r.json() : {});

  // Fetch all initial data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/members').then(r => r.ok ? r.json() : []),
      fetch('/api/transactions').then(r => r.ok ? r.json() : []),
      fetch('/api/settings').then(r => r.ok ? r.json() : null),
      fetchPolls(),
      fetchCalendar(),
    ]).then(([membersData, txData, settingsData, pollsData, calendarData]) => {
      setMembers(membersData);
      setTransactions(txData);
      if (settingsData) setGroupName(settingsData.groupName);
      setPolls(pollsData);
      setCalendarAvailability(calendarData);
    });
  }, []);

  // SSE: real-time updates from server
  useEffect(() => {
    const es = new EventSource('/api/events');

    es.addEventListener('transaction_added', () => {
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

    es.addEventListener('poll_updated', () => {
      fetchPolls().then(setPolls);
    });

    es.addEventListener('calendar_updated', (e: MessageEvent) => {
      setCalendarAvailability(JSON.parse(e.data));
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

  // --- Poll handlers ---

  const handleOpenPoll = (poll: Poll) => {
    setSelectedPoll(poll);
    setIsPollDetailOpen(true);
  };

  const handleCreatePoll = async (poll: Poll) => {
    const res = await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: poll.title,
        emoji: poll.emoji,
        options: poll.options.map(o => o.text),
        expiresAt: poll.expiresAt,
        allowMembersToAddOptions: poll.allowMembersToAddOptions,
        allowMultiSelect: poll.allowMultiSelect,
      }),
    });
    if (res.ok) {
      const pollsData = await fetchPolls();
      setPolls(pollsData);
    }
  };

  const handleVote = async (pollId: string, optionIds: string[]) => {
    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionIds }),
    });
    if (res.ok) {
      const updated: Poll = await res.json();
      setPolls(prev => prev.map(p => p.id === pollId ? updated : p));
      setSelectedPoll(prev => prev && prev.id === pollId ? updated : prev);
    }
  };

  const handleAddOption = async (pollId: string, text: string) => {
    const res = await fetch(`/api/polls/${pollId}/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const updated: Poll = await res.json();
      setPolls(prev => prev.map(p => p.id === pollId ? updated : p));
      setSelectedPoll(prev => prev && prev.id === pollId ? updated : prev);
    }
  };

  const handleArchive = async (pollId: string) => {
    const res = await fetch(`/api/polls/${pollId}/archive`, { method: 'PATCH' });
    if (res.ok) {
      const updated: Poll = await res.json();
      setPolls(prev => prev.map(p => p.id === pollId ? updated : p));
      setSelectedPoll(prev => prev && prev.id === pollId ? updated : prev);
    }
  };

  const handleUnarchive = async (pollId: string) => {
    const res = await fetch(`/api/polls/${pollId}/unarchive`, { method: 'PATCH' });
    if (res.ok) {
      const updated: Poll = await res.json();
      setPolls(prev => prev.map(p => p.id === pollId ? updated : p));
      setSelectedPoll(prev => prev && prev.id === pollId ? updated : prev);
    }
  };

  // --- Calendar handlers ---
  const handleDayTap = (dateStr: string) => {
    setSelectedCalendarDate(dateStr)
    setIsDayDetailOpen(true)
  }

  const handleToggleAvailability = async (
    dateStr: string,
    slot: 'morning' | 'evening',
  ) => {
    // Optimistic update
    setCalendarAvailability((prev) => {
      const existing = prev[dateStr] ?? { morning: [], evening: [] }
      const slotArr = existing[slot]
      const isIn = slotArr.includes(CURRENT_USER_ID)
      return {
        ...prev,
        [dateStr]: {
          ...existing,
          [slot]: isIn
            ? slotArr.filter((id) => id !== CURRENT_USER_ID)
            : [...slotArr, CURRENT_USER_ID],
        },
      }
    })

    const res = await fetch(`/api/calendar/${dateStr}/${slot}`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      setCalendarAvailability(updated)
    }
  }

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
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 z-40 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <SettingsIcon size={20} className="text-gray-400 dark:text-gray-500" />
        </button>

        {activeTab !== 'home' && activeTab !== 'polls' && activeTab !== 'calendar' &&
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
          {activeTab === 'polls' &&
          <PollsTab
            polls={polls}
            members={members}
            currentUserId={CURRENT_USER_ID}
            onCreatePoll={() => setIsCreatePollOpen(true)}
            onOpenPoll={handleOpenPoll}
            onVote={handleVote} />
          }
          {activeTab === 'analytics' &&
          <AnalyticsTab members={members} transactions={transactions} isDark={isDark} />
          }
          {activeTab === 'calendar' &&
          <CalendarTab
            availability={calendarAvailability}
            members={members}
            currentUserId={CURRENT_USER_ID}
            onDayTap={handleDayTap} />
          }
        </main>

        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {showSettings && (
          <div className="absolute inset-0 z-40 bg-white dark:bg-gray-950 flex flex-col">
            <SettingsTab
              members={members}
              groupName={groupName}
              onGroupNameChange={handleGroupNameChange}
              isDark={isDark}
              onToggleDark={() => setIsDark(d => {
                localStorage.setItem('darkMode', String(!d));
                return !d;
              })}
              onClose={() => setShowSettings(false)} />
          </div>
        )}

        <AddTransactionSheet
          isOpen={isSheetOpen}
          onClose={() => { setIsSheetOpen(false); setEditingTransaction(null); }}
          members={members}
          onAdd={handleAddTransaction}
          editingTransaction={editingTransaction}
          onUpdate={handleUpdateTransaction} />

        <CreatePollSheet
          isOpen={isCreatePollOpen}
          onClose={() => setIsCreatePollOpen(false)}
          currentUserId={CURRENT_USER_ID}
          onCreatePoll={handleCreatePoll} />

        <PollDetailSheet
          poll={selectedPoll}
          members={members}
          currentUserId={CURRENT_USER_ID}
          isOpen={isPollDetailOpen}
          onClose={() => setIsPollDetailOpen(false)}
          onVote={handleVote}
          onAddOption={handleAddOption}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive} />

        <DayDetailSheet
          dateStr={selectedCalendarDate}
          isOpen={isDayDetailOpen}
          onClose={() => setIsDayDetailOpen(false)}
          availability={calendarAvailability}
          members={members}
          currentUserId={CURRENT_USER_ID}
          onToggle={handleToggleAvailability} />

      </div>
    </div>);

}
