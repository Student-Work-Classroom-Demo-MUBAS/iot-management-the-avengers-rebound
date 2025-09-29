const { User } = require('../models');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
	const { email, password } = req.body;
	try {
		const user = await User.findOne({ where: { email } });
		if (!user) return res.status(401).json({ error: 'Invalid credentials' });
		const match = await bcrypt.compare(password, user.password);
		if (!match) return res.status(401).json({ error: 'Invalid credentials' });
		// You would generate a JWT or session here
		res.json({ message: 'Login successful', user });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.register = async (req, res) => {
	const { name, email, password, role } = req.body;
	try {
		const hash = await bcrypt.hash(password, 10);
		const user = await User.create({ name, email, password: hash, role });
		res.status(201).json({ message: 'User registered', user });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
