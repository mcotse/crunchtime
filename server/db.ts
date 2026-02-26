import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '..', 'crunchtime.db')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    initials  TEXT NOT NULL,
    phone     TEXT NOT NULL,
    email     TEXT NOT NULL UNIQUE,
    color     TEXT NOT NULL,
    is_admin  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id           TEXT PRIMARY KEY,
    description  TEXT NOT NULL,
    amount       REAL NOT NULL,
    member_id    TEXT NOT NULL REFERENCES members(id),
    date         TEXT NOT NULL,
    category     TEXT NOT NULL DEFAULT 'General',
    edit_history TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  INSERT OR IGNORE INTO settings (key, value) VALUES ('group_name', 'Crunch Fund');

  CREATE TABLE IF NOT EXISTS polls (
    id                           TEXT PRIMARY KEY,
    emoji                        TEXT NOT NULL DEFAULT '📊',
    title                        TEXT NOT NULL,
    creator_id                   TEXT NOT NULL REFERENCES members(id),
    created_at                   TEXT NOT NULL,
    expires_at                   TEXT,
    is_archived                  INTEGER NOT NULL DEFAULT 0,
    archived_at                  TEXT,
    allow_members_to_add_options INTEGER NOT NULL DEFAULT 1,
    allow_multi_select           INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS poll_options (
    id      TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    text    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS poll_votes (
    option_id TEXT NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id),
    PRIMARY KEY (option_id, member_id)
  );

  CREATE TABLE IF NOT EXISTS calendar_availability (
    member_id TEXT NOT NULL REFERENCES members(id),
    date      TEXT NOT NULL,
    slot      TEXT NOT NULL CHECK(slot IN ('morning', 'evening')),
    PRIMARY KEY (member_id, date, slot)
  );

  CREATE TABLE IF NOT EXISTS events (
    id          TEXT PRIMARY KEY,
    emoji       TEXT NOT NULL DEFAULT '🎉',
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    date        TEXT NOT NULL,
    time        TEXT,
    creator_id  TEXT NOT NULL REFERENCES members(id),
    created_at  TEXT NOT NULL,
    is_archived INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS event_rsvps (
    event_id  TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id),
    status    TEXT NOT NULL CHECK(status IN ('going', 'maybe', 'cant_go')),
    PRIMARY KEY (event_id, member_id)
  );
`)

// Idempotent migrations: add event_id to transactions and polls
const txCols = db.pragma('table_info(transactions)') as Array<{ name: string }>
if (!txCols.some(c => c.name === 'event_id')) {
  db.exec('ALTER TABLE transactions ADD COLUMN event_id TEXT REFERENCES events(id)')
}

const pollCols = db.pragma('table_info(polls)') as Array<{ name: string }>
if (!pollCols.some(c => c.name === 'event_id')) {
  db.exec('ALTER TABLE polls ADD COLUMN event_id TEXT REFERENCES events(id)')
}

const memberCols = db.pragma('table_info(members)') as Array<{ name: string }>
if (!memberCols.some(c => c.name === 'is_admin')) {
  db.exec('ALTER TABLE members ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0')
}

export default db
