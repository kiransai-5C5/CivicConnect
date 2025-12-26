const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const pollRoutes = require("./routes/pollRoutes");




dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/petitions', require('./routes/petitions'));
app.use("/api/polls", pollRoutes);

// Officer-specific routes
app.use("/api/officer/petitions", require("./routes/officerPetitions"));
app.use("/api/officer/polls", require("./routes/officerPolls"));
app.use("/api/officer/dashboard", require("./routes/officerDashboard"));
app.use("/api/citizen/dashboard", require("./routes/citizenDashboard"));
app.use("/api/reports", require("./routes/reportRoutes"));

// Settings routes
app.use("/api/citizen/settings", require("./routes/citizenSettings"));
app.use("/api/official/settings", require("./routes/officialSettings"));



// Health check endpoint (no auth required)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Civix API is running',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
});

// Health check for API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
});
