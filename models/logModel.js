const { db } = require('../config/firestore');

class LogModel {
  static async createLog(action, userId, taskId = null, projectId = null) {
    try {
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

  static async getLogs(limit = 50) {
    try {
      // In case we want to view logs in tests or Swagger
      const snapshot = await db.collection('logs')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      const logs = [];
      snapshot.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      return logs;
    } catch (error) {
      console.error('Failed to retrieve audit logs from Firestore:', error.message);
      return [];
    }
  }
}

module.exports = LogModel;
