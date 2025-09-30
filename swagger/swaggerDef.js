module.exports = {
	openapi: '3.0.0',
	info: {
		title: 'IoT Management API',
		version: '1.0.0',
		description: 'API documentation for the IoT Management Dashboard',
	},
	servers: [
		{
			url: 'http://localhost:3000',
			description: 'Local server',
		},
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
			},
		},
	},
	security: [{ bearerAuth: [] }],
};
