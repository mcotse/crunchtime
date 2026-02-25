export type RsvpStatus = 'going' | 'maybe' | 'cant_go'

export interface EventRsvp {
  memberId: string
  status: RsvpStatus
}

export interface GroupEvent {
  id: string
  emoji: string
  title: string
  description: string
  date: string
  time: string | null
  creatorId: string
  createdAt: string
  isArchived: boolean
  rsvps: EventRsvp[]
}

export interface GroupEventDetail extends GroupEvent {
  linkedTransactions: Array<{
    id: string
    description: string
    amount: number
    memberId: string
    date: string
  }>
  linkedPoll: {
    id: string
    emoji: string
    title: string
  } | null
  dateAvailability: {
    morning: string[]
    evening: string[]
  } | null
}
