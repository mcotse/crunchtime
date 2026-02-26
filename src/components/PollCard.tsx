import React from 'react'
import { motion } from 'framer-motion'
import {
  LockIcon,
  ChevronRightIcon,
  CheckIcon,
  ClockIcon,
  Layers2Icon,
  MessageCircleIcon,
} from 'lucide-react'
import { Poll } from '../data/pollsData'
import { Member } from '../data/mockData'

interface PollCardProps {
  poll: Poll
  members: Member[]
  currentUserId: string
  onTap: (poll: Poll) => void
  onVote: (pollId: string, optionIds: string[]) => void
  index?: number
}

function getPollStatus(poll: Poll): 'open' | 'closed' {
  if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) return 'closed'
  return 'open'
}

function getExpiryLabel(dateStr: string | undefined): {
  text: string
  urgent: boolean
} {
  if (!dateStr)
    return {
      text: 'No deadline',
      urgent: false,
    }
  const now = new Date()
  const expiry = new Date(dateStr)
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffMs <= 0)
    return {
      text: '',
      urgent: false,
    }
  if (diffDays <= 1)
    return {
      text: 'Closes today',
      urgent: true,
    }
  if (diffDays === 2)
    return {
      text: 'Closes tomorrow',
      urgent: true,
    }
  if (diffDays <= 7)
    return {
      text: `Closes in ${diffDays} days`,
      urgent: true,
    }
  const formatted = expiry.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  return {
    text: `Closes ${formatted}`,
    urgent: false,
  }
}

export function PollCard({
  poll,
  members,
  currentUserId,
  onTap,
  onVote,
  index = 0,
}: PollCardProps) {
  const status = getPollStatus(poll)
  const isOpen = status === 'open'
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voterIds.length, 0)
  const maxVotes = Math.max(...poll.options.map((o) => o.voterIds.length), 1)
  const myVotedOptionIds = poll.options
    .filter((o) => o.voterIds.includes(currentUserId))
    .map((o) => o.id)

  const handleOptionClick = (optionId: string) => {
    if (!isOpen) return
    let newVotedIds: string[]
    if (poll.allowMultiSelect) {
      newVotedIds = myVotedOptionIds.includes(optionId)
        ? myVotedOptionIds.filter((id) => id !== optionId)
        : [...myVotedOptionIds, optionId]
    } else {
      newVotedIds = myVotedOptionIds.includes(optionId) ? [] : [optionId]
    }
    onVote(poll.id, newVotedIds)
  }

  const voterIds = Array.from(
    new Set(poll.options.flatMap((o) => o.voterIds)),
  ).slice(0, 4)

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 6,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.22,
        delay: index * 0.05,
        ease: 'easeOut',
      }}
      className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => onTap(poll)}
        className="w-full text-left px-5 pt-5 pb-3 flex flex-col gap-1.5"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-black dark:text-white leading-snug flex-1">
            <span className="mr-1.5">{poll.emoji}</span>
            {poll.title}
          </h3>
          <div className="flex-shrink-0 pt-0.5">
            {isOpen ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-100 dark:border-emerald-800">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"
                  aria-hidden="true"
                />
                Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold border border-gray-200 dark:border-gray-700">
                <LockIcon size={10} aria-hidden="true" />
                Closed
              </span>
            )}
          </div>
        </div>

        {isOpen &&
          (() => {
            const { text, urgent } = getExpiryLabel(poll.expiresAt)
            if (!text) return null
            return (
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${urgent ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}
                >
                  <ClockIcon size={11} />
                  {text}
                </span>
                {poll.allowMultiSelect && (
                  <Layers2Icon
                    size={12}
                    className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                  />
                )}
              </div>
            )
          })()}
      </button>

      {/* Options */}
      <div className="px-5 pb-4 space-y-2">
        {poll.options.map((option, idx) => {
          const pct =
            totalVotes > 0
              ? Math.round((option.voterIds.length / totalVotes) * 100)
              : 0
          const isVoted = myVotedOptionIds.includes(option.id)
          const isLeading =
            option.voterIds.length === maxVotes && option.voterIds.length > 0
          return (
            <motion.button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={!isOpen}
              initial={{
                opacity: 0,
                x: -4,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.18,
                delay: index * 0.05 + idx * 0.04,
              }}
              className={`w-full text-left rounded-xl border-2 overflow-hidden transition-all ${isVoted ? 'border-black dark:border-white' : 'border-gray-100 dark:border-gray-800'} ${isOpen ? 'active:scale-[0.99]' : 'cursor-default'}`}
            >
              <div className="relative px-3.5 py-3">
                <motion.div
                  className={`absolute inset-0 ${isLeading && !isOpen ? 'bg-black/5 dark:bg-white/5' : 'bg-gray-50 dark:bg-gray-800/40'}`}
                  initial={{
                    scaleX: 0,
                  }}
                  animate={{
                    scaleX: pct / 100,
                  }}
                  transition={{
                    duration: 0.55,
                    delay: index * 0.05 + idx * 0.04 + 0.1,
                    ease: 'easeOut',
                  }}
                  style={{
                    transformOrigin: 'left',
                  }}
                />
                <div className="relative flex items-center gap-3">
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isVoted ? 'bg-black dark:bg-white border-black dark:border-white' : 'border-gray-300 dark:border-gray-600'}`}
                    >
                      {isVoted && (
                        <CheckIcon
                          size={11}
                          className="text-white dark:text-black"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <span
                      className={`flex-1 text-sm font-medium truncate ${isVoted ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {option.text}
                    </span>
                    <span
                      className={`text-sm font-semibold tabular-nums flex-shrink-0 ${isLeading && !isOpen ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                      {pct}%
                    </span>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Footer */}
      <button
        onClick={() => onTap(poll)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center gap-2.5">
          {totalVotes > 0 && (
            <div className="flex items-center">
              {voterIds.map((voterId, i) => {
                const member = members.find((m) => m.id === voterId)
                if (!member) return null
                return (
                  <div
                    key={voterId}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white dark:border-gray-900 flex-shrink-0"
                    style={{
                      backgroundColor: member.color,
                      marginLeft: i === 0 ? 0 : -7,
                      zIndex: voterIds.length - i,
                      position: 'relative',
                    }}
                  >
                    {member.initials.charAt(0)}
                  </div>
                )
              })}
            </div>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {totalVotes} voted
          </span>
          {poll.comments.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <MessageCircleIcon size={11} />
              {poll.comments.length}
            </span>
          )}
        </div>
        <ChevronRightIcon size={12} className="text-gray-300 dark:text-gray-600" />
      </button>
    </motion.div>
  )
}
