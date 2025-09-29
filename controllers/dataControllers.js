const { SensorData, Sensor } = require('../models');

exports.getAllSensorData = async (req, res) => {
	try {
		const data = await SensorData.findAll({ include: [{ model: Sensor, as: 'sensor' }] });
		res.json({ success: true, data });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.addSensorData = async (req, res) => {
	const { sensorId, value, unit, location } = req.body;
	try {
		const newData = await SensorData.create({ sensorId, value, unit, location });
		res.status(201).json({ success: true, data: newData });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
