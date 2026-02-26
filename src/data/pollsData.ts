export interface PollOption {
  id: string
  text: string
  voterIds: string[]
}

export interface PollComment {
  id: string
  memberId: string
  text: string
  createdAt: string
  editedAt?: string
}

export interface Poll {
  id: string
  emoji: string
  title: string
  options: PollOption[]
  comments: PollComment[]
  creatorId: string
  createdAt: string
  expiresAt?: string
  isArchived: boolean
  archivedAt?: string
  allowMembersToAddOptions: boolean
  allowMultiSelect: boolean
}
