const { db } = require('../config/firestore');

class LogModel {
  static async createLog(action, userId, taskId = null, projectId = null) {
    try {
      if (!db) {
        return null;
      }
      const logData = {
        action,
        userId: userId ? parseInt(userId, 10) : null,
        taskId: taskId ? parseInt(taskId, 10) : null,
        projectId: projectId ? parseInt(projectId, 10) : null,
        timestamp: new Date()
      };
      
      const docRef = await db.collection('logs').add(logData);
      return docRef.id;
    } catch (error) {
      console.error(`[Audit Log Failed] Action: ${action}, Error: ${error.message}`);
      // Decoupled logging: we catch the error to prevent database failures in caller transactions.
      return null;
    }
  }
}

module.exports = LogModel;
