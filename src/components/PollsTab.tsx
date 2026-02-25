import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  ChevronDownIcon,
  InboxIcon,
  ChevronRightIcon,
  UsersIcon,
} from 'lucide-react'
import { Poll } from '../data/pollsData'
import { Member } from '../data/mockData'
import { PollCard } from './PollCard'
import { Button } from './ui/Button'

interface PollsTabProps {
  polls: Poll[]
  members: Member[]
  currentUserId: string
  onCreatePoll: () => void
  onOpenPoll: (poll: Poll) => void
  onVote: (pollId: string, optionIds: string[]) => void
}

function ArchivedPollRow({
  poll,
  onTap,
  index,
}: {
  poll: Poll
  onTap: (p: Poll) => void
  index: number
}) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voterIds.length, 0)
  const maxVotes = Math.max(...poll.options.map((o) => o.voterIds.length), 0)
  const winners = poll.options.filter(
    (o) => o.voterIds.length === maxVotes && maxVotes > 0,
  )
  const winnerText =
    winners.length > 0 ? winners.map((w) => w.text).join(', ') : null

  return (
    <motion.button
      initial={{
        opacity: 0,
        y: 4,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.18,
        delay: index * 0.04,
        ease: 'easeOut',
      }}
      onClick={() => onTap(poll)}
      className="w-full flex items-center gap-3 py-3.5 px-2 border-b border-gray-100 dark:border-gray-800 last:border-0 text-left"
    >
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
          {poll.title}
        </p>
        {winnerText && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {winners.length > 1 ? 'Tie: ' : '\u{1F3C6} '}
            {winnerText}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
        <UsersIcon size={11} />
        <span>{totalVotes}</span>
      </div>
      <ChevronRightIcon
        size={14}
        className="text-gray-300 dark:text-gray-600 flex-shrink-0"
      />
    </motion.button>
  )
}

export function PollsTab({
  polls,
  members,
  currentUserId,
  onCreatePoll,
  onOpenPoll,
  onVote,
}: PollsTabProps) {
  const [archivedExpanded, setArchivedExpanded] = useState(false)

  const activePolls = polls.filter(
    (p) =>
      !p.isArchived && (!p.expiresAt || new Date(p.expiresAt) > new Date()),
  )
  const archivedPolls = polls.filter(
    (p) => p.isArchived || (p.expiresAt && new Date(p.expiresAt) <= new Date()),
  )

  const sortedActive = [...activePolls].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const sortedArchived = [...archivedPolls].sort((a, b) => {
    const aTime = new Date(a.archivedAt ?? a.expiresAt ?? a.createdAt).getTime()
    const bTime = new Date(b.archivedAt ?? b.expiresAt ?? b.createdAt).getTime()
    return bTime - aTime
  })

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-32 pt-6 space-y-6">
      <div className="flex justify-center pt-2 pb-2">
        <Button
          onClick={onCreatePoll}
          className="rounded-full h-10 px-5 bg-black dark:bg-white text-white dark:text-black"
        >
          <PlusIcon size={16} className="mr-2" />
          Create Poll
        </Button>
      </div>

      {/* Active Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest px-2">
          Active
        </h3>

        {sortedActive.length === 0 ? (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="flex flex-col items-center justify-center py-12 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <InboxIcon
                size={22}
                className="text-gray-400 dark:text-gray-500"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                No active polls
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Create one to get the group's input
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            {sortedActive.map((poll, i) => (
              <PollCard
                key={poll.id}
                poll={poll}
                members={members}
                currentUserId={currentUserId}
                onTap={onOpenPoll}
                onVote={onVote}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Archived Section */}
      {sortedArchived.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setArchivedExpanded((v) => !v)}
            className="flex items-center justify-between w-full px-2"
          >
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest">
              Archived ({sortedArchived.length})
            </h3>
            <motion.div
              animate={{
                rotate: archivedExpanded ? 0 : -90,
              }}
              transition={{
                duration: 0.2,
              }}
            >
              <ChevronDownIcon size={14} className="text-gray-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {archivedExpanded && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: 'auto',
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                transition={{
                  duration: 0.25,
                  ease: 'easeOut',
                }}
                className="overflow-hidden"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-2">
                  {sortedArchived.map((poll, i) => (
                    <ArchivedPollRow
                      key={poll.id}
                      poll={poll}
                      onTap={onOpenPoll}
                      index={i}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
