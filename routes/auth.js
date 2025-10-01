const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import middleware
const auth = require('../middleware/auth');
const { validateUserLogin, validateUserRegister } = require('../middleware/validation');

// Remove rate limiting for now to get server running
// const rateLimit = require('express-rate-limit');
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 requests per windowMs
//   message: {
//     error: 'Too many authentication attempts, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Apply rate limiting to auth routes
// router.use(authLimiter);

// GET /auth/login - Render login page
router.get('/login', (req, res) => {
  res.render('auth/login', {
    title: 'Login - Smart Home',
    error: null,
    success: null
  });
});

// POST /auth/login - Handle login
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { User } = models;
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).render('auth/login', {
        title: 'Login - Smart Home',
        error: 'Invalid email or password',
        success: null,
        email
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).render('auth/login', {
        title: 'Login - Smart Home',
        error: 'Invalid email or password',
        success: null,
        email
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback_secret_change_in_production',
      { expiresIn: '24h' }
    );

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    });

    // Also set in response for immediate use (optional)
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('auth/login', {
      title: 'Login - Smart Home',
      error: 'An unexpected error occurred',
      success: null,
      email: req.body.email
    });
  }
});

// GET /auth/register - Render registration page
router.get('/register', (req, res) => {
  res.render('auth/register', {
    title: 'Register - Smart Home',
    error: null,
    success: null
  });
});

// POST /auth/register - Handle registration (SINGLE VERSION - removed duplicate)
router.post('/register', validateUserRegister, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { User } = models;
    const { name, email, password, confirmPassword, terms, newsletter, role = 'user' } = req.body;

    // Validate password confirmation
    if (password !== confirmPassword) {
      return res.status(400).render('auth/register', {
        title: 'Register - Smart Home',
        error: 'Passwords do not match',
        name,
        email
      });
    }

    // Validate terms acceptance
    if (!terms) {
      return res.status(400).render('auth/register', {
        title: 'Register - Smart Home',
        error: 'You must accept the terms and conditions',
        name,
        email
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).render('auth/register', {
        title: 'Register - Smart Home',
        error: 'User with this email already exists',
        name,
        email
      });
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return res.status(400).render('auth/register', {
        title: 'Register - Smart Home',
        error: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
        name,
        email
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      newsletter: newsletter || false
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback_secret_change_in_production',
      { expiresIn: '24h' }
    );

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).render('auth/register', {
      title: 'Register - Smart Home',
      error: 'Failed to create account',
      name: req.body.name,
      email: req.body.email
    });
  }
});

// GET /auth/logout - Handle logout
router.get('/logout', auth, (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // For API clients, return success response
    if (req.accepts('json')) {
      return res.json({
        success: true,
        message: 'Logout successful'
      });
    }

    // For web clients, redirect to login
    res.redirect('/auth/login');

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// GET /auth/me - Get current user info
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        image: req.user.image
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user information'
    });
  }
});

// POST /auth/change-password - Change user password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, req.user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await req.user.update({ password: hashedNewPassword });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// GET /auth/verify - Verify token validity
router.get('/verify', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Helper function for password strength
function isStrongPassword(password) {
  return password.length >= 8 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password);
}

module.exports = router;