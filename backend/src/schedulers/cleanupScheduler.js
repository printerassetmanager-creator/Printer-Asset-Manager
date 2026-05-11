const cron = require('node-cron');

class CleanupSchedulerService {
  constructor(cleanupQueueService) {
    this.cleanupQueueService = cleanupQueueService;
    this.scheduledJobs = new Map();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;

    this.isRunning = true;

    // Schedule automatic cleanup every 8 hours
    this.scheduleAutomaticCleanup();

    // Schedule queue maintenance
    this.scheduleQueueMaintenance();

    console.log('Cleanup scheduler service started');
  }

  async stop() {
    this.isRunning = false;

    // Stop all scheduled jobs
    for (const [name, job] of this.scheduledJobs) {
      job.stop();
    }
    this.scheduledJobs.clear();

    console.log('Cleanup scheduler service stopped');
  }

  scheduleAutomaticCleanup() {
    // Run every 8 hours at minute 0
    const job = cron.schedule('0 */8 * * *', async () => {
      try {
        console.log('Running scheduled automatic server cleanup');

        // Get all active servers from database
        const activeServers = await this.getActiveServers();

        if (activeServers.length === 0) {
          console.log('No active servers found for scheduled cleanup');
          return;
        }

        // Add cleanup jobs for all active servers
        const jobs = await this.cleanupQueueService.addBulkCleanupJobs(activeServers, {
          triggeredBy: 'scheduler',
          priority: 'normal'
        });

        console.log(`Scheduled cleanup for ${jobs.length} servers`);

      } catch (error) {
        console.error('Error in scheduled cleanup:', error);
      }
    }, {
      scheduled: false // Don't start immediately
    });

    this.scheduledJobs.set('automatic-cleanup', job);
    job.start();
  }

  scheduleQueueMaintenance() {
    // Run daily at 2 AM for queue cleanup
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        console.log('Running scheduled queue maintenance');

        // Clean old completed/failed jobs
        await this.cleanupQueueService.cleanOldJobs();

        // Log queue statistics
        const stats = await this.cleanupQueueService.getQueueStats();
        console.log('Queue maintenance completed. Current stats:', stats);

      } catch (error) {
        console.error('Error in queue maintenance:', error);
      }
    }, {
      scheduled: false
    });

    this.scheduledJobs.set('queue-maintenance', job);
    job.start();
  }

  async triggerManualCleanup(serverNames, options = {}) {
    try {
      const jobs = await this.cleanupQueueService.addBulkCleanupJobs(serverNames, {
        triggeredBy: 'manual',
        priority: 'high',
        ...options
      });

      return {
        success: true,
        message: `Cleanup scheduled for ${jobs.length} server(s)`,
        jobs: jobs.map(job => ({ id: job.id, serverName: job.data.serverName }))
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to schedule cleanup: ${error.message}`
      };
    }
  }

  async getActiveServers() {
    // This would typically query the database
    // For now, return a placeholder - will be implemented when we add database models
    try {
      const pool = require('../db/pool');
      const result = await pool.query(
        'SELECT name FROM app_support_servers WHERE is_active = true ORDER BY name'
      );
      return result.rows.map(row => row.name);
    } catch (error) {
      console.error('Error getting active servers:', error);
      return [];
    }
  }

  async scheduleOneTimeCleanup(serverName, delayMinutes = 0) {
    const delay = delayMinutes * 60 * 1000; // Convert to milliseconds

    const job = await this.cleanupQueueService.addCleanupJob(serverName, {
      triggeredBy: 'scheduled-once',
      delay
    });

    return job;
  }

  async cancelScheduledCleanup(jobId) {
    try {
      await this.cleanupQueueService.removeJob(jobId);
      return { success: true, message: 'Cleanup job cancelled' };
    } catch (error) {
      return { success: false, message: `Failed to cancel job: ${error.message}` };
    }
  }

  getScheduledJobs() {
    return Array.from(this.scheduledJobs.keys());
  }

  async getSchedulerStatus() {
    const activeJobs = await this.cleanupQueueService.getActiveJobs();
    const waitingJobs = await this.cleanupQueueService.getWaitingJobs();
    const queueStats = await this.cleanupQueueService.getQueueStats();

    return {
      isRunning: this.isRunning,
      scheduledJobs: this.getScheduledJobs(),
      activeJobs: activeJobs.length,
      waitingJobs: waitingJobs.length,
      queueStats
    };
  }
}

module.exports = CleanupSchedulerService;