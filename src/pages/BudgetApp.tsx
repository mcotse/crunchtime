import React, { useState, useEffect, useCallback } from 'react';
import { Member, Transaction } from '../data/mockData';
import { Poll } from '../data/pollsData';
import { GroupEvent, RsvpStatus } from '../data/eventsData';
import { BalanceHeader } from '../components/BalanceHeader';
import { TabBar } from '../components/TabBar';
import { HomeTab } from '../components/HomeTab';
import { FeedTab } from '../components/FeedTab';
import { MembersTab } from '../components/MembersTab';
import { SettingsTab } from '../components/SettingsTab';
import { PollsTab } from '../components/PollsTab';
import { AddTransactionSheet } from '../components/AddTransactionSheet';
import { CreatePollSheet } from '../components/CreatePollSheet';
import { PollDetailSheet } from '../components/PollDetailSheet';
import { CalendarTab } from '../components/CalendarTab';
import { DayDetailSheet } from '../components/DayDetailSheet';
import { EventsTab } from '../components/EventsTab';
import { EventDetailSheet } from '../components/EventDetailSheet';
import { CreateEventSheet } from '../components/CreateEventSheet';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import type { CalendarAvailability } from '../data/calendarData';

export function BudgetApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState('Crunch Fund');
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'transaction' | 'poll' | 'event'; id: string; title: string } | null>(null);
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
  // Calendar state
  const [calendarAvailability, setCalendarAvailability] =
    useState<CalendarAvailability>({})
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false)
  const [calendarSubTab, setCalendarSubTab] = useState<'availability' | 'events'>('availability')

  // Events state
  const [events, setEvents] = useState<GroupEvent[]>([])
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<GroupEvent | null>(null)
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false)
  const [createEventPrefillDate, setCreateEventPrefillDate] = useState<string | null>(null)
  const [transactionPrefillEventId, setTransactionPrefillEventId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.backgroundColor = isDark ? '#030712' : '#ffffff';
  }, [isDark]);

  const totalBalance = members.reduce((sum, m) => sum + m.balance, 0);

  const fetchPolls = () => fetch('/api/polls').then(r => r.ok ? r.json() : []);
  const fetchCalendar = () => fetch('/api/calendar').then(r => r.ok ? r.json() : {});
  const fetchEvents = () => fetch('/api/events').then(r => r.ok ? r.json() : []);

  // Fetch all initial data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/me').then(r => r.ok ? r.json() : null),
      fetch('/api/members').then(r => r.ok ? r.json() : []),
      fetch('/api/transactions').then(r => r.ok ? r.json() : []),
      fetch('/api/settings').then(r => r.ok ? r.json() : null),
      fetchPolls(),
      fetchCalendar(),
      fetchEvents(),
    ]).then(([meData, membersData, txData, settingsData, pollsData, calendarData, eventsData]) => {
      if (meData) {
        setCurrentUserId(meData.id);
        setIsAdmin(!!meData.is_admin);
      }
      setMembers(membersData);
      setTransactions(txData);
      if (settingsData) setGroupName(settingsData.groupName);
      setPolls(pollsData);
      setCalendarAvailability(calendarData);
      setEvents(eventsData);
    });
  }, []);

  // SSE: real-time updates from server
  useEffect(() => {
    const es = new EventSource('/api/sse');

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

    es.addEventListener('event_updated', () => {
      fetchEvents().then(setEvents);
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
    if (!currentUserId) return
    // Optimistic update
    setCalendarAvailability((prev) => {
      const existing = prev[dateStr] ?? { morning: [], evening: [] }
      const slotArr = existing[slot]
      const isIn = slotArr.includes(currentUserId)
      return {
        ...prev,
        [dateStr]: {
          ...existing,
          [slot]: isIn
            ? slotArr.filter((id) => id !== currentUserId)
            : [...slotArr, currentUserId],
        },
      }
    })

    const res = await fetch(`/api/calendar/${dateStr}/${slot}`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      setCalendarAvailability(updated)
    }
  }

  // --- Event handlers ---
  const handleOpenEvent = (event: GroupEvent) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const handleCreateEvent = async (data: {
    title: string
    emoji: string
    description: string
    date: string
    time: string | null
    linkedPollId?: string
  }) => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const eventsData = await fetchEvents();
      setEvents(eventsData);
    }
  };

  const handleRsvp = async (eventId: string, status: RsvpStatus) => {
    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated: GroupEvent = await res.json();
      setEvents(prev => prev.map(e => e.id === eventId ? updated : e));
      setSelectedEvent(prev => prev && prev.id === eventId ? updated : prev);
    }
  };

  const handleCreateEventFromDay = (dateStr: string) => {
    setCreateEventPrefillDate(dateStr);
    setIsDayDetailOpen(false);
    setIsCreateEventOpen(true);
  };

  const handleAddExpenseFromEvent = (eventId: string) => {
    setTransactionPrefillEventId(eventId);
    setIsEventDetailOpen(false);
    setIsSheetOpen(true);
  };

  const handleOpenPollFromEvent = (pollId: string) => {
    const poll = polls.find(p => p.id === pollId);
    if (poll) {
      setIsEventDetailOpen(false);
      setSelectedPoll(poll);
      setIsPollDetailOpen(true);
    }
  };

  // --- Delete handlers ---
  const handleRequestDelete = (type: 'transaction' | 'poll' | 'event', id: string, title: string) => {
    setDeleteTarget({ type, id, title })
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    const { type, id } = deleteTarget
    const endpoint = type === 'transaction' ? 'transactions' : type === 'poll' ? 'polls' : 'events'
    const res = await fetch(`/api/${endpoint}/${id}`, { method: 'DELETE' })
    if (res.ok) {
      if (type === 'transaction') {
        setTransactions(prev => prev.filter(t => t.id !== id))
        const membersData = await fetch('/api/members').then(r => r.ok ? r.json() : [])
        setMembers(membersData)
      } else if (type === 'poll') {
        setPolls(prev => prev.filter(p => p.id !== id))
        if (selectedPoll?.id === id) { setIsPollDetailOpen(false); setSelectedPoll(null) }
      } else {
        setEvents(prev => prev.filter(e => e.id !== id))
        if (selectedEvent?.id === id) { setIsEventDetailOpen(false); setSelectedEvent(null) }
      }
    }
    setDeleteTarget(null)
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
        {activeTab !== 'home' && activeTab !== 'polls' && activeTab !== 'calendar' && activeTab !== 'settings' &&
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
          <FeedTab transactions={transactions} members={members} onEdit={handleEditTransaction} isAdmin={isAdmin} onDelete={(id, title) => handleRequestDelete('transaction', id, title)} />
          }
          {activeTab === 'settings' &&
          <SettingsTab
            members={members}
            groupName={groupName}
            onGroupNameChange={handleGroupNameChange}
            isDark={isDark}
            onToggleDark={() => setIsDark(d => {
              localStorage.setItem('darkMode', String(!d));
              return !d;
            })} />
          }
          {activeTab === 'members' && <MembersTab members={members} />}
          {activeTab === 'polls' &&
          <PollsTab
            polls={polls}
            members={members}
            currentUserId={currentUserId ?? ''}
            onCreatePoll={() => setIsCreatePollOpen(true)}
            onOpenPoll={handleOpenPoll}
            onVote={handleVote} />
          }
          {activeTab === 'calendar' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Sub-tab switcher */}
              <div className="flex items-center justify-center gap-1 pt-4 pb-2 px-4">
                <button
                  onClick={() => setCalendarSubTab('availability')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                    calendarSubTab === 'availability'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                  }`}
                >
                  Availability
                </button>
                <button
                  onClick={() => setCalendarSubTab('events')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                    calendarSubTab === 'events'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                  }`}
                >
                  Events
                </button>
              </div>
              {calendarSubTab === 'availability' ? (
                <CalendarTab
                  availability={calendarAvailability}
                  members={members}
                  currentUserId={currentUserId ?? ''}
                  onDayTap={handleDayTap}
                  events={events}
                />
              ) : (
                <EventsTab
                  events={events}
                  members={members}
                  currentUserId={currentUserId ?? ''}
                  onCreateEvent={() => { setCreateEventPrefillDate(null); setIsCreateEventOpen(true) }}
                  onOpenEvent={handleOpenEvent}
                />
              )}
            </div>
          )}
        </main>

        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <AddTransactionSheet
          isOpen={isSheetOpen}
          onClose={() => { setIsSheetOpen(false); setEditingTransaction(null); setTransactionPrefillEventId(null); }}
          members={members}
          onAdd={handleAddTransaction}
          editingTransaction={editingTransaction}
          onUpdate={handleUpdateTransaction}
          events={events}
          prefillEventId={transactionPrefillEventId} />

        <CreatePollSheet
          isOpen={isCreatePollOpen}
          onClose={() => setIsCreatePollOpen(false)}
          currentUserId={currentUserId ?? ''}
          onCreatePoll={handleCreatePoll} />

        <PollDetailSheet
          poll={selectedPoll}
          members={members}
          currentUserId={currentUserId ?? ''}
          isOpen={isPollDetailOpen}
          onClose={() => setIsPollDetailOpen(false)}
          onVote={handleVote}
          onAddOption={handleAddOption}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          isAdmin={isAdmin}
          onDelete={(id, title) => handleRequestDelete('poll', id, title)} />

        <DayDetailSheet
          dateStr={selectedCalendarDate}
          isOpen={isDayDetailOpen}
          onClose={() => setIsDayDetailOpen(false)}
          availability={calendarAvailability}
          members={members}
          currentUserId={currentUserId ?? ''}
          onToggle={handleToggleAvailability}
          onCreateEvent={handleCreateEventFromDay} />

        <EventDetailSheet
          event={selectedEvent}
          members={members}
          currentUserId={currentUserId ?? ''}
          isOpen={isEventDetailOpen}
          onClose={() => setIsEventDetailOpen(false)}
          onRsvp={handleRsvp}
          onOpenPoll={handleOpenPollFromEvent}
          onAddExpense={handleAddExpenseFromEvent}
          isAdmin={isAdmin}
          onDelete={(id, title) => handleRequestDelete('event', id, title)} />

        <CreateEventSheet
          isOpen={isCreateEventOpen}
          onClose={() => setIsCreateEventOpen(false)}
          onCreateEvent={handleCreateEvent}
          prefillDate={createEventPrefillDate}
          availability={calendarAvailability}
          polls={polls}
          members={members} />

        <ConfirmDeleteModal
          isOpen={deleteTarget !== null}
          title={`Delete ${deleteTarget?.type ?? ''}?`}
          description={`"${deleteTarget?.title ?? ''}" will be permanently removed. This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)} />
      </div>
    </div>);

}
