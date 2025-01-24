const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authController = {
  async register(req, res) {
    const { email, password, name } = req.body;

    try {
      // Check if user already exists
      const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const [result] = await db.query(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, name, 'parent']
      );

      // Generate token
      const token = jwt.sign(
        { id: result.insertId, email, name, role: 'parent' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: result.insertId.toString(),
          email,
          name,
          role: 'parent'
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  },

  async login(req, res) {
    const { email, password } = req.body;

    try {
      // Get user
      const [users] = await db.query(
        'SELECT id, email, password, name, role FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = users[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error logging in' });
    }
  },

  async validate(req, res) {
    try {
      const [users] = await db.query(
        'SELECT id, email, name, role FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = users[0];
      res.json({
        token: req.headers.authorization.split(' ')[1],
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({ message: 'Error validating token' });
    }
  },

  async logout(req, res) {
    // Since we're using JWT, we don't need to do anything server-side
    // The client will remove the token
    res.json({ message: 'Logged out successfully' });
  }
};

module.exports = authController;