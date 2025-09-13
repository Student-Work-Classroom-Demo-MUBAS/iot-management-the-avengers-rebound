const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smarthome', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// Import routes
const indexRoutes = require('./routes/index');
const apiRoutes = require('./routes/api');
const deviceRoutes = require('./routes/devices');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/', indexRoutes);
app.use('/api', apiRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/auth', authRoutes);

// Seed route (optional - can be removed after initial setup)
app.get('/seed', async (req, res) => {
  // Your seed function here
});

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});