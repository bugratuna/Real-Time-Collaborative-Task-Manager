// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// TODO: Import database connection function
// TODO: Import routes
// TODO: Setup Swagger

const app = express();
const PORT = process.env.PORT || 5000;

// --- Core Middlewares ---
// Enable Cross-Origin Resource Sharing
app.use(cors());
// Parse JSON bodies for incoming requests
app.use(express.json());

// --- API Routes ---
// A simple health check route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API is running successfully!' });
});

// TODO: Mount your application routes here
// Example: app.use('/api/auth', authRoutes);

// --- Error Handling Middleware (Should be the last) ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
    // TODO: Connect to the database
});