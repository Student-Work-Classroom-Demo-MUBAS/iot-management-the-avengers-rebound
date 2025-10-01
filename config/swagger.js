const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express'); // Add this import
const swaggerDefinition = require('../swagger/swaggerDef');

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    './routes/*.js',
    './models/*.js',
    './swagger/docs/*.yaml'
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerSpec,
  swaggerUi, // Export swaggerUi as well
  options
};