/**
 * Automated Test Suite for EdVyro Full Stack Internship Project
 * Uses Node.js built-in test runner (node:test) and assertions (node:assert/strict)
 * Tests run against an isolated test SQLite database.
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Configure isolated test database environment BEFORE requiring server
const TEST_DB_PATH = path.resolve(__dirname, '../data/test_launchpad.db');
process.env.DATABASE_PATH = TEST_DB_PATH;
process.env.PORT = '5099';

// Clean old test database if present
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

const { app } = require('../server/server');
const { getDatabase, resetDefaultDatabase, createDatabase } = require('../server/database');
const { seedDatabase } = require('../server/seed');

let server;
const BASE_URL = 'http://127.0.0.1:5099';

before(async () => {
  // Initialize test DB and seed
  const db = getDatabase();
  seedDatabase(db);

  // Start HTTP server for testing
  await new Promise((resolve) => {
    server = app.listen(5099, '127.0.0.1', resolve);
  });
});

after(async () => {
  // Close server and database
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  resetDefaultDatabase();

  // Cleanup test database file
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch (e) {}
  }
});

describe('1. Health Check Endpoint', () => {
  test('GET /api/health returns 200 OK with healthy status envelope', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.status, 'healthy');
    assert.ok(typeof body.data.uptime === 'number');
    assert.ok(body.data.timestamp);
  });
});

describe('2. Internship Listings & Pagination', () => {
  test('GET /api/internships returns paginated list with total count', async () => {
    const res = await fetch(`${BASE_URL}/api/internships?page=1&limit=5`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.status, 'success');
    assert.ok(Array.isArray(body.data));
    assert.strictEqual(body.data.length, 5);
    assert.strictEqual(body.pagination.page, 1);
    assert.strictEqual(body.pagination.limit, 5);
    assert.ok(body.pagination.total >= 9);
    assert.strictEqual(body.pagination.totalPages, Math.ceil(body.pagination.total / 5));
  });

  test('GET /api/internships preserves official seed fields and array of skills', async () => {
    const res = await fetch(`${BASE_URL}/api/internships?limit=20`);
    const body = await res.json();
    assert.strictEqual(body.status, 'success');

    const item101 = body.data.find(i => i.id === 'INT-101');
    assert.ok(item101, 'INT-101 should exist');
    assert.strictEqual(item101.title, 'Frontend Intern');
    assert.strictEqual(item101.domain, 'Full Stack Development');
    assert.strictEqual(item101.mode, 'Remote');
    assert.ok(Array.isArray(item101.skills));
    assert.ok(item101.skills.includes('HTML'));
  });
});

describe('3. Search and Filtering', () => {
  test('Filter by domain returns only matching records', async () => {
    const res = await fetch(`${BASE_URL}/api/internships?domain=UI/UX`);
    const body = await res.json();
    assert.strictEqual(body.status, 'success');
    assert.ok(body.data.length > 0);
    body.data.forEach(item => {
      assert.strictEqual(item.domain, 'UI/UX');
    });
  });

  test('Filter by mode returns only matching work mode', async () => {
    const res = await fetch(`${BASE_URL}/api/internships?mode=Hybrid`);
    const body = await res.json();
    assert.strictEqual(body.status, 'success');
    assert.ok(body.data.length > 0);
    body.data.forEach(item => {
      assert.strictEqual(item.mode, 'Hybrid');
    });
  });

  test('Search query matches title or skills', async () => {
    const res = await fetch(`${BASE_URL}/api/internships?search=Figma`);
    const body = await res.json();
    assert.strictEqual(body.status, 'success');
    assert.ok(body.data.length > 0);
    body.data.forEach(item => {
      const match = (item.title && item.title.includes('Figma')) ||
                    (item.skills && item.skills.includes('Figma'));
      assert.ok(match, 'Result should match search keyword');
    });
  });
});

describe('4. Single Internship Detail', () => {
  test('GET /api/internships/:id returns existing record', async () => {
    const res = await fetch(`${BASE_URL}/api/internships/INT-102`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.id, 'INT-102');
    assert.strictEqual(body.data.title, 'API Engineering Intern');
  });

  test('GET /api/internships/:id returns 404 for nonexistent ID', async () => {
    const res = await fetch(`${BASE_URL}/api/internships/INT-999-DOES-NOT-EXIST`);
    assert.strictEqual(res.status, 404);

    const body = await res.json();
    assert.strictEqual(body.status, 'error');
    assert.ok(body.message.includes('not found'));
  });
});

describe('5. Internship CRUD Operations', () => {
  let createdId = 'INT-777';

  test('POST /api/internships creates a new listing', async () => {
    const payload = {
      id: createdId,
      title: 'Cloud DevOps Intern',
      domain: 'Cloud Computing',
      mode: 'Remote',
      location: 'Remote',
      duration_weeks: 12,
      openings: 3,
      skills: ['Docker', 'Kubernetes', 'CI/CD'],
      description: 'Hands-on cloud orchestration and automated release pipelines.'
    };

    const res = await fetch(`${BASE_URL}/api/internships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.id, createdId);
    assert.strictEqual(body.data.title, 'Cloud DevOps Intern');
  });

  test('PUT /api/internships/:id updates the existing listing', async () => {
    const res = await fetch(`${BASE_URL}/api/internships/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Senior Cloud DevOps Intern',
        openings: 5
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.title, 'Senior Cloud DevOps Intern');
    assert.strictEqual(body.data.openings, 5);
  });

  test('DELETE /api/internships/:id removes the listing', async () => {
    const res = await fetch(`${BASE_URL}/api/internships/${createdId}`, {
      method: 'DELETE'
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'success');

    // Confirm it is gone
    const verifyRes = await fetch(`${BASE_URL}/api/internships/${createdId}`);
    assert.strictEqual(verifyRes.status, 404);
  });
});

describe('6. Validation & Error Handling', () => {
  test('POST /api/internships rejects missing required fields with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/internships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // missing title, domain, mode
        duration_weeks: 4
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.status, 'error');
    assert.ok(Array.isArray(body.errors));
    assert.ok(body.errors.length > 0);
  });

  test('POST /api/internships rejects invalid work mode with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/internships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Invalid Role',
        domain: 'QA',
        mode: 'Telepathic', // Not allowed
        duration_weeks: 4
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.status, 'error');
  });

  test('POST /api/applications rejects invalid email address', async () => {
    const res = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        internship_id: 'INT-101',
        applicant_name: 'John Doe',
        applicant_email: 'not-an-email'
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.status, 'error');
    assert.ok(body.errors.some(e => e.includes('applicant_email')));
  });

  test('POST /api/applications rejects unsafe URL scheme (javascript:)', async () => {
    const res = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        internship_id: 'INT-101',
        applicant_name: 'John Doe',
        applicant_email: 'john@example.com',
        portfolio_url: 'javascript:alert(1)' // Dangerous protocol
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.status, 'error');
    assert.ok(body.errors.some(e => e.includes('portfolio_url')));
  });
});

describe('7. Applications & Duplicate Protection', () => {
  const testEmail = 'alex.test@example.com';

  test('POST /api/applications succeeds on valid submission', async () => {
    const res = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        internship_id: 'INT-101',
        applicant_name: 'Alex Test',
        applicant_email: testEmail,
        portfolio_url: 'https://github.com/alextest'
      })
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.internship_id, 'INT-101');
    assert.strictEqual(body.data.applicant_name, 'Alex Test');
    assert.ok(body.data.masked_email.includes('***'));
  });

  test('POST /api/applications rejects duplicate application with 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        internship_id: 'INT-101',
        applicant_name: 'Alex Test',
        applicant_email: testEmail
      })
    });

    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.status, 'error');
    assert.ok(body.message.includes('already'));
  });

  test('POST /api/applications rejects application when applications are closed', async () => {
    // INT-004 has applications_open = 0
    const res = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        internship_id: 'INT-004',
        applicant_name: 'Sarah Connor',
        applicant_email: 'sarah@example.com'
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.status, 'error');
    assert.ok(body.message.includes('closed'));
  });
});

describe('8. Database Persistence Across Application Re-connection', () => {
  test('Data persists in SQLite file after resetting connection', () => {
    // Query directly via fresh separate DB connection instance
    const persistentDb = createDatabase(TEST_DB_PATH);
    const row = persistentDb.prepare('SELECT title FROM internships WHERE id = ?').get('INT-101');
    assert.ok(row, 'Record INT-101 must exist in the database file');
    assert.strictEqual(row.title, 'Frontend Intern');

    const appRow = persistentDb.prepare('SELECT id FROM applications WHERE internship_id = ?').get('INT-101');
    assert.ok(appRow, 'Application submitted earlier must persist in SQLite');
  });
});
