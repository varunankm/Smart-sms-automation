const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const smsRoutes = require('./routes/smsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', smsRoutes);
app.use('/api/auth', require('./routes/authRoutes'));

// Serve Next/React frontend application in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback to React router for all other unsupported routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
