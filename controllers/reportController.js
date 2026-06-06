const ReportService = require('../services/reportService');

class ReportController {
  static async getUserStatistics(req, res, next) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) {
        const error = new Error('Invalid user ID.');
        error.statusCode = 400;
        throw error;
      }

      const stats = await ReportService.getUserStatistics(userId, req.user);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsersStatistics(req, res, next) {
    try {
      const stats = await ReportService.getAllUsersStatistics(req.user);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReportController;
