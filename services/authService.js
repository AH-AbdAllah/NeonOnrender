const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const LogService = require('./logService');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeychangeinproduction';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
  static async register({ name, email, password, role }) {
    // 1. Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      const error = new Error('Email is already registered.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Save to database
    const userId = await UserModel.createUser(name, email, passwordHash, role || 'User');

    // 4. Log registration event
    LogService.logEvent('USER_REGISTERED', userId);

    return {
      userId,
      name,
      email,
      role: role || 'User'
    };
  }

  static async login({ email, password }) {
    // 1. Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // 3. Generate JWT Token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 4. Log login event in Firestore
    LogService.logEvent('USER_LOGIN', user.id);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }
}

module.exports = AuthService;
