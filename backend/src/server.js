require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDB } = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
const { registerSocketHandlers } = require('./socket');

const app = express();
const server = http.createServer(app);

const clientOrigin = process.env.CLIENT_URL || 'http://localhost:4200';

const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

registerSocketHandlers(io);

app.set('io', io);

app.use(
  cors({
    origin: clientOrigin,
    credentials: true
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server due to database connection error.', error);
    process.exit(1);
  });
