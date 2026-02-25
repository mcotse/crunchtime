const NOW = new Date()
const tomorrow = new Date(NOW)
tomorrow.setDate(tomorrow.getDate() + 1)
const inThreeDays = new Date(NOW)
inThreeDays.setDate(inThreeDays.getDate() + 3)
const yesterday = new Date(NOW)
yesterday.setDate(yesterday.getDate() - 1)
const twoWeeksAgo = new Date(NOW)
twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
const oneWeekAgo = new Date(NOW)
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

export const SEED_POLLS = [
  {
    id: 'p1',
    emoji: '🍽️',
    title: 'Where should we go for team dinner?',
    creatorId: 'm1',
    createdAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: undefined as string | undefined,
    isArchived: false,
    archivedAt: undefined as string | undefined,
    allowMembersToAddOptions: true,
    allowMultiSelect: false,
    options: [
      { id: 'p1o1', text: 'Italian — Bella Napoli', voterIds: ['m1', 'm3', 'm5', 'm9'] },
      { id: 'p1o2', text: 'Japanese — Sakura Sushi', voterIds: ['m2', 'm6', 'm11'] },
      { id: 'p1o3', text: 'Mexican — Casa Fuego', voterIds: ['m4', 'm7', 'm8'] },
      { id: 'p1o4', text: 'Thai — Lotus Garden', voterIds: ['m10', 'm12'] },
    ],
  },
  {
    id: 'p2',
    emoji: '📺',
    title: 'Which streaming services should we share?',
    creatorId: 'm2',
    createdAt: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: tomorrow.toISOString(),
    isArchived: false,
    archivedAt: undefined as string | undefined,
    allowMembersToAddOptions: false,
    allowMultiSelect: true,
    options: [
      { id: 'p2o1', text: 'Netflix', voterIds: ['m1', 'm2', 'm3', 'm5', 'm7', 'm9', 'm11'] },
      { id: 'p2o2', text: 'Spotify', voterIds: ['m1', 'm4', 'm6', 'm8', 'm10', 'm12'] },
      { id: 'p2o3', text: 'Disney+', voterIds: ['m2', 'm3', 'm5'] },
      { id: 'p2o4', text: 'Apple TV+', voterIds: ['m7', 'm9'] },
    ],
  },
  {
    id: 'p3',
    emoji: '📅',
    title: 'Best day for our monthly check-in?',
    creatorId: 'm3',
    createdAt: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: inThreeDays.toISOString(),
    isArchived: false,
    archivedAt: undefined as string | undefined,
    allowMembersToAddOptions: true,
    allowMultiSelect: false,
    options: [
      { id: 'p3o1', text: 'First Monday', voterIds: ['m1', 'm2', 'm4', 'm6'] },
      { id: 'p3o2', text: 'First Friday', voterIds: ['m3', 'm5', 'm7', 'm8', 'm9'] },
      { id: 'p3o3', text: 'Last Friday', voterIds: ['m10', 'm11', 'm12'] },
    ],
  },
  {
    id: 'p4',
    emoji: '💰',
    title: 'Should we increase the monthly shared budget?',
    creatorId: 'm1',
    createdAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: yesterday.toISOString(),
    isArchived: false,
    archivedAt: undefined as string | undefined,
    allowMembersToAddOptions: false,
    allowMultiSelect: false,
    options: [
      { id: 'p4o1', text: 'Yes — increase by $50', voterIds: ['m1', 'm2', 'm5', 'm6', 'm9', 'm11'] },
      { id: 'p4o2', text: 'Yes — increase by $100', voterIds: ['m3', 'm7'] },
      { id: 'p4o3', text: 'No — keep it the same', voterIds: ['m4', 'm8', 'm10', 'm12'] },
    ],
  },
  {
    id: 'p5',
    emoji: '✈️',
    title: 'Summer vacation destination vote',
    creatorId: 'm2',
    createdAt: twoWeeksAgo.toISOString(),
    expiresAt: new Date(twoWeeksAgo.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isArchived: true,
    archivedAt: oneWeekAgo.toISOString(),
    allowMembersToAddOptions: false,
    allowMultiSelect: false,
    options: [
      { id: 'p5o1', text: 'Beach — Cancun', voterIds: ['m1', 'm2', 'm3', 'm5', 'm6'] },
      { id: 'p5o2', text: 'Mountains — Colorado', voterIds: ['m4', 'm7', 'm8'] },
      { id: 'p5o3', text: 'City — New York', voterIds: ['m9', 'm10', 'm11', 'm12'] },
    ],
  },
  {
    id: 'p6',
    emoji: '🏷️',
    title: 'What should we name our group fund?',
    creatorId: 'm5',
    createdAt: new Date(NOW.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: undefined as string | undefined,
    isArchived: false,
    archivedAt: undefined as string | undefined,
    allowMembersToAddOptions: true,
    allowMultiSelect: false,
    options: [
      { id: 'p6o1', text: 'The Vault', voterIds: ['m1', 'm4', 'm7', 'm10'] },
      { id: 'p6o2', text: 'Crunch Fund', voterIds: ['m2', 'm5', 'm8', 'm11', 'm12'] },
      { id: 'p6o3', text: 'Common Pot', voterIds: ['m3', 'm6', 'm9'] },
    ],
  },
]
