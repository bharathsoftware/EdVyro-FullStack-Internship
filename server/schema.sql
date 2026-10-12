-- EdVyro Internship Board Database Schema (SQLite Compatible)
-- Fictional dataset for educational internship assessment.

PRAGMA foreign_keys = ON;

-- Internships Table
CREATE TABLE IF NOT EXISTS internships (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('Remote', 'Hybrid', 'On-site')),
    location TEXT NOT NULL DEFAULT 'India',
    duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
    openings INTEGER NOT NULL DEFAULT 1 CHECK (openings >= 0),
    skills TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
    description TEXT NOT NULL DEFAULT '',
    applications_open INTEGER NOT NULL DEFAULT 1 CHECK (applications_open IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internship_id TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    portfolio_url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (internship_id, applicant_email),
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
);

-- Indexes for performance & quick filtering
CREATE INDEX IF NOT EXISTS idx_internships_domain ON internships(domain);
CREATE INDEX IF NOT EXISTS idx_internships_mode ON internships(mode);
CREATE INDEX IF NOT EXISTS idx_internships_created ON internships(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_internship ON applications(internship_id);
