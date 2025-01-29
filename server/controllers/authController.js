const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const Profile = require('../models/Profile'); // Add this import

const authController = {
  async register(req, res) {
    const { email, password, name } = req.body;

    try {
      // Start a transaction
      await db.beginTransaction();

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

      const userId = result.insertId;

      // Create initial profile
      try {
        await Profile.create({
          user_id: userId,
          full_name: name, // Use the name from registration
          date_of_birth: new Date().toISOString().split('T')[0], // Placeholder date, user can update later
          gender: 'other', // Default value, user can update later
          is_parent: true // Since we're setting role as 'parent'
        });
      } catch (profileError) {
        await db.rollback();
        throw profileError;
      }

      // Commit the transaction
      await db.commit();

      // Generate token
      const token = jwt.sign(
        { id: userId, email, name, role: 'parent' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: userId.toString(),
          email,
          name,
          role: 'parent'
        }
      });
    } catch (error) {
      await db.rollback();
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  },

  async login(req, res) {
    const { email, password } = req.body;
  
    try {
      // Get user with profile information
      const [users] = await db.query(
        `SELECT u.id, u.email, u.password, u.name, u.role, p.id as profile_id 
         FROM users u 
         LEFT JOIN profiles p ON u.id = p.user_id 
         WHERE u.email = ?`,
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
        { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          profileId: user.profile_id 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
  
      res.json({
        token,
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          profileId: user.profile_id ? user.profile_id.toString() : null
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
        `SELECT u.id, u.email, u.name, u.role, p.id as profile_id 
         FROM users u 
         LEFT JOIN profiles p ON u.id = p.user_id 
         WHERE u.id = ?`,
        [req.user.id]
      );
  
      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const user = users[0];
      // Return existing token claims without generating new token
      res.json({
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          profileId: user.profile_id ? user.profile_id.toString() : null
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