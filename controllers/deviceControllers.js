const { Device } = require('../models');

exports.getAllDevices = async (req, res) => {
	try {
		const devices = await Device.findAll();
		res.json({ success: true, devices });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.addDevice = async (req, res) => {
	const { name, model, location, power, status, icon } = req.body;
	try {
		const device = await Device.create({ name, model, location, power, status, icon });
		res.status(201).json({ success: true, device });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.updateDevice = async (req, res) => {
	const { id } = req.params;
	const updates = req.body;
	try {
		const device = await Device.findByPk(id);
		if (!device) return res.status(404).json({ error: 'Device not found' });
		await device.update(updates);
		res.json({ success: true, device });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.deleteDevice = async (req, res) => {
	const { id } = req.params;
	try {
		const device = await Device.findByPk(id);
		if (!device) return res.status(404).json({ error: 'Device not found' });
		await device.destroy();
		res.json({ success: true, message: 'Device deleted' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
