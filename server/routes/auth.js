const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const db = require('../config/database'); 
// Validation middleware
const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/validate', auth, authController.validate);
router.post('/logout', auth, authController.logout);

// Only for development
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, email, name, role, created_at FROM users');
    // Remove password from results for security
    res.json({ 
      status: 'success', 
      data: users.map(user => ({
        ...user,
        password: undefined
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error fetching users' 
    });
  }
});
module.exports = router;