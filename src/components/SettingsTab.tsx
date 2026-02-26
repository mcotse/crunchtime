import React, { useState, useEffect, useRef } from 'react';
import {
  LogOutIcon,
  ChevronRightIcon,
  MailIcon,
  PencilIcon,
  CheckIcon,
  MoonIcon,
  BellIcon,
  SendIcon,
  DownloadIcon,
  ShareIcon,
  XIcon } from
'lucide-react';
import { Member } from '../data/mockData';
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed, isPushSupported } from '../lib/pushNotifications';
interface SettingsTabProps {
  members: Member[];
  groupName: string;
  onGroupNameChange: (name: string) => void;
  isDark: boolean;
  onToggleDark: () => void;
  isAdmin?: boolean;
  onClose?: () => void;
}
export function SettingsTab({
  members,
  groupName,
  onGroupNameChange,
  isDark,
  onToggleDark,
  isAdmin,
  onClose
}: SettingsTabProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(groupName);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const showPushToggle = isPushSupported();

  // Install prompt
  const deferredPromptRef = useRef<Event | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const isIOSChrome = isIOS && /CriOS/.test(navigator.userAgent);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    const prompt = deferredPromptRef.current as (Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }) | null;
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') {
      setCanInstall(false);
      deferredPromptRef.current = null;
    }
  };

  const showInstallBanner = !isStandalone;

  useEffect(() => {
    if (showPushToggle) {
      isPushSubscribed().then(setPushEnabled);
    }
  }, [showPushToggle]);

  const handleTogglePush = async () => {
    setPushLoading(true);
    if (pushEnabled) {
      const ok = await unsubscribeFromPush();
      if (ok) setPushEnabled(false);
    } else {
      const ok = await subscribeToPush();
      if (ok) setPushEnabled(true);
    }
    setPushLoading(false);
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true);
    try {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: broadcastMsg.trim() }),
      });
      setBroadcastMsg('');
      setBroadcastSent(true);
      setTimeout(() => setBroadcastSent(false), 2000);
    } finally {
      setBroadcastSending(false);
    }
  };
  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) onGroupNameChange(trimmed);
    setIsEditingName(false);
  };
  const bg = isDark ? 'bg-gray-950' : 'bg-white';
  const cardBg = isDark ? 'bg-gray-900' : 'bg-white';
  const cardBorder = isDark ? 'border-gray-800' : 'border-gray-100';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-400';
  const divider = isDark ? 'border-gray-800' : 'border-gray-100';
  const hoverBg = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50';
  const settingsGroups: Array<{ title: string; items: Array<{ icon: React.ElementType; label: string; value?: string; color?: string }> }> = [
  {
    title: 'Support',
    items: [
    {
      icon: LogOutIcon,
      label: 'Log Out',
      color: 'text-red-500'
    }]

  }];

  return (
    <div className={`flex-1 overflow-y-auto px-4 pb-24 space-y-8 pt-4 ${bg}`}>
      <div className="flex items-center justify-between px-2">
        <h2 className={`text-lg font-semibold ${textPrimary}`}>Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${textPrimary}`}
          >
            <XIcon size={22} />
          </button>
        )}
      </div>

      {/* Install app banner */}
      {showInstallBanner && (
        <div className={`rounded-2xl border overflow-hidden ${cardBg} ${cardBorder}`}>
          {showIOSGuide ? (
            <div className="px-4 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${textPrimary}`}>Add to Home Screen</span>
                <button onClick={() => setShowIOSGuide(false)} className={`p-1 ${textMuted}`}>
                  <XIcon size={16} />
                </button>
              </div>
              <div className={`text-sm space-y-1.5 ${textMuted}`}>
                {isIOSChrome ? (
                  <>
                    <p>1. Open this page in <strong className={textPrimary}>Safari</strong></p>
                    <p>2. Tap the <ShareIcon size={13} className="inline -mt-0.5" /> Share button</p>
                    <p>3. Tap <strong className={textPrimary}>Add to Home Screen</strong></p>
                  </>
                ) : (
                  <>
                    <p>1. Tap the <ShareIcon size={13} className="inline -mt-0.5" /> Share button</p>
                    <p>2. Scroll down and tap <strong className={textPrimary}>Add to Home Screen</strong></p>
                    <p>3. Tap <strong className={textPrimary}>Add</strong></p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className={`w-full flex items-center gap-3 px-4 py-4 transition-colors ${hoverBg}`}
            >
              <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                <DownloadIcon size={18} className="text-white dark:text-black" />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-semibold ${textPrimary}`}>Install Crunchtime</p>
                <p className={`text-xs ${textMuted}`}>
                  {isIOS ? 'Add to your home screen' : 'Install as an app on your device'}
                </p>
              </div>
              <ChevronRightIcon size={16} className={textMuted} />
            </button>
          )}
        </div>
      )}

      {/* Group name section */}
      <div className="space-y-2">
        <h3
          className={`text-xs font-semibold uppercase tracking-widest px-2 ${textMuted}`}>

          Group
        </h3>
        <div
          className={`rounded-2xl border overflow-hidden ${cardBg} ${cardBorder}`}>

          <div className="flex items-center justify-between px-4 py-4">
            <span className={`text-sm font-medium ${textMuted}`}>Name</span>
            {isEditingName ?
            <div className="flex items-center space-x-2 flex-1 ml-4">
                <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                className={`flex-1 text-sm font-medium text-right bg-transparent outline-none border-b pb-0.5 ${textPrimary} ${isDark ? 'border-gray-600' : 'border-gray-300'}`} />

                <button
                onClick={handleSaveName}
                aria-label="Save group name"
                className={`transition-colors flex-shrink-0 ${textPrimary}`}>

                  <CheckIcon size={16} />
                </button>
              </div> :

            <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${textPrimary}`}>
                  {groupName}
                </span>
                <button
                onClick={() => {
                  setNameInput(groupName);
                  setIsEditingName(true);
                }}
                aria-label="Edit group name"
                className={`transition-colors ${textMuted}`}>

                  <PencilIcon size={13} />
                </button>
              </div>
            }
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-2">
        <h3
          className={`text-xs font-semibold uppercase tracking-widest px-2 ${textMuted}`}>

          Appearance
        </h3>
        <div
          className={`rounded-2xl border overflow-hidden ${cardBg} ${cardBorder}`}>

          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-3">
              <MoonIcon size={20} className={textPrimary} />
              <span className={`text-base font-medium ${textPrimary}`}>
                Dark Mode
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleDark}
              aria-label="Toggle dark mode"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDark ? 'bg-black' : 'bg-gray-200'}`}>

              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />

            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {showPushToggle && (
        <div className="space-y-2">
          <h3
            className={`text-xs font-semibold uppercase tracking-widest px-2 ${textMuted}`}>
            Notifications
          </h3>
          <div
            className={`rounded-2xl border overflow-hidden ${cardBg} ${cardBorder}`}>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center space-x-3">
                <BellIcon size={20} className={textPrimary} />
                <span className={`text-base font-medium ${textPrimary}`}>
                  Push Notifications
                </span>
              </div>
              <button
                type="button"
                onClick={handleTogglePush}
                disabled={pushLoading}
                aria-label="Toggle push notifications"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${pushEnabled ? 'bg-black' : 'bg-gray-200'} ${pushLoading ? 'opacity-50' : ''}`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast (admin only) */}
      {isAdmin && (
        <div className="space-y-2">
          <h3
            className={`text-xs font-semibold uppercase tracking-widest px-2 ${textMuted}`}>
            Broadcast
          </h3>
          <div
            className={`rounded-2xl border overflow-hidden ${cardBg} ${cardBorder}`}>
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center space-x-3">
                <SendIcon size={20} className={textPrimary} />
                <span className={`text-base font-medium ${textPrimary}`}>
                  Send Push to Everyone
                </span>
              </div>
              <input
                type="text"
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleBroadcast(); }}
                placeholder="Type a message..."
                className={`w-full text-sm rounded-lg px-3 py-2 border outline-none ${cardBg} ${cardBorder} ${textPrimary}`}
              />
              <button
                onClick={handleBroadcast}
                disabled={broadcastSending || !broadcastMsg.trim()}
                className={`w-full text-sm font-medium py-2 rounded-lg transition-colors ${
                  broadcastSent
                    ? 'bg-green-600 text-white'
                    : 'bg-black text-white hover:bg-gray-800 disabled:opacity-40'
                }`}>
                {broadcastSent ? 'Sent!' : broadcastSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members section */}
      <div className="space-y-2">
        <h3
          className={`text-xs font-semibold uppercase tracking-widest px-2 ${textMuted}`}>

          Group Members ({members.length})
        </h3>
        <div
          className={`rounded-2xl border overflow-hidden ${cardBg} ${cardBorder}`}>

          {members.map((member) =>
          <div
            key={member.id}
            className={`flex items-center px-4 py-4 border-b last:border-0 ${divider}`}>

              <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mr-4"
              style={{
                backgroundColor: member.color
              }}>

                {member.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${textPrimary}`}>
                  {member.name}
                </p>
                <div
                className={`flex items-center space-x-2 text-[11px] mt-0.5 ${textMuted}`}>

                  <span className="flex items-center truncate">
                    <MailIcon size={9} className="mr-1" />
                    {member.email}
                  </span>
                </div>
              </div>
              <span
              className={`text-sm font-semibold ml-2 flex-shrink-0 ${member.balance > 0 ? 'text-green-600' : member.balance < 0 ? 'text-red-500' : textPrimary}`}>

                {member.balance >= 0 ? '+' : ''}
                {member.balance.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {settingsGroups.map((group, groupIndex) =>
      <div key={groupIndex} className="space-y-2">
          <h3
          className={`text-xs font-semibold uppercase tracking-widest px-2 ${textMuted}`}>

            {group.title}
          </h3>
          <div
          className={`rounded-2xl border overflow-hidden ${cardBg} ${cardBorder}`}>

            {group.items.map((item, itemIndex) =>
          <button
            key={itemIndex}
            className={`w-full flex items-center justify-between p-4 transition-colors border-b last:border-0 ${divider} ${hoverBg}`}>

                <div className="flex items-center space-x-3">
                  <item.icon size={20} className={item.color || textPrimary} />
                  <span
                className={`text-base font-medium ${item.color || textPrimary}`}>

                    {item.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.value &&
              <span className={`text-sm ${textMuted}`}>{item.value}</span>
              }
                  <ChevronRightIcon size={16} className={textMuted} />
                </div>
              </button>
          )}
          </div>
        </div>
      )}

      <div className="text-center pt-8">
        <p className={`text-xs ${textMuted}`}>
          Version {__APP_VERSION__} • Built {__BUILD_DATE__}
        </p>
      </div>
    </div>);

}