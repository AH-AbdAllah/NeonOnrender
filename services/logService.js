const LogModel = require('../models/logModel');

class LogService {
  /**
   * Log an event asynchronously without blocking primary execution flow.
   */
  static logEvent(action, userId, taskId = null, projectId = null) {
    // Run in background to decouple database logging latency from primary response.
    LogModel.createLog(action, userId, taskId, projectId)
      .then((docId) => {
        if (docId) {
          console.log(`[Firestore Event Logged] Action: ${action}, Document ID: ${docId}`);
        }
      })
      .catch((error) => {
        console.error(`[Firestore Log Service Error] Action: ${action}, Message: ${error.message}`);
      });
  }

  static async fetchLogs(limit) {
    return await LogModel.getLogs(limit);
  }
}

module.exports = LogService;
