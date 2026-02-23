import React from 'react';
import { Member, Transaction } from '../data/mockData';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer } from
'recharts';
import { motion } from 'framer-motion';
interface AnalyticsTabProps {
  members: Member[];
  transactions: Transaction[];
}
export function AnalyticsTab({ members, transactions }: AnalyticsTabProps) {
  // --- Group balance over time ---
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let running = 0;
  const balanceOverTime = sorted.map((t) => {
    running += t.amount;
    return {
      date: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(new Date(t.date)),
      balance: parseFloat(running.toFixed(2))
    };
  });
  // --- Leaderboard: net contribution per member ---
  const leaderboard = members.
  map((m) => {
    const net = transactions.
    filter((t) => t.memberId === m.id).
    reduce((sum, t) => sum + t.amount, 0);
    return {
      ...m,
      net
    };
  }).
  sort((a, b) => b.net - a.net);
  const maxAbsNet = Math.max(...leaderboard.map((m) => Math.abs(m.net)), 1);
  const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(n);
  const isPositive = (n: number) => n >= 0;
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4 space-y-8">
      <h2 className="text-lg font-semibold text-black dark:text-white px-2">
        Analytics
      </h2>

      {/* Group Balance Over Time */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest px-2">
          Group Balance Over Time
        </h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={balanceOverTime}
                margin={{
                  top: 4,
                  right: 4,
                  left: -28,
                  bottom: 0
                }}>

                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: '#9ca3af'
                  }}
                  dy={8}
                  interval="preserveStartEnd" />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: '#9ca3af'
                  }} />

                <Tooltip
                  cursor={{
                    stroke: '#e5e7eb',
                    strokeWidth: 1
                  }}
                  contentStyle={{
                    borderRadius: '10px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                  formatter={(value: number) => [fmt(value), 'Balance']} />

                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#000000"
                  strokeWidth={1.5}
                  fill="url(#balanceGrad)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: '#000',
                    strokeWidth: 0
                  }} />

              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest px-2">
          Contribution Leaderboard
        </h3>
        <div className="space-y-0">
          {leaderboard.map((member, index) => {
            const barWidth = Math.abs(member.net) / maxAbsNet * 100;
            const positive = isPositive(member.net);
            return (
              <motion.div
                key={member.id}
                initial={{
                  opacity: 0,
                  x: -6
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.04,
                  ease: 'easeOut'
                }}
                className="flex items-center py-4 px-2 border-b border-gray-100 dark:border-gray-800 last:border-0 space-x-3">

                {/* Rank */}
                <span className="text-xs font-medium text-gray-300 dark:text-gray-600 w-5 text-right flex-shrink-0">
                  {index + 1}
                </span>

                {/* Avatar */}
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: member.color
                  }}>

                  {member.initials}
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-sm font-medium text-black dark:text-white truncate block">
                    {member.name}
                  </span>
                  <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${positive ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'}`}
                      initial={{
                        width: 0
                      }}
                      animate={{
                        width: `${barWidth}%`
                      }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.04 + 0.1,
                        ease: 'easeOut'
                      }} />

                  </div>
                </div>

                {/* Net amount */}
                <span
                  className={`text-sm font-semibold tabular-nums flex-shrink-0 ${positive ? 'text-black dark:text-white' : 'text-gray-400'}`}>

                  {positive ? '+' : ''}
                  {fmt(member.net)}
                </span>
              </motion.div>);

          })}
        </div>
      </div>
    </div>);

}