const express = require('express');
const cors = require('cors');
const path = require('path');
const { initSchema } = require('./db');
const { seedDatabase } = require('./seed');

// Initialize database
initSchema();
seedDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/subjects/:subjectId/units', require('./routes/units'));
app.use('/api/units', require('./routes/units'));
app.use('/api/study', require('./routes/study'));
app.use('/api/revisions', require('./routes/revisions'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/history', require('./routes/history'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/exam-plans', require('./routes/exam'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: '1-4-7 Smart Study Guide',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production
const clientDistPath = path.join(__dirname, '../client/dist');
if (require('fs').existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && req.method === 'GET') {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error: ' + (err.message || 'Unknown error') });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 1-4-7 Smart Study Guide server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
