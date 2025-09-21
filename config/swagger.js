const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Home Energy Monitoring System API',
    version: '1.0.0',
    description: 'A comprehensive REST API for monitoring and managing home energy consumption with real-time sensor data',
    contact: {
      name: 'API Support',
      email: 'support@smarthome.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.SWAGGER_SERVER_URL || 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    },
    schemas: {
      SensorData: {
        type: 'object',
        properties: {
          sensorType: {
            type: 'string',
            enum: ['current', 'temperature', 'humidity', 'light', 'energy'],
            description: 'Type of sensor'
          },
          value: {
            type: 'number',
            description: 'Sensor reading value'
          },
          unit: {
            type: 'string',
            description: 'Unit of measurement'
          },
          location: {
            type: 'string',
            description: 'Location of the sensor'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Time when the reading was taken'
          }
        },
        required: ['sensorType', 'value', 'unit', 'location']
      },
      Device: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Device name'
          },
          model: {
            type: 'string',
            description: 'Device model'
          },
          location: {
            type: 'string',
            description: 'Device location'
          },
          power: {
            type: 'string',
            description: 'Power consumption'
          },
          status: {
            type: 'string',
            enum: ['ON', 'OFF'],
            description: 'Device status'
          },
          icon: {
            type: 'string',
            description: 'FontAwesome icon class'
          }
        },
        required: ['name', 'model', 'location', 'power', 'status', 'icon']
      },
      User: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'User full name'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          role: {
            type: 'string',
            enum: ['admin', 'user'],
            description: 'User role'
          },
          image: {
            type: 'string',
            description: 'URL to user profile image'
          }
        },
        required: ['name', 'email', 'role']
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  description: 'Field that caused the error'
                },
                message: {
                  type: 'string',
                  description: 'Error message for the field'
                }
              }
            }
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Unauthorized',
              message: 'No authorization token was found'
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Validation failed',
              details: [
                {
                  field: 'sensorType',
                  message: 'Sensor type is required'
                }
              ]
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Not found',
              message: 'Device with id 123 not found'
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Sensors',
      description: 'Endpoints for sensor data management'
    },
    {
      name: 'Devices',
      description: 'Endpoints for device management'
    },
    {
      name: 'Energy',
      description: 'Endpoints for energy data and analytics'
    },
    {
      name: 'Authentication',
      description: 'Endpoints for user authentication'
    }
  ]
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../models/*.js'),
    path.join(__dirname, '../controllers/*.js')
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

// Swagger UI options
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Smart Home Energy API Documentation',
  customfavIcon: '/favicon.ico',
  explorer: true
};

module.exports = {
  swaggerUi,
  swaggerSpec,
  swaggerUiOptions
};