require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const pollRoutes = require("./routes/pollRoutes");
// server.js

connectDB(); // now MONGO_URI is loaded

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



app.get('/', (req, res) => {
  res.json({ message: 'Civix API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
