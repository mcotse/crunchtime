import React, { useState } from 'react';
import {
  LogOutIcon,
  ChevronRightIcon,
  MailIcon,
  PencilIcon,
  CheckIcon,
  MoonIcon } from
'lucide-react';
import { Member } from '../data/mockData';
interface SettingsTabProps {
  members: Member[];
  groupName: string;
  onGroupNameChange: (name: string) => void;
  isDark: boolean;
  onToggleDark: () => void;
}
export function SettingsTab({
  members,
  groupName,
  onGroupNameChange,
  isDark,
  onToggleDark
}: SettingsTabProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(groupName);
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
      <h2 className={`text-lg font-semibold px-2 ${textPrimary}`}>Settings</h2>

      {/* Group name section */}
      <div className="space-y-2">
        <h3
          className={`text-xs font-semibold uppercase tracking-wider px-2 ${textMuted}`}>

          Group
        </h3>
        <div
          className={`rounded-xl border overflow-hidden ${cardBg} ${cardBorder}`}>

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
          className={`text-xs font-semibold uppercase tracking-wider px-2 ${textMuted}`}>

          Appearance
        </h3>
        <div
          className={`rounded-xl border overflow-hidden ${cardBg} ${cardBorder}`}>

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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDark ? 'bg-black' : 'bg-gray-200'}`}>

              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />

            </button>
          </div>
        </div>
      </div>

      {/* Members section */}
      <div className="space-y-2">
        <h3
          className={`text-xs font-semibold uppercase tracking-wider px-2 ${textMuted}`}>

          Group Members ({members.length})
        </h3>
        <div
          className={`rounded-xl border overflow-hidden ${cardBg} ${cardBorder}`}>

          {members.map((member) =>
          <div
            key={member.id}
            className={`flex items-center px-4 py-4 border-b last:border-0 ${divider}`}>

              <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mr-3"
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
              className={`text-sm font-semibold ml-2 flex-shrink-0 ${member.balance >= 0 ? textPrimary : 'text-red-500'}`}>

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
          className={`text-xs font-semibold uppercase tracking-wider px-2 ${textMuted}`}>

            {group.title}
          </h3>
          <div
          className={`rounded-xl border overflow-hidden ${cardBg} ${cardBorder}`}>

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