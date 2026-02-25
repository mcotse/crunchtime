const NOW = new Date()

function offsetDate(days: number): string {
  const d = new Date(NOW)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function pastDate(days: number): string {
  return offsetDate(-days)
}

export const SEED_EVENTS = [
  {
    id: 'ev1',
    emoji: '🍕',
    title: 'Pizza Night',
    description: 'Monthly pizza night at the house. BYOB!',
    date: offsetDate(5),
    time: '19:00',
    creatorId: 'm1',
    createdAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    rsvps: [
      { memberId: 'm1', status: 'going' },
      { memberId: 'm2', status: 'going' },
      { memberId: 'm3', status: 'going' },
      { memberId: 'm5', status: 'maybe' },
      { memberId: 'm6', status: 'going' },
      { memberId: 'm9', status: 'cant_go' },
    ],
  },
  {
    id: 'ev2',
    emoji: '🎮',
    title: 'Game Tournament',
    description: 'Smash Bros tournament. Loser buys drinks.',
    date: offsetDate(12),
    time: '14:00',
    creatorId: 'm2',
    createdAt: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    rsvps: [
      { memberId: 'm2', status: 'going' },
      { memberId: 'm4', status: 'going' },
      { memberId: 'm7', status: 'going' },
      { memberId: 'm8', status: 'maybe' },
      { memberId: 'm11', status: 'going' },
    ],
  },
  {
    id: 'ev3',
    emoji: '🏖️',
    title: 'Beach Day',
    description: 'Heading to Santa Monica. Carpool from the house at 9am.',
    date: offsetDate(20),
    time: '09:00',
    creatorId: 'm3',
    createdAt: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    rsvps: [
      { memberId: 'm3', status: 'going' },
      { memberId: 'm1', status: 'going' },
      { memberId: 'm5', status: 'going' },
      { memberId: 'm6', status: 'going' },
      { memberId: 'm10', status: 'maybe' },
      { memberId: 'm12', status: 'maybe' },
    ],
  },
  {
    id: 'ev4',
    emoji: '🍽️',
    title: 'Team Dinner',
    description: 'Dinner at the winning restaurant from the poll.',
    date: offsetDate(8),
    time: '18:30',
    creatorId: 'm1',
    createdAt: new Date(NOW.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    linkedPollId: 'p1',
    rsvps: [
      { memberId: 'm1', status: 'going' },
      { memberId: 'm2', status: 'going' },
      { memberId: 'm3', status: 'going' },
      { memberId: 'm4', status: 'cant_go' },
      { memberId: 'm5', status: 'going' },
      { memberId: 'm7', status: 'maybe' },
      { memberId: 'm9', status: 'going' },
    ],
  },
  {
    id: 'ev5',
    emoji: '🎂',
    title: "Sarah's Birthday",
    description: 'Surprise party for Sarah! Keep it secret.',
    date: offsetDate(25),
    time: null,
    creatorId: 'm1',
    createdAt: new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    rsvps: [
      { memberId: 'm1', status: 'going' },
      { memberId: 'm3', status: 'going' },
      { memberId: 'm4', status: 'going' },
      { memberId: 'm5', status: 'going' },
      { memberId: 'm6', status: 'going' },
      { memberId: 'm7', status: 'going' },
      { memberId: 'm8', status: 'going' },
    ],
  },
  {
    id: 'ev6',
    emoji: '🎬',
    title: 'Movie Night',
    description: 'Watched Dune 2 at the IMAX.',
    date: pastDate(7),
    time: '20:00',
    creatorId: 'm4',
    createdAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    rsvps: [
      { memberId: 'm4', status: 'going' },
      { memberId: 'm1', status: 'going' },
      { memberId: 'm2', status: 'going' },
      { memberId: 'm8', status: 'going' },
      { memberId: 'm10', status: 'cant_go' },
    ],
  },
]
