const TaskModel = require('../models/taskModel');
const UserModel = require('../models/userModel');

class ReportService {
  static async getUserStatistics(targetUserId, userContext) {
    // Authorization check: standard users can only fetch their own reports
    if (userContext.role !== 'Admin' && parseInt(targetUserId, 10) !== userContext.id) {
      const error = new Error('Access denied. You can only view your own statistics.');
      error.statusCode = 403;
      throw error;
    }

    // Verify user exists
    const user = await UserModel.findById(targetUserId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const stats = await TaskModel.getUserTaskStatistics(targetUserId);
    
    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      statistics: stats
    };
  }

  static async getAllUsersStatistics(userContext) {
    // Only Admin can access summary report of all users
    if (userContext.role !== 'Admin') {
      const error = new Error('Access denied. Only Admins can view general aggregated reports.');
      error.statusCode = 403;
      throw error;
    }

    return await TaskModel.getAllUsersStatistics();
  }
}

module.exports = ReportService;
