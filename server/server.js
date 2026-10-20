import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db/database.js';
import { initDb } from './db/schema.js';
import { seed } from './db/seed.js';
import candidateRoutes from './routes/candidateRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database schema
initDb();

// Auto-seed if candidates table is empty (ensures demo data on fresh deploy / ephemeral disk)
try {
  const candidateCountRow = db.prepare('SELECT COUNT(*) as count FROM candidates').get();
  if (!candidateCountRow || candidateCountRow.count === 0) {
    console.log('📦 Candidates table is empty. Auto-seeding initial demo data...');
    seed();
  }
} catch (err) {
  console.warn('⚠️ Could not verify candidate table for auto-seeding:', err.message);
}

// CORS configuration from CLIENT_URL env variable (if "*" or unset, allow all)
const clientUrl = process.env.CLIENT_URL;
let corsOptions;
if (!clientUrl || clientUrl === '*') {
  corsOptions = { origin: '*' };
} else {
  const allowedOrigins = clientUrl.includes(',')
    ? clientUrl.split(',').map((url) => url.trim())
    : clientUrl;
  corsOptions = {
    origin: allowedOrigins,
    credentials: true,
  };
}

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Route registration
app.use('/api/candidates', candidateRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 and Central Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 ATS Server running at http://localhost:${PORT}`);
});

export default app;
