// swagger/swaggerDef.js
module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Home Energy Monitoring API',
    version: '1.0.0',
    description: 'Comprehensive REST API for managing smart home devices, sensors, and energy monitoring',
    contact: {
      name: 'API Support',
      email: 'support@smarthome.com',
      url: 'https://smarthome.com/docs'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    termsOfService: 'https://smarthome.com/terms'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server'
    },
    {
      url: 'https://api.smarthome.com/v1',
      description: 'Production Server'
    },
    {
      url: 'https://staging-api.smarthome.com/v1',
      description: 'Staging Server'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Users',
      description: 'User management operations'
    },
    {
      name: 'Devices',
      description: 'Smart device management and control'
    },
    {
      name: 'Sensors',
      description: 'Sensor configuration and data management'
    },
    {
      name: 'Energy',
      description: 'Energy consumption monitoring and analytics'
    },
    {
      name: 'Dashboard',
      description: 'Dashboard data aggregation endpoints'
    },
    {
      name: 'System',
      description: 'System health and administration'
    }
  ],
  paths: {}, // Will be populated by swaggerSpec
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from authentication endpoints'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for sensor data submission'
      }
    },
    schemas: {
      // Common response schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully'
          },
          data: {
            type: 'object',
            description: 'Response data payload'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            example: 'Error description'
          },
          message: {
            type: 'string',
            example: 'Detailed error message'
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            example: 1
          },
          limit: {
            type: 'integer',
            example: 10
          },
          total: {
            type: 'integer',
            example: 100
          },
          pages: {
            type: 'integer',
            example: 10
          }
        }
      },
      
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1
          },
          name: {
            type: 'string',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john@example.com'
          },
          role: {
            type: 'string',
            enum: ['admin', 'user'],
            example: 'user'
          },
          image: {
            type: 'string',
            nullable: true,
            example: 'https://example.com/avatar.jpg'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z'
          }
        }
      },
      UserLogin: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'password123',
            minLength: 6
          }
        }
      },
      UserRegister: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: {
            type: 'string',
            example: 'John Doe',
            minLength: 2,
            maxLength: 100
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john@example.com'
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'securePassword123',
            minLength: 6
          },
          role: {
            type: 'string',
            enum: ['admin', 'user'],
            default: 'user',
            example: 'user'
          }
        }
      },
      
      // Device schemas
      Device: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1
          },
          name: {
            type: 'string',
            example: 'Living Room Light'
          },
          model: {
            type: 'string',
            example: 'Smart Bulb V2'
          },
          location: {
            type: 'string',
            example: 'Living Room'
          },
          power: {
            type: 'string',
            example: '9 W'
          },
          status: {
            type: 'string',
            enum: ['ON', 'OFF'],
            example: 'OFF'
          },
          icon: {
            type: 'string',
            example: 'fas fa-lightbulb'
          },
          userId: {
            type: 'integer',
            example: 1
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      DeviceCreate: {
        type: 'object',
        required: ['name', 'model', 'location', 'power', 'icon'],
        properties: {
          name: {
            type: 'string',
            example: 'Living Room Light'
          },
          model: {
            type: 'string',
            example: 'Smart Bulb V2'
          },
          location: {
            type: 'string',
            example: 'Living Room'
          },
          power: {
            type: 'string',
            example: '9 W'
          },
          status: {
            type: 'string',
            enum: ['ON', 'OFF'],
            default: 'OFF',
            example: 'OFF'
          },
          icon: {
            type: 'string',
            example: 'fas fa-lightbulb'
          }
        }
      },
      
      // Sensor schemas
      Sensor: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1
          },
          name: {
            type: 'string',
            example: 'Temperature Sensor'
          },
          type: {
            type: 'string',
            enum: ['current', 'temperature', 'humidity', 'light', 'energy'],
            example: 'temperature'
          },
          location: {
            type: 'string',
            example: 'Living Room'
          },
          unit: {
            type: 'string',
            example: '°C'
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
            example: 'ACTIVE'
          },
          calibrationFactor: {
            type: 'number',
            format: 'float',
            example: 1.0
          },
          deviceId: {
            type: 'integer',
            nullable: true,
            example: 1
          },
          userId: {
            type: 'integer',
            example: 1
          },
          lastReading: {
            type: 'string',
            format: 'date-time',
            nullable: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      
      // Sensor Data schemas
      SensorData: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1
          },
          sensorId: {
            type: 'integer',
            example: 1
          },
          type: {
            type: 'string',
            enum: ['current', 'temperature', 'humidity', 'light', 'energy'],
            example: 'temperature'
          },
          value: {
            type: 'number',
            format: 'float',
            example: 22.5
          },
          unit: {
            type: 'string',
            example: '°C'
          },
          location: {
            type: 'string',
            example: 'Living Room'
          },
          timestamp: {
            type: 'integer',
            format: 'int64',
            example: 1704067200000
          },
          quality: {
            type: 'string',
            enum: ['GOOD', 'QUESTIONABLE', 'BAD'],
            example: 'GOOD'
          },
          source: {
            type: 'string',
            example: 'esp32'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      SensorDataCreate: {
        type: 'object',
        required: ['sensorType', 'value', 'unit'],
        properties: {
          sensorType: {
            type: 'string',
            enum: ['current', 'temperature', 'humidity', 'light', 'energy'],
            example: 'temperature'
          },
          value: {
            type: 'number',
            format: 'float',
            example: 22.5
          },
          unit: {
            type: 'string',
            example: '°C'
          },
          location: {
            type: 'string',
            example: 'Living Room'
          },
          sensorId: {
            type: 'integer',
            example: 1
          },
          timestamp: {
            type: 'integer',
            format: 'int64',
            example: 1704067200000
          }
        }
      },
      SensorDataBulk: {
        type: 'object',
        required: ['readings'],
        properties: {
          readings: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/SensorDataCreate'
            }
          }
        }
      },
      
      // Energy Usage schemas
      EnergyUsage: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1
          },
          deviceId: {
            type: 'integer',
            example: 1
          },
          userId: {
            type: 'integer',
            example: 1
          },
          energyKwh: {
            type: 'number',
            format: 'float',
            example: 2.5
          },
          cost: {
            type: 'number',
            format: 'float',
            example: 0.75
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          },
          durationMinutes: {
            type: 'integer',
            example: 60
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      }
    },
    responses: {
      // Common responses
      Unauthorized: {
        description: 'Unauthorized - Invalid or missing authentication token',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: 'Unauthorized',
              message: 'Access token is missing or invalid'
            }
          }
        }
      },
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: 'Forbidden',
              message: 'Insufficient permissions to access this resource'
            }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: 'Not Found',
              message: 'The requested resource was not found'
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error - Invalid input data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: 'Validation Failed',
              message: 'One or more fields are invalid',
              details: [
                {
                  field: 'email',
                  message: 'Email must be a valid email address'
                }
              ]
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: 'Internal Server Error',
              message: 'An unexpected error occurred'
            }
          }
        }
      }
    },
    parameters: {
      // Common parameters
      DeviceId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'integer'
        },
        description: 'Device ID'
      },
      SensorId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'integer'
        },
        description: 'Sensor ID'
      },
      UserId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'integer'
        },
        description: 'User ID'
      },
      Limit: {
        name: 'limit',
        in: 'query',
        required: false,
        schema: {
          type: 'integer',
          default: 10,
          maximum: 100
        },
        description: 'Number of items to return'
      },
      Page: {
        name: 'page',
        in: 'query',
        required: false,
        schema: {
          type: 'integer',
          default: 1,
          minimum: 1
        },
        description: 'Page number for pagination'
      },
      Hours: {
        name: 'hours',
        in: 'query',
        required: false,
        schema: {
          type: 'integer',
          default: 24,
          minimum: 1,
          maximum: 720
        },
        description: 'Time range in hours for data retrieval'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  externalDocs: {
    description: 'Find more info and tutorials',
    url: 'https://smarthome.com/docs/api'
  }
};