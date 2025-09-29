const Joi = require('joi');

// Custom validation for MySQL integer ID
const mysqlId = (value, helpers) => {
  if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
    return helpers.error('any.invalid');
  }
  return Number(value);
};

// Custom validation for sensor values based on type
const sensorValueValidation = (value, helpers) => {
  const { sensorType } = helpers.state.ancestors[0];
  
  switch(sensorType) {
    case 'current':
      if (value < 0 || value > 100) {
        return helpers.error('any.invalid');
      }
      break;
    case 'temperature':
      if (value < -40 || value > 100) {
        return helpers.error('any.invalid');
      }
      break;
    case 'humidity':
      if (value < 0 || value > 100) {
        return helpers.error('any.invalid');
      }
      break;
    case 'light':
      if (value < 0 || value > 10000) {
        return helpers.error('any.invalid');
      }
      break;
    case 'energy':
      if (value < 0 || value > 1000) {
        return helpers.error('any.invalid');
      }
      break;
  }
  
  return value;
};

// Validation schemas
const schemas = {
  // Sensor data validation
  sensorData: Joi.object({
    sensorType: Joi.string()
      .valid('current', 'temperature', 'humidity', 'light', 'energy')
      .required()
      .messages({
        'any.only': 'Sensor type must be one of: current, temperature, humidity, light, energy',
        'any.required': 'Sensor type is required'
      }),
    value: Joi.number()
      .custom(sensorValueValidation, 'Sensor value validation')
      .required()
      .messages({
        'number.base': 'Value must be a number',
        'any.invalid': 'Value is outside acceptable range for this sensor type',
        'any.required': 'Value is required'
      }),
    unit: Joi.string()
      .required()
      .messages({
        'string.base': 'Unit must be a string',
        'any.required': 'Unit is required'
      }),
    location: Joi.string()
      .max(100)
      .required()
      .messages({
        'string.base': 'Location must be a string',
        'string.max': 'Location must be less than 100 characters',
        'any.required': 'Location is required'
      }),
    timestamp: Joi.date()
      .max('now')
      .default(Date.now)
      .messages({
        'date.base': 'Timestamp must be a valid date',
        'date.max': 'Timestamp cannot be in the future'
      })
  }),

  // Device status validation
  deviceStatus: Joi.object({
    status: Joi.string()
      .valid('ON', 'OFF')
      .required()
      .messages({
        'any.only': 'Status must be either ON or OFF',
        'any.required': 'Status is required'
      })
  }),

  // Device creation validation
  deviceCreate: Joi.object({
    name: Joi.string()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.base': 'Name must be a string',
        'string.min': 'Name must be at least 1 character',
        'string.max': 'Name must be less than 50 characters',
        'any.required': 'Name is required'
      }),
    model: Joi.string()
      .max(100)
      .required()
      .messages({
        'string.base': 'Model must be a string',
        'string.max': 'Model must be less than 100 characters',
        'any.required': 'Model is required'
      }),
    location: Joi.string()
      .max(100)
      .required()
      .messages({
        'string.base': 'Location must be a string',
        'string.max': 'Location must be less than 100 characters',
        'any.required': 'Location is required'
      }),
    power: Joi.string()
      .pattern(/^[0-9]+(\.[0-9]+)?\s*[Ww]$/)
      .required()
      .messages({
        'string.base': 'Power must be a string',
        'string.pattern.base': 'Power must be in format like "120 W"',
        'any.required': 'Power is required'
      }),
    status: Joi.string()
      .valid('ON', 'OFF')
      .default('OFF')
      .messages({
        'any.only': 'Status must be either ON or OFF'
      }),
    icon: Joi.string()
      .pattern(/^fas fa-[a-z-]+$/)
      .required()
      .messages({
        'string.base': 'Icon must be a string',
        'string.pattern.base': 'Icon must be a valid FontAwesome icon class',
        'any.required': 'Icon is required'
      })
  }),

  // Device ID validation
  deviceId: Joi.object({
    id: Joi.string()
      .custom(objectId, 'ObjectId validation')
      .required()
      .messages({
        'any.invalid': 'Invalid device ID format',
        'any.required': 'Device ID is required'
      })
  }),

  // User registration validation
  userRegister: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.base': 'Name must be a string',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name must be less than 50 characters',
        'any.required': 'Name is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.base': 'Email must be a string',
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.base': 'Password must be a string',
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
      }),
    role: Joi.string()
      .valid('admin', 'user')
      .default('user')
      .messages({
        'any.only': 'Role must be either admin or user'
      })
  }),

  // User login validation
  userLogin: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.base': 'Email must be a string',
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.base': 'Password must be a string',
        'any.required': 'Password is required'
      })
  }),

  // Energy data query validation
  energyQuery: Joi.object({
    hours: Joi.number()
      .integer()
      .min(1)
      .max(720) // 30 days
      .default(24)
      .messages({
        'number.base': 'Hours must be a number',
        'number.integer': 'Hours must be an integer',
        'number.min': 'Hours must be at least 1',
        'number.max': 'Hours cannot exceed 720 (30 days)'
      }),
    sensorId: Joi.string()
      .custom(objectId, 'ObjectId validation')
      .messages({
        'any.invalid': 'Invalid sensor ID format'
      })
  })
};

// Validation middleware generator
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all validation errors, not just the first one
      allowUnknown: true, // Allow unknown fields (will be stripped)
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace the request data with the validated and sanitized data
    req[property] = value;
    next();
  };
};

// Specific validation middleware functions
module.exports = {
  // Sensor data validation
  validateSensorData: validate(schemas.sensorData),

  // Device status validation
  validateDeviceStatus: validate(schemas.deviceStatus),

  // Device creation validation
  validateDeviceCreate: validate(schemas.deviceCreate),

  // Device ID validation (for URL parameters)
  validateDeviceId: validate(schemas.deviceId, 'params'),

  // User registration validation
  validateUserRegister: validate(schemas.userRegister),

  // User login validation
  validateUserLogin: validate(schemas.userLogin),

  // Energy query validation (for query parameters)
  validateEnergyQuery: validate(schemas.energyQuery, 'query'),

  // Generic validation function for other use cases
  validateGeneric: (schema) => validate(schema),
  
  // Export schemas for use in other parts of the application
  schemas
};