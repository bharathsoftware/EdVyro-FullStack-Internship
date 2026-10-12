/**
 * Database Seed Script
 * Imports official EdVyro internship records into SQLite.
 */
const fs = require('fs');
const path = require('path');
const { getDatabase } = require('./database');

function seedDatabase(dbInstance) {
  const db = dbInstance || getDatabase();
  console.log('--- Initializing EdVyro Database Seed ---');

  const jsonPath = path.resolve(__dirname, '../data/internships.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: Seed data file not found at ${jsonPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(fileContent);
  const internships = data.internships || [];

  const insertStmt = db.prepare(`
    INSERT INTO internships (
      id, title, domain, mode, location, duration_weeks, openings, skills, description, applications_open
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      domain = excluded.domain,
      mode = excluded.mode,
      location = excluded.location,
      duration_weeks = excluded.duration_weeks,
      openings = excluded.openings,
      skills = excluded.skills,
      description = excluded.description,
      applications_open = excluded.applications_open,
      updated_at = datetime('now')
  `);

  let count = 0;
  for (const item of internships) {
    const id = item.id;
    const title = item.title;
    const domain = item.domain;
    const mode = item.mode;
    const location = item.location || 'India';
    const duration_weeks = item.duration_weeks || 4;
    const openings = item.openings !== undefined ? item.openings : 1;
    const skills = JSON.stringify(item.skills || []);
    const description = item.description || '';
    const applications_open = item.applications_open !== undefined ? item.applications_open : 1;

    insertStmt.run(
      id,
      title,
      domain,
      mode,
      location,
      duration_weeks,
      openings,
      skills,
      description,
      applications_open
    );
    count++;
  }

  console.log(`Successfully seeded ${count} internship records.`);
  return count;
}

if (require.main === module) {
  try {
    seedDatabase();
    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed database:', err);
    process.exit(1);
  }
}

module.exports = { seedDatabase };
