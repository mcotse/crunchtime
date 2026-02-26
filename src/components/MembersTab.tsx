import React from 'react';
import { Member } from '../data/mockData';
import { MailIcon } from 'lucide-react';
interface MembersTabProps {
  members: Member[];
}
export function MembersTab({ members }: MembersTabProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4 space-y-6">
      <h2 className="text-lg font-semibold text-black dark:text-white px-2">
        Group Members ({members.length})
      </h2>
      <div className="space-y-0">
        {members.map((member) =>
        <div
          key={member.id}
          className="flex items-center py-4 px-2 border-b border-gray-100 dark:border-gray-800 last:border-0">

            <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 mr-4"
            style={{
              backgroundColor: member.color
            }}>

              {member.initials}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-black dark:text-white mb-0.5">
                {member.name}
              </h3>
              <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <MailIcon size={10} className="mr-1" />
                  {member.email}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span
              className={`block text-base font-semibold ${member.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>

                {member.balance >= 0 ? '+' : ''}
                {member.balance.toFixed(2)}
              </span>
              <span className="text-xs text-gray-400">Balance</span>
            </div>
          </div>
        )}
      </div>
    </div>);

}