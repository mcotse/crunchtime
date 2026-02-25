export interface PollOption {
  id: string
  text: string
  voterIds: string[]
}

export interface Poll {
  id: string
  emoji: string
  title: string
  options: PollOption[]
  creatorId: string
  createdAt: string
  expiresAt?: string
  isArchived: boolean
  archivedAt?: string
  allowMembersToAddOptions: boolean
  allowMultiSelect: boolean
}
