const AuthService = require('../services/authService');
const UserModel = require('../models/userModel');

class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      const result = await AuthService.register({ name, email, password, role });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req, res, next) {
    try {
      const users = await UserModel.listAll();
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
