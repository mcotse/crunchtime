import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XIcon,
  MoreHorizontalIcon,
  LockIcon,
  PlusIcon,
  UsersIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  CheckIcon,
  Trash2Icon,
  MessageCircleIcon,
  PencilIcon,
  SendIcon,
} from 'lucide-react'
import { Poll, PollOption, PollComment } from '../data/pollsData'
import { Member } from '../data/mockData'

interface PollDetailSheetProps {
  poll: Poll | null
  members: Member[]
  currentUserId: string
  isOpen: boolean
  onClose: () => void
  onVote: (pollId: string, optionIds: string[]) => void
  onAddOption: (pollId: string, text: string) => void
  onArchive: (pollId: string) => void
  onUnarchive: (pollId: string) => void
  onAddComment: (pollId: string, text: string) => void
  onEditComment: (pollId: string, commentId: string, text: string) => void
  onDeleteComment: (pollId: string, commentId: string) => void
  isAdmin?: boolean
  onDelete?: (pollId: string, title: string) => void
}

function getPollStatus(poll: Poll): 'open' | 'closed' {
  if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) return 'closed'
  return 'open'
}

function formatExpiry(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function PollDetailSheet({
  poll,
  members,
  currentUserId,
  isOpen,
  onClose,
  onVote,
  onAddOption,
  onArchive,
  onUnarchive,
  onAddComment,
  onEditComment,
  onDeleteComment,
  isAdmin,
  onDelete,
}: PollDetailSheetProps) {
  const [showOverflow, setShowOverflow] = useState(false)
  const [voterSheetOption, setVoterSheetOption] = useState<PollOption | null>(null)
  const [newOptionText, setNewOptionText] = useState('')
  const [commentText, setCommentText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')

  if (!poll) return null

  const status = getPollStatus(poll)
  const isOpen_ = status === 'open'
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voterIds.length, 0)
  const uniqueParticipants = new Set(poll.options.flatMap((o) => o.voterIds)).size

  const myVotedOptionIds = poll.options
    .filter((o) => o.voterIds.includes(currentUserId))
    .map((o) => o.id)

  const isCreator = poll.creatorId === currentUserId
  const canArchive = isCreator

  const maxVoteCount = Math.max(...poll.options.map((o) => o.voterIds.length))
  const winners = poll.options.filter(
    (o) => o.voterIds.length === maxVoteCount && maxVoteCount > 0,
  )
  const isTie = winners.length > 1

  const getMember = (id: string) => members.find((m) => m.id === id)

  const handleVote = (optionId: string) => {
    if (!isOpen_) return
    let newVotedIds: string[]
    if (poll.allowMultiSelect) {
      if (myVotedOptionIds.includes(optionId)) {
        newVotedIds = myVotedOptionIds.filter((id) => id !== optionId)
      } else {
        newVotedIds = [...myVotedOptionIds, optionId]
      }
    } else {
      if (myVotedOptionIds.includes(optionId)) {
        newVotedIds = []
      } else {
        newVotedIds = [optionId]
      }
    }
    onVote(poll.id, newVotedIds)
  }

  const handleAddOption = () => {
    const text = newOptionText.trim()
    if (!text) return
    onAddOption(poll.id, text)
    setNewOptionText('')
  }

  const handleSubmitComment = () => {
    const text = commentText.trim()
    if (!text) return
    onAddComment(poll.id, text)
    setCommentText('')
  }

  const handleSaveEdit = (commentId: string) => {
    const text = editingCommentText.trim()
    if (!text) return
    onEditComment(poll.id, commentId, text)
    setEditingCommentId(null)
    setEditingCommentText('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
            }}
            className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-t-3xl z-[51] h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex-1 pr-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {isOpen_ ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-100 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold border border-gray-200 dark:border-gray-800">
                      <LockIcon size={9} />
                      Closed
                    </span>
                  )}
                  {poll.isArchived && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-100 dark:border-amber-800">
                      <ArchiveIcon size={9} />
                      Archived
                    </span>
                  )}
                  {poll.expiresAt && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {isOpen_ ? 'Ends' : 'Ended'}{' '}
                      {formatExpiry(poll.expiresAt)}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-black dark:text-white leading-snug">
                  <span className="mr-1.5">{poll.emoji}</span>
                  {poll.title}
                </h2>
                {getMember(poll.creatorId) && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    by {getMember(poll.creatorId)?.name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {(canArchive || isAdmin) && (
                  <div className="relative">
                    <button
                      onClick={() => setShowOverflow((v) => !v)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-white"
                    >
                      <MoreHorizontalIcon size={20} />
                    </button>
                    <AnimatePresence>
                      {showOverflow && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden min-w-[160px] z-10"
                        >
                          {canArchive && (poll.isArchived ? (
                            <button
                              onClick={() => {
                                onUnarchive(poll.id)
                                setShowOverflow(false)
                              }}
                              className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <ArchiveRestoreIcon size={15} />
                              Unarchive Poll
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onArchive(poll.id)
                                setShowOverflow(false)
                              }}
                              className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <ArchiveIcon size={15} />
                              Archive Poll
                            </button>
                          ))}
                          {isAdmin && onDelete && (
                            <button
                              onClick={() => {
                                onDelete(poll.id, poll.title)
                                setShowOverflow(false)
                              }}
                              className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2Icon size={15} />
                              Delete Poll
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-white"
                >
                  <XIcon size={22} />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto"
              onClick={() => showOverflow && setShowOverflow(false)}
            >
              <div className="p-6 space-y-6">
                {/* Winner banner for closed polls */}
                {!isOpen_ && maxVoteCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black dark:bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                  >
                    <span className="text-lg">{'\u{1F3C6}'}</span>
                    <div>
                      <p className="text-xs font-medium text-white dark:text-black uppercase tracking-widest">
                        {isTie ? 'Tie' : 'Winner'}
                      </p>
                      <p className="text-sm font-semibold text-white dark:text-black">
                        {winners.map((w) => w.text).join(', ')}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Voting module */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2">
                      {poll.allowMultiSelect
                        ? 'Select all that apply'
                        : 'Choose one'}
                    </h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <UsersIcon size={10} />
                      {uniqueParticipants} voted
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {poll.options.map((option, idx) => {
                      const pct =
                        totalVotes > 0
                          ? Math.round(
                              (option.voterIds.length / totalVotes) * 100,
                            )
                          : 0
                      const isVoted = myVotedOptionIds.includes(option.id)
                      const isWinner =
                        !isOpen_ && winners.some((w) => w.id === option.id)

                      return (
                        <motion.div
                          key={option.id}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: idx * 0.04,
                          }}
                        >
                          <button
                            onClick={() => handleVote(option.id)}
                            disabled={!isOpen_}
                            className={`w-full text-left rounded-xl border-2 transition-all overflow-hidden ${isVoted ? 'border-black dark:border-white' : 'border-gray-100 dark:border-gray-800'} ${isOpen_ ? 'active:scale-[0.99]' : 'cursor-default'}`}
                          >
                            <div className="relative px-4 py-3.5">
                              <motion.div
                                className={`absolute inset-0 ${isWinner ? 'bg-black/5 dark:bg-white/5' : 'bg-gray-50 dark:bg-gray-800/50'}`}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: pct / 100 }}
                                transition={{
                                  duration: 0.6,
                                  delay: idx * 0.04 + 0.1,
                                  ease: 'easeOut',
                                }}
                                style={{ transformOrigin: 'left' }}
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
                                    className={`flex-1 text-sm font-medium ${isVoted ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}
                                  >
                                    {option.text}
                                  </span>

                                  <span className="text-xs font-semibold tabular-nums text-gray-500 dark:text-gray-400 flex-shrink-0">
                                    {pct}%
                                  </span>

                                  {option.voterIds.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setVoterSheetOption(option)
                                      }}
                                      className="flex items-center gap-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                                    >
                                      <UsersIcon size={11} />
                                      <span className="text-xs font-semibold tabular-nums">{option.voterIds.length}</span>
                                    </button>
                                  )}
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Add option */}
                {isOpen_ && poll.allowMembersToAddOptions && (
                  <div className="flex items-center gap-2">
                    <input
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                      placeholder="+ Add an option..."
                      className="flex-1 text-sm bg-transparent outline-none border-b border-dashed border-gray-200 dark:border-gray-800 pb-1.5 text-black dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:border-black dark:focus:border-white transition-colors"
                    />
                    {newOptionText.trim() && (
                      <button
                        onClick={handleAddOption}
                        className="p-1.5 bg-black dark:bg-white rounded-full text-white dark:text-black flex-shrink-0"
                      >
                        <PlusIcon size={12} />
                      </button>
                    )}
                  </div>
                )}

                {/* Comments section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-1.5">
                    <MessageCircleIcon size={12} className="text-gray-400" />
                    <h3 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2">
                      Comments{poll.comments.length > 0 ? ` (${poll.comments.length})` : ''}
                    </h3>
                  </div>

                  {poll.comments.length > 0 && (
                    <div className="space-y-3">
                      {poll.comments.map((comment) => {
                        const member = getMember(comment.memberId)
                        const isOwn = comment.memberId === currentUserId
                        const isEditing = editingCommentId === comment.id
                        return (
                          <div key={comment.id} className="flex gap-2.5">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: member?.color ?? '#999' }}
                            >
                              {member?.initials ?? '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-black dark:text-white truncate">
                                  {member?.name ?? 'Unknown'}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                                  {formatRelativeTime(comment.createdAt)}
                                </span>
                                {comment.editedAt && (
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 italic flex-shrink-0">
                                    edited
                                  </span>
                                )}
                              </div>
                              {isEditing ? (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <input
                                    value={editingCommentText}
                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEdit(comment.id)
                                      if (e.key === 'Escape') { setEditingCommentId(null); setEditingCommentText('') }
                                    }}
                                    autoFocus
                                    className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl px-2.5 py-1.5 outline-none text-black dark:text-white border border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white transition-colors"
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(comment.id)}
                                    className="p-1 text-black dark:text-white"
                                  >
                                    <CheckIcon size={14} />
                                  </button>
                                  <button
                                    onClick={() => { setEditingCommentId(null); setEditingCommentText('') }}
                                    className="p-1 text-gray-400"
                                  >
                                    <XIcon size={14} />
                                  </button>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                                  {comment.text}
                                </p>
                              )}
                              {isOwn && !isEditing && (
                                <div className="flex items-center gap-3 mt-1">
                                  <button
                                    onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.text) }}
                                    className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-0.5 transition-colors"
                                  >
                                    <PencilIcon size={9} />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => onDeleteComment(poll.id, comment.id)}
                                    className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-0.5 transition-colors"
                                  >
                                    <Trash2Icon size={9} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Comment input */}
                  <div className="flex items-center gap-2">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                      placeholder="Add a comment..."
                      className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2 outline-none text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white transition-colors"
                    />
                    {commentText.trim() && (
                      <button
                        onClick={handleSubmitComment}
                        className="p-2 bg-black dark:bg-white rounded-full text-white dark:text-black flex-shrink-0"
                      >
                        <SendIcon size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Voter list bottom sheet */}
          <AnimatePresence>
            {voterSheetOption && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setVoterSheetOption(null)}
                  className="fixed inset-0 bg-black z-[60]"
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{
                    type: 'spring',
                    damping: 25,
                    stiffness: 200,
                  }}
                  className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-t-3xl z-[61] max-h-[60vh] flex flex-col"
                >
                  <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div>
                      <h3 className="text-base font-semibold text-black dark:text-white">
                        {voterSheetOption.text}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {voterSheetOption.voterIds.length} vote
                        {voterSheetOption.voterIds.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => setVoterSheetOption(null)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-white"
                    >
                      <XIcon size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {voterSheetOption.voterIds.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">
                        No votes yet
                      </p>
                    ) : (
                      <div className="space-y-0">
                        {voterSheetOption.voterIds.map((voterId) => {
                          const member = getMember(voterId)
                          if (!member) return null
                          return (
                            <div
                              key={voterId}
                              className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                            >
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                                style={{
                                  backgroundColor: member.color,
                                }}
                              >
                                {member.initials}
                              </div>
                              <span className="text-sm font-medium text-black dark:text-white">
                                {member.name}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
