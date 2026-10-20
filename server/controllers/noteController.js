import db from '../db/database.js';
import { toCamelCase } from '../utils/caseConverter.js';

/**
 * POST /api/candidates/:id/notes
 * Adds a note to a candidate
 */
export function addNote(req, res, next) {
  try {
    const candidateId = Number(req.params.id);
    if (!Number.isInteger(candidateId) || candidateId <= 0) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    // Check candidate exists
    const candidate = db.prepare('SELECT id FROM candidates WHERE id = ?').get(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const { content } = req.body;

    const result = db.prepare(`
      INSERT INTO notes (candidate_id, content, created_at)
      VALUES (?, ?, datetime('now'))
    `).run(candidateId, content);

    const createdNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(toCamelCase(createdNote));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/notes/:noteId
 * Deletes a note
 */
export function deleteNote(req, res, next) {
  try {
    const noteId = Number(req.params.noteId);
    if (!Number.isInteger(noteId) || noteId <= 0) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }

    const note = db.prepare('SELECT id FROM notes WHERE id = ?').get(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    db.prepare('DELETE FROM notes WHERE id = ?').run(noteId);

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    next(err);
  }
}
