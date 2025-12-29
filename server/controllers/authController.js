const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const Profile = require('../models/Profile'); // Add this import

const authController = {
  async register(req, res) {
    const { email, password, name } = req.body;

    try {
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Check if user already exists
        const [existingUsers] = await connection.query(
          'SELECT id FROM users WHERE email = ?', 
          [email]
        );
        
        if (existingUsers.length > 0) {
          connection.release();
          return res.status(400).json({ 
            status: 'error',
            message: 'Email already registered' 
          });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user with default status 'active'
        const [userResult] = await connection.query(
          'INSERT INTO users (email, password, name, role, status) VALUES (?, ?, ?, ?, ?)',
          [email, hashedPassword, name, 'parent', 'active']
        );

        const userId = userResult.insertId;

        // Create initial profile
        const [profileResult] = await connection.query(
          `INSERT INTO profiles (
            user_id, 
            full_name, 
            date_of_birth, 
            gender, 
            is_parent,
            profile_type,
            profile_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            name,
            new Date().toISOString().split('T')[0],
            'other',
            true,
            'primary',
            'active'
          ]
        );

        // Update user with profile_id
        await connection.query(
          'UPDATE users SET profile_id = ? WHERE id = ?',
          [profileResult.insertId, userId]
        );

        await connection.commit();
        
        // Generate token
        const token = jwt.sign(
          { 
            id: userId, 
            email, 
            name, 
            role: 'parent',
            profileId: profileResult.insertId
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        connection.release();

        res.status(201).json({
          status: 'success',
          token,
          user: {
            id: userId.toString(),
            email,
            name,
            role: 'parent',
            profileId: profileResult.insertId.toString()
          }
        });

      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Error registering user',
        error: error.message 
      });
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
      
      // Generate new token for refresh
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
        token, // Add this
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