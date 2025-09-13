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

// Import models
const User = require('./models/User');
const Device = require('./models/Device');
const SensorData = require('./models/SensorData');

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // for parsing application/json

// Routes
app.get('/', async (req, res) => {
  try {
    // Get user data
    const user = await User.findOne();
    
    // Get devices
    const devices = await Device.find().sort({ name: 1 });
    
    // Get latest sensor readings
    const currentData = await SensorData.findOne({ sensorType: 'current' }).sort({ timestamp: -1 });
    const tempData = await SensorData.findOne({ sensorType: 'temperature' }).sort({ timestamp: -1 });
    const humidityData = await SensorData.findOne({ sensorType: 'humidity' }).sort({ timestamp: -1 });
    const lightData = await SensorData.findOne({ sensorType: 'light' }).sort({ timestamp: -1 });
    const energyData = await SensorData.findOne({ sensorType: 'energy' }).sort({ timestamp: -1 });
    
    // Format data for the dashboard
    const data = {
      user: user,
      cards: {
        currentUsage: { 
          value: `${currentData ? currentData.value.toFixed(1) : 0} ${currentData ? currentData.unit : 'A'}`, 
          trend: "up", 
          trendValue: "12%" 
        },
        temperature: { 
          value: `${tempData ? tempData.value.toFixed(1) : 0}${tempData ? tempData.unit : '°C'}`, 
          humidity: `${humidityData ? humidityData.value.toFixed(0) : 0}${humidityData ? humidityData.unit : '%'}` 
        },
        lightLevel: { 
          value: `${lightData ? lightData.value.toFixed(0) : 0} ${lightData ? lightData.unit : 'lux'}`, 
          location: "Living Room", 
          status: "Optimal" 
        },
        energyToday: { 
          value: `${energyData ? energyData.value.toFixed(1) : 0} ${energyData ? energyData.unit : 'kWh'}`, 
          cost: "$1.25", 
          trend: "down", 
          trendValue: "5%" 
        }
      },
      devices: devices
    };

    res.render('dashboard', { data: data });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// API endpoints for real data
app.get('/api/energy-data', async (req, res) => {
  try {
    // Get energy data for the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const energyData = await SensorData.find({
      sensorType: 'energy',
      timestamp: { $gte: twentyFourHoursAgo }
    }).sort({ timestamp: 1 });

    // Format data for chart
    const labels = energyData.map(item => {
      const date = new Date(item.timestamp);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    
    const data = energyData.map(item => item.value);

    res.json({ labels, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/current-values', async (req, res) => {
  try {
    // Get latest readings for all sensors
    const currentData = await SensorData.findOne({ sensorType: 'current' }).sort({ timestamp: -1 });
    const tempData = await SensorData.findOne({ sensorType: 'temperature' }).sort({ timestamp: -1 });
    const lightData = await SensorData.findOne({ sensorType: 'light' }).sort({ timestamp: -1 });
    const energyData = await SensorData.findOne({ sensorType: 'energy' }).sort({ timestamp: -1 });

    const currentValues = {
      current: `${currentData ? currentData.value.toFixed(1) : 0} ${currentData ? currentData.unit : 'A'}`,
      temperature: `${tempData ? tempData.value.toFixed(1) : 0}${tempData ? tempData.unit : '°C'}`,
      light: `${lightData ? lightData.value.toFixed(0) : 0} ${lightData ? lightData.unit : 'lux'}`,
      energy: `${energyData ? energyData.value.toFixed(1) : 0} ${energyData ? energyData.unit : 'kWh'}`
    };
    
    res.json(currentValues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// API endpoint to receive sensor data
app.post('/api/sensor-data', async (req, res) => {
  try {
    const { sensorType, value, unit, location } = req.body;
    
    // Validate input
    if (!sensorType || value === undefined || !unit || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new sensor data record
    const sensorData = new SensorData({
      sensorType,
      value,
      unit,
      location,
      timestamp: new Date()
    });

    await sensorData.save();
    
    // Emit real-time update to all connected clients
    io.emit('sensor-update', {
      sensorType,
      value,
      unit,
      location,
      timestamp: sensorData.timestamp
    });

    res.status(201).json({ message: 'Sensor data saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// API endpoint to update device status
app.put('/api/device/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['ON', 'OFF'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const device = await Device.findByIdAndUpdate(
      id,
      { 
        status,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Emit real-time update to all connected clients
    io.emit('device-update', device);

    res.json(device);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Seed initial data (run once)
app.get('/seed', async (req, res) => {
  try {
    // Create sample user
    const user = new User({
      name: "Emily Johnson",
      role: "Home Administrator",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80"
    });
    await user.save();

    // Create sample devices
    const devices = [
      { 
        name: "Smart TV", 
        model: "Samsung QLED 55\"", 
        location: "Living Room", 
        power: "120 W", 
        status: "ON", 
        icon: "fas fa-tv" 
      },
      { 
        name: "LED Lights", 
        model: "Philips Hue", 
        location: "Kitchen", 
        power: "40 W", 
        status: "OFF", 
        icon: "fas fa-lightbulb" 
      },
      { 
        name: "Blender", 
        model: "Vitamix 5200", 
        location: "Kitchen", 
        power: "300 W", 
        status: "OFF", 
        icon: "fas fa-blender" 
      },
      { 
        name: "Laptop", 
        model: "MacBook Pro 16\"", 
        location: "Study Room", 
        power: "65 W", 
        status: "ON", 
        icon: "fas fa-laptop" 
      },
      { 
        name: "Refrigerator", 
        model: "Samsung Family Hub", 
        location: "Kitchen", 
        power: "150 W", 
        status: "ON", 
        icon: "fas fa-warehouse" 
      }
    ];

    for (const deviceData of devices) {
      const device = new Device(deviceData);
      await device.save();
    }

    // Create initial sensor data
    const sensorData = [
      { sensorType: 'current', value: 5.2, unit: 'A', location: 'Main Panel' },
      { sensorType: 'temperature', value: 23.5, unit: '°C', location: 'Living Room' },
      { sensorType: 'humidity', value: 45, unit: '%', location: 'Living Room' },
      { sensorType: 'light', value: 720, unit: 'lux', location: 'Living Room' },
      { sensorType: 'energy', value: 8.3, unit: 'kWh', location: 'Main Panel' }
    ];

    for (const data of sensorData) {
      const sensor = new SensorData(data);
      await sensor.save();
    }

    res.send('Database seeded successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error seeding database');
  }
});

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});