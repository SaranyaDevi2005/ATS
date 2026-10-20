import db from '../db/database.js';
import { toCamelCase } from '../utils/caseConverter.js';

// Mapping of camelCase query sort fields to SQL column names
const SORT_FIELD_MAP = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  name: 'name',
  email: 'email',
  experienceYears: 'experience_years',
  stage: 'stage',
  position: 'position',
  source: 'source',
};

/**
 * GET /api/candidates
 * Query params: search, stage, position, sort, page, limit
 */
export function getCandidates(req, res, next) {
  try {
    const { search, stage, position, sort, page, limit } = req.query;

    const conditions = [];
    const params = [];

    // Search matches name, email, skills, and position, case-insensitive
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(name) LIKE ? OR 
        LOWER(email) LIKE ? OR 
        LOWER(skills) LIKE ? OR 
        LOWER(position) LIKE ?
      )`);
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filter by stage
    if (stage && stage.trim() !== '') {
      conditions.push('stage = ?');
      params.push(stage.trim());
    }

    // Filter by position (case-insensitive)
    if (position && position.trim() !== '') {
      conditions.push('LOWER(position) = LOWER(?)');
      params.push(position.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM candidates ${whereClause}`;
    const totalResult = db.prepare(countSql).get(...params);
    const total = totalResult ? totalResult.total : 0;

    // Sorting
    let sortColumn = 'created_at';
    let sortDirection = 'DESC';

    if (sort) {
      const [field, direction] = sort.split(':');
      if (SORT_FIELD_MAP[field]) {
        sortColumn = SORT_FIELD_MAP[field];
      }
      if (direction && direction.toLowerCase() === 'asc') {
        sortDirection = 'ASC';
      }
    }

    // Pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    const querySql = `
      SELECT * FROM candidates 
      ${whereClause} 
      ORDER BY ${sortColumn} ${sortDirection} 
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(querySql).all(...params, limit, offset);

    res.json({
      data: toCamelCase(rows),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/candidates/:id
 * Returns candidate including notes and stageHistory
 */
export function getCandidateById(req, res, next) {
  try {
    const candidateId = Number(req.params.id);
    if (!Number.isInteger(candidateId) || candidateId <= 0) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const notes = db
      .prepare('SELECT * FROM notes WHERE candidate_id = ? ORDER BY created_at DESC')
      .all(candidateId);

    const stageHistory = db
      .prepare('SELECT * FROM stage_history WHERE candidate_id = ? ORDER BY changed_at ASC')
      .all(candidateId);

    const formattedCandidate = toCamelCase(candidate);
    formattedCandidate.notes = toCamelCase(notes);
    formattedCandidate.stageHistory = toCamelCase(stageHistory);

    res.json(formattedCandidate);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/candidates
 * Creates a candidate and writes the first stage_history row
 */
export function createCandidate(req, res, next) {
  try {
    const {
      name,
      email,
      phone,
      position,
      skills,
      experienceYears,
      source,
      resumeUrl,
      stage,
    } = req.body;

    const createTransaction = db.transaction(() => {
      // Insert candidate
      const insertCandidateStmt = db.prepare(`
        INSERT INTO candidates (
          name, email, phone, position, skills, experience_years, source, resume_url, stage, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      const result = insertCandidateStmt.run(
        name,
        email,
        phone,
        position,
        skills,
        experienceYears,
        source,
        resumeUrl,
        stage
      );

      const candidateId = Number(result.lastInsertRowid);

      // Write the first stage_history row (from_stage: null, to_stage: stage)
      const insertHistoryStmt = db.prepare(`
        INSERT INTO stage_history (candidate_id, from_stage, to_stage, changed_at)
        VALUES (?, NULL, ?, datetime('now'))
      `);
      insertHistoryStmt.run(candidateId, stage);

      const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId);
      const stageHistory = db
        .prepare('SELECT * FROM stage_history WHERE candidate_id = ? ORDER BY changed_at ASC')
        .all(candidateId);

      const formatted = toCamelCase(candidate);
      formatted.notes = [];
      formatted.stageHistory = toCamelCase(stageHistory);
      return formatted;
    });

    const newCandidate = createTransaction();
    res.status(201).json(newCandidate);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/candidates/:id
 * Updates candidate details
 */
export function updateCandidate(req, res, next) {
  try {
    const candidateId = Number(req.params.id);
    if (!Number.isInteger(candidateId) || candidateId <= 0) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    const currentCandidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId);
    if (!currentCandidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const updates = req.body;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const updateTransaction = db.transaction(() => {
      const fields = [];
      const values = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email);
      }
      if (updates.phone !== undefined) {
        fields.push('phone = ?');
        values.push(updates.phone);
      }
      if (updates.position !== undefined) {
        fields.push('position = ?');
        values.push(updates.position);
      }
      if (updates.skills !== undefined) {
        fields.push('skills = ?');
        values.push(updates.skills);
      }
      if (updates.experienceYears !== undefined) {
        fields.push('experience_years = ?');
        values.push(updates.experienceYears);
      }
      if (updates.source !== undefined) {
        fields.push('source = ?');
        values.push(updates.source);
      }
      if (updates.resumeUrl !== undefined) {
        fields.push('resume_url = ?');
        values.push(updates.resumeUrl);
      }
      if (updates.stage !== undefined) {
        fields.push('stage = ?');
        values.push(updates.stage);

        // If stage changed, write stage_history row
        if (updates.stage !== currentCandidate.stage) {
          db.prepare(`
            INSERT INTO stage_history (candidate_id, from_stage, to_stage, changed_at)
            VALUES (?, ?, ?, datetime('now'))
          `).run(candidateId, currentCandidate.stage, updates.stage);
        }
      }

      fields.push("updated_at = datetime('now')");

      const updateSql = `UPDATE candidates SET ${fields.join(', ')} WHERE id = ?`;
      values.push(candidateId);
      db.prepare(updateSql).run(...values);

      const updated = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId);
      const notes = db
        .prepare('SELECT * FROM notes WHERE candidate_id = ? ORDER BY created_at DESC')
        .all(candidateId);
      const stageHistory = db
        .prepare('SELECT * FROM stage_history WHERE candidate_id = ? ORDER BY changed_at ASC')
        .all(candidateId);

      const formatted = toCamelCase(updated);
      formatted.notes = toCamelCase(notes);
      formatted.stageHistory = toCamelCase(stageHistory);
      return formatted;
    });

    const updatedCandidate = updateTransaction();
    res.json(updatedCandidate);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/candidates/:id
 * Deletes candidate (cascades to notes and stage_history)
 */
export function deleteCandidate(req, res, next) {
  try {
    const candidateId = Number(req.params.id);
    if (!Number.isInteger(candidateId) || candidateId <= 0) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    const candidate = db.prepare('SELECT id FROM candidates WHERE id = ?').get(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    db.prepare('DELETE FROM candidates WHERE id = ?').run(candidateId);

    res.json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/candidates/:id/stage
 * Validates stage and writes a stage_history row
 */
export function updateCandidateStage(req, res, next) {
  try {
    const candidateId = Number(req.params.id);
    if (!Number.isInteger(candidateId) || candidateId <= 0) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    const currentCandidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId);
    if (!currentCandidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const { stage: newStage } = req.body;

    const patchTransaction = db.transaction(() => {
      const fromStage = currentCandidate.stage;

      // Update candidate stage and updated_at
      db.prepare(`
        UPDATE candidates 
        SET stage = ?, updated_at = datetime('now') 
        WHERE id = ?
      `).run(newStage, candidateId);

      // Write stage_history row
      db.prepare(`
        INSERT INTO stage_history (candidate_id, from_stage, to_stage, changed_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(candidateId, fromStage, newStage);

      const updated = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId);
      const notes = db
        .prepare('SELECT * FROM notes WHERE candidate_id = ? ORDER BY created_at DESC')
        .all(candidateId);
      const stageHistory = db
        .prepare('SELECT * FROM stage_history WHERE candidate_id = ? ORDER BY changed_at ASC')
        .all(candidateId);

      const formatted = toCamelCase(updated);
      formatted.notes = toCamelCase(notes);
      formatted.stageHistory = toCamelCase(stageHistory);
      return formatted;
    });

    const updatedCandidate = patchTransaction();
    res.json(updatedCandidate);
  } catch (err) {
    next(err);
  }
}
