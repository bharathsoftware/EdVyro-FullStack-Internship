/**
 * EdVyro Launchpad API Server
 * Express REST API with SQLite Persistence
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { getDatabase } = require('./database');
const { seedDatabase } = require('./seed');
const internshipsRouter = require('./routes/internships');
const applicationsRouter = require('./routes/applications');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Serve frontend static assets from workspace root for all-in-one local running
const staticRoot = path.resolve(__dirname, '..');
app.use(express.static(staticRoot));

// Health check endpoint
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'success',
    data: {
      service: 'EdVyro Launchpad API',
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'SQLite persistent',
      version: '1.0.0'
    }
  });
});

// API Routes
app.use('/api/internships', internshipsRouter);
app.use('/api/applications', applicationsRouter);

// 404 Handler for unmatched API routes
app.all('/api/*', (req, res) => {
  return res.status(404).json({
    status: 'error',
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Do not log sensitive credentials
  console.error(`[Server Error] ${req.method} ${req.url}:`, err.message);

  // Return clean, safe error envelope
  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    status: 'error',
    message: err.clientMessage || (statusCode === 500 ? 'An unexpected server error occurred.' : err.message)
  });
});

// Auto-seed if database has 0 internships
function autoSeedIfEmpty() {
  try {
    const db = getDatabase();
    const countRow = db.prepare('SELECT COUNT(*) as cnt FROM internships').get();
    if (!countRow || countRow.cnt === 0) {
      console.log('Database table empty. Auto-seeding initial records...');
      seedDatabase(db);
    }
  } catch (e) {
    console.warn('Auto-seed check note:', e.message);
  }
}

let serverInstance = null;
function startServer(port = PORT) {
  autoSeedIfEmpty();
  serverInstance = app.listen(port, () => {
    console.log(`====================================================`);
    console.log(`🚀 Launchpad Server running at http://localhost:${port}`);
    console.log(`📊 Health Endpoint:    http://localhost:${port}/api/health`);
    console.log(`💼 Internships API:    http://localhost:${port}/api/internships`);
    console.log(`🌐 Frontend UI:        http://localhost:${port}/`);
    console.log(`====================================================`);
  });
  return serverInstance;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
