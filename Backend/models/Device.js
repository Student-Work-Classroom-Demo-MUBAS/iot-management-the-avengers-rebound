const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  model: { type: String, required: true },
  location: { type: String, required: true },
  power: { type: String, required: true },
  status: { type: String, enum: ['ON', 'OFF'], required: true },
  icon: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', deviceSchema);