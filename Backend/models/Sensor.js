const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['current', 'voltage', 'temperature', 'humidity', 'light', 'power'], 
    required: true 
  },
  location: { type: String, required: true },
  unit: { type: String, required: true },
  calibrationFactor: { type: Number, default: 1.0 },
  isActive: { type: Boolean, default: true },
  lastReading: { type: Date },
  lastValue: { type: Number }
});

module.exports = mongoose.model('Sensor', sensorSchema);