// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB(); // in-memory MongoDB

const app = express();
app.use(cors());
app.use(express.json());

// your routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/petitions', require('./routes/petitions'));
app.use("/api/polls", require("./routes/pollRoutes"));

// officer-specific routes
app.use("/api/officer/petitions", require("./routes/officerPetitions"));
app.use("/api/officer/polls", require("./routes/officerPolls"));
app.use("/api/officer/dashboard", require("./routes/officerDashboard"));
app.use("/api/citizen/dashboard", require("./routes/citizenDashboard"));
app.use("/api/reports", require("./routes/reportRoutes"));

app.get('/', (req, res) => {
  res.json({ message: 'Civix API is running' });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
