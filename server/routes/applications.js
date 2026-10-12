/**
 * Applications Router
 * Handles applicant submissions, duplicate validation, and safe administration queries.
 */
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');
const { validateApplicationPayload, parsePagination } = require('../validation');

// Helper to safely mask email address (e.g., j***e@domain.com)
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * POST /api/applications
 * Submit an internship application with duplicate protection
 */
router.post('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const validation = validateApplicationPayload(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed for application submission.',
        errors: validation.errors
      });
    }

    const { internship_id, applicant_name, applicant_email, portfolio_url, notes } = validation.data;

    // Check if internship exists
    const internship = db.prepare('SELECT id, title, applications_open FROM internships WHERE id = ?').get(internship_id);
    if (!internship) {
      return res.status(404).json({
        status: 'error',
        message: `Internship with ID '${internship_id}' does not exist.`
      });
    }

    if (internship.applications_open !== 1) {
      return res.status(400).json({
        status: 'error',
        message: `Applications for '${internship.title}' are currently closed.`
      });
    }

    // Check for duplicate application
    const existing = db.prepare(`
      SELECT id FROM applications
      WHERE internship_id = ? AND applicant_email = ?
    `).get(internship_id, applicant_email);

    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'You have already submitted an application for this internship.'
      });
    }

    // Insert application
    const insertStmt = db.prepare(`
      INSERT INTO applications (
        internship_id, applicant_name, applicant_email, portfolio_url, notes
      ) VALUES (
        ?, ?, ?, ?, ?
      )
    `);

    const result = insertStmt.run(internship_id, applicant_name, applicant_email, portfolio_url, notes);

    // Return safe confirmation record
    return res.status(201).json({
      status: 'success',
      message: 'Application submitted successfully.',
      data: {
        id: result.lastInsertRowid || result.lastInsertId || 1,
        internship_id,
        internship_title: internship.title,
        applicant_name,
        masked_email: maskEmail(applicant_email),
        submitted_at: new Date().toISOString()
      }
    });
  } catch (err) {
    // Catch SQLite UNIQUE constraint error if race condition occurred
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        status: 'error',
        message: 'An application for this email and internship has already been recorded.'
      });
    }
    next(err);
  }
});

/**
 * GET /api/applications
 * Administrative list of applications with masked emails and pagination
 */
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const { page, limit, offset } = parsePagination(req.query);

    const conditions = [];
    const params = [];

    if (req.query.internship_id) {
      conditions.push('internship_id = ?');
      params.push(req.query.internship_id.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) AS total FROM applications ${whereClause}`;
    const totalResult = db.prepare(countSql).get(...params);
    const total = totalResult ? totalResult.total : 0;

    const selectSql = `
      SELECT a.id, a.internship_id, a.applicant_name, a.applicant_email, a.portfolio_url, a.created_at, i.title AS internship_title
      FROM applications a
      LEFT JOIN internships i ON a.internship_id = i.id
      ${whereClause}
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(selectSql).all(...params, limit, offset);

    // Safe sanitized list for testing and auditing
    const safeData = rows.map(row => ({
      id: row.id,
      internship_id: row.internship_id,
      internship_title: row.internship_title || 'Unknown',
      applicant_name: row.applicant_name,
      masked_email: maskEmail(row.applicant_email),
      has_portfolio: Boolean(row.portfolio_url),
      created_at: row.created_at
    }));

    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    return res.status(200).json({
      status: 'success',
      data: safeData,
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

module.exports = router;
