const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/database');
const Profile = require('../models/Profile');

const authController = {
  async register(req, res) {
    const { email, password, name } = req.body;

    try {
      // Check if user already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email);
        
      if (checkError) {
        return res.status(500).json({ 
          status: 'error',
          message: 'Database error during user check',
          error: checkError.message
        });
      }
      
      if (existingUsers && existingUsers.length > 0) {
        return res.status(400).json({ 
          status: 'error',
          message: 'Email already registered' 
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email,
          password: hashedPassword,
          name,
          role: 'parent',
          status: 'active'
        })
        .select()
        .single();

      if (userError) {
        return res.status(500).json({ 
          status: 'error',
          message: 'Failed to create user',
          error: userError.message
        });
      }

      // Check if user has a profile (new users won't have one)
      let profileId = null;
      try {
        const profile = await Profile.findByUserId(userData.id);
        profileId = profile?.id || null;
      } catch (error) {
        profileId = null;
      }

      // Generate token
      const token = jwt.sign(
        { userId: userData.id, email: userData.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: userData.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
      );

      // Return user data without password but with profileId
      const { password: _, ...userWithoutPassword } = userData;
      const userWithProfile = {
        ...userWithoutPassword,
        profileId: profileId
      };

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: userWithProfile,
          token,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  async login(req, res) {
    const { email, password } = req.body;

    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        return res.status(401).json({ 
          status: 'error',
          message: 'Invalid credentials' 
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, userData.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          status: 'error',
          message: 'Invalid credentials' 
        });
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      // Check if user has a profile
      let profileId = null;
      try {
        const profile = await Profile.findByUserId(userData.id);
        profileId = profile?.id || null;
      } catch (error) {
        profileId = null;
      }

      // Generate tokens
      const token = jwt.sign(
        { userId: userData.id, email: userData.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: userData.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
      );

      // Return user data without password but with profileId
      const { password: _, ...userWithoutPassword } = userData;
      const userWithProfile = {
        ...userWithoutPassword,
        profileId: profileId
      };

      res.json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: userWithProfile,
          token,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  async refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Refresh token required' 
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      // Find user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', decoded.userId)
        .single();

      if (userError || !userData) {
        return res.status(401).json({ 
          status: 'error',
          message: 'Invalid refresh token' 
        });
      }

      // Generate new access token
      const newToken = jwt.sign(
        { userId: userData.id, email: userData.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
      );

      res.json({
        status: 'success',
        data: {
          token: newToken,
          user: userData
        }
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({ 
        status: 'error',
        message: 'Invalid or expired refresh token' 
      });
    }
  },

  async logout(req, res) {
    // For JWT, we typically just return success
    // In a production app, you might maintain a blacklist of tokens
    res.json({
      status: 'success',
      message: 'Logout successful'
    });
  },

  async validate(req, res) {
    try {
      // The auth middleware already validates the token and adds user to req
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, name, role, status')
        .eq('id', req.user.userId)
        .single();

      if (error || !userData) {
        return res.status(401).json({ 
          status: 'error',
          message: 'Invalid token' 
        });
      }

      // Check if user has a profile - use the Profile model method
      let profileId = null;
      try {
        const profile = await Profile.findByUserId(req.user.userId);
        profileId = profile?.id || null;
      } catch (error) {
        profileId = null;
      }

      // Add profileId to user data if profile exists
      const userWithProfile = {
        ...userData,
        profileId: profileId
      };

      res.json({
        status: 'success',
        data: {
          user: userWithProfile
        }
      });

    } catch (error) {
      console.error('Token validation error:', error);
      res.status(401).json({ 
        status: 'error',
        message: 'Invalid token' 
      });
    }
  },

  async googleCallback(req, res) {
    const { id, email, name, provider } = req.body;

    try {
      // Check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      let userData;

      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ 
            last_login: new Date().toISOString(),
            name: name 
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }
        userData = updatedUser;
      } else {
        // Create new user (let Supabase generate UUID, don't use Google ID)
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email,
            name,
            role: 'parent',
            status: 'active',
            email_verified: true // Google users are verified
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }
        userData = newUser;
      }

      // Check if user has a profile - use the Profile model method
      let profileId = null;
      
      try {
        const profile = await Profile.findByUserId(userData.id);
        profileId = profile?.id || null;
      } catch (error) {
        profileId = null;
      }
      
      // Add profileId to user data if profile exists
      const userWithProfile = {
        ...userData,
        profileId: profileId
      };

      // Generate token for our API
      const token = jwt.sign(
        { userId: userData.id, email: userData.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
      );

      res.json({
        status: 'success',
        message: 'Google authentication successful',
        data: {
          user: userWithProfile,
          token,
          isNewUser: !existingUser
        }
      });

    } catch (error) {
      console.error('Google callback error:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to process Google authentication',
        error: error.message
      });
    }
  }
};

module.exports = authController;