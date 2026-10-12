/**
 * Internships Router
 * Full CRUD, pagination, filtering, searching, and stable sorting.
 */
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');
const { parsePagination, validateInternshipPayload } = require('../validation');

// Helper to format internship database record
function formatInternship(row) {
  if (!row) return null;
  let skills = [];
  try {
    skills = JSON.parse(row.skills || '[]');
  } catch (e) {
    skills = [];
  }
  return {
    id: row.id,
    title: row.title,
    domain: row.domain,
    mode: row.mode,
    location: row.location,
    duration_weeks: row.duration_weeks,
    openings: row.openings,
    skills,
    description: row.description,
    applications_open: Boolean(row.applications_open),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * GET /api/internships
 * List internships with pagination, search, domain filter, and mode filter
 */
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const { page, limit, offset } = parsePagination(req.query);

    const conditions = [];
    const params = [];

    // Search query across title, domain, location, skills
    const searchQuery = (req.query.search || req.query.q || '').trim();
    if (searchQuery) {
      conditions.push(`(
        title LIKE ? OR
        domain LIKE ? OR
        location LIKE ? OR
        skills LIKE ? OR
        mode LIKE ?
      )`);
      const term = `%${searchQuery}%`;
      params.push(term, term, term, term, term);
    }

    // Domain filter
    if (req.query.domain && req.query.domain.trim()) {
      conditions.push('domain = ?');
      params.push(req.query.domain.trim());
    }

    // Mode filter
    if (req.query.mode && req.query.mode.trim()) {
      conditions.push('mode = ?');
      params.push(req.query.mode.trim());
    }

    // applications_open filter
    if (req.query.applications_open !== undefined) {
      const isOpen = req.query.applications_open === 'true' || req.query.applications_open === '1' ? 1 : 0;
      conditions.push('applications_open = ?');
      params.push(isOpen);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matches
    const countSql = `SELECT COUNT(*) AS total FROM internships ${whereClause}`;
    const countStmt = db.prepare(countSql);
    const countResult = countStmt.get(...params);
    const total = countResult ? countResult.total : 0;

    // Sorting
    let orderBy = 'ORDER BY created_at DESC, id ASC';
    if (req.query.sort === 'title_asc') {
      orderBy = 'ORDER BY title ASC, id ASC';
    } else if (req.query.sort === 'duration_desc') {
      orderBy = 'ORDER BY duration_weeks DESC, id ASC';
    } else if (req.query.sort === 'oldest') {
      orderBy = 'ORDER BY created_at ASC, id ASC';
    }

    // Fetch paginated slice
    const selectSql = `
      SELECT * FROM internships
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const selectStmt = db.prepare(selectSql);
    const rows = selectStmt.all(...params, limit, offset);

    const data = rows.map(formatInternship);
    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    return res.status(200).json({
      status: 'success',
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/internships/:id
 * Retrieve a single internship by its unique identifier
 */
router.get('/:id', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const stmt = db.prepare('SELECT * FROM internships WHERE id = ?');
    const row = stmt.get(id);

    if (!row) {
      return res.status(404).json({
        status: 'error',
        message: `Internship with ID '${id}' was not found.`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: formatInternship(row)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/internships
 * Create a new internship listing
 */
router.post('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const validation = validateInternshipPayload(req.body, false);

    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed for internship creation.',
        errors: validation.errors
      });
    }

    const clean = validation.data;

    // Generate ID if not supplied
    let newId = clean.id;
    if (!newId) {
      const maxRow = db.prepare(`
        SELECT id FROM internships
        WHERE id LIKE 'INT-%'
        ORDER BY length(id) DESC, id DESC
        LIMIT 1
      `).get();

      let nextNum = 200;
      if (maxRow && maxRow.id) {
        const parts = maxRow.id.split('-');
        const parsed = parseInt(parts[1], 10);
        if (!isNaN(parsed)) {
          nextNum = parsed + 1;
        }
      }
      newId = `INT-${nextNum}`;
    } else {
      // Check for duplicate custom ID
      const existing = db.prepare('SELECT id FROM internships WHERE id = ?').get(newId);
      if (existing) {
        return res.status(409).json({
          status: 'error',
          message: `An internship with ID '${newId}' already exists.`
        });
      }
    }

    const insertStmt = db.prepare(`
      INSERT INTO internships (
        id, title, domain, mode, location, duration_weeks, openings, skills, description, applications_open
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insertStmt.run(
      newId,
      clean.title,
      clean.domain,
      clean.mode,
      clean.location,
      clean.duration_weeks,
      clean.openings,
      clean.skills,
      clean.description,
      clean.applications_open
    );

    const createdRow = db.prepare('SELECT * FROM internships WHERE id = ?').get(newId);

    return res.status(201).json({
      status: 'success',
      message: 'Internship created successfully.',
      data: formatInternship(createdRow)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/internships/:id
 * Update an existing internship
 */
router.put('/:id', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM internships WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: `Internship with ID '${id}' was not found.`
      });
    }

    const validation = validateInternshipPayload(req.body, true);
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed for internship update.',
        errors: validation.errors
      });
    }

    const clean = validation.data;
    if (Object.keys(clean).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one field must be provided to update.'
      });
    }

    const setClauses = [];
    const values = [];

    for (const [key, value] of Object.entries(clean)) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
    setClauses.push("updated_at = datetime('now')");

    const updateSql = `UPDATE internships SET ${setClauses.join(', ')} WHERE id = ?`;
    values.push(id);

    db.prepare(updateSql).run(...values);

    const updatedRow = db.prepare('SELECT * FROM internships WHERE id = ?').get(id);

    return res.status(200).json({
      status: 'success',
      message: 'Internship updated successfully.',
      data: formatInternship(updatedRow)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/internships/:id
 * Remove an internship listing
 */
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM internships WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: `Internship with ID '${id}' was not found.`
      });
    }

    db.prepare('DELETE FROM internships WHERE id = ?').run(id);

    return res.status(200).json({
      status: 'success',
      message: `Internship '${id}' deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
