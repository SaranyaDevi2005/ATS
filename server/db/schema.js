import db from './database.js';

/**
 * Initializes database schema with tables, check constraints, foreign keys, and indexes.
 */
export function initDb() {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      position TEXT NOT NULL,
      skills TEXT NOT NULL,
      experience_years INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL,
      resume_url TEXT,
      stage TEXT NOT NULL DEFAULT 'APPLIED' CHECK(stage IN ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stage_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      from_stage TEXT,
      to_stage TEXT NOT NULL,
      changed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
    CREATE INDEX IF NOT EXISTS idx_candidates_stage ON candidates(stage);
    CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position);
    CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);
    CREATE INDEX IF NOT EXISTS idx_notes_candidate_id ON notes(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_stage_history_candidate_id ON stage_history(candidate_id);
  `;

  db.exec(schemaSql);
}

export default initDb;
