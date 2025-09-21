const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  sensorType: { 
    type: String, 
    enum: ['current', 'temperature', 'humidity', 'light', 'energy'], 
    required: true 
  },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  location: { type: String, required: true }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);