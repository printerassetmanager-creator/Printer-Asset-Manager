const CleanupQueueService = require('../queues/cleanupQueue');
const CleanupSchedulerService = require('../schedulers/cleanupScheduler');
const CleanupDatabaseService = require('../database/cleanupDb');
const PowerShellCleanupEngine = require('../powershell/cleanupEngine');

class CleanupController {
  constructor() {
    this.queueService = new CleanupQueueService();
    this.schedulerService = new CleanupSchedulerService(this.queueService);
    this.databaseService = new CleanupDatabaseService();
    this.cleanupEngine = new PowerShellCleanupEngine();
  }

  async initialize() {
    if (process.platform !== 'win32' && process.env.ENABLE_SERVER_CLEANUP !== 'true') {
      console.warn('Server cleanup service is disabled on non-Windows hosts. Set ENABLE_SERVER_CLEANUP=true to force enable.');
      return;
    }

    await this.databaseService.initializeTables();
    await this.queueService.initialize();

    // Set up job processor
    this.queueService.setJobProcessor(this.processCleanupJob.bind(this));

    // Start scheduler
    await this.schedulerService.start();
  }

  async processCleanupJob(job) {
    const { serverName, triggeredBy, inactiveHours, dryRun } = job.data;

    try {
      console.log(`Processing cleanup job for ${serverName}`);

      // Get server credentials (this would need to be implemented)
      const credentials = await this.getServerCredentials(serverName);
      if (!credentials) {
        throw new Error(`No credentials found for server ${serverName}`);
      }

      // Execute cleanup
      const results = await this.cleanupEngine.executeCleanup(
        serverName,
        credentials.username,
        credentials.password,
        { inactiveHours, dryRun }
      );

      // Save results to database
      await this.databaseService.saveCleanupLog({
        server_name: serverName,
        job_id: job.id,
        status: 'success',
        profiles_scanned: results.scanned,
        profiles_deleted: results.deleted,
        profiles_failed: results.failed,
        space_freed_bytes: results.spaceFreed,
        execution_time_seconds: results.executionTime,
        triggered_by: triggeredBy,
        dry_run: dryRun,
        started_at: new Date(results.timestamp),
        completed_at: new Date()
      });

      return results;

    } catch (error) {
      console.error(`Cleanup job failed for ${serverName}:`, error);

      // Save failure to database
      await this.databaseService.saveCleanupLog({
        server_name: serverName,
        job_id: job.id,
        status: 'failed',
        triggered_by: triggeredBy,
        error_message: error.message,
        dry_run: dryRun,
        started_at: new Date(),
        completed_at: new Date()
      });

      throw error;
    }
  }

  async getServerCredentials(serverName) {
    // This is a placeholder - in production, you'd retrieve encrypted credentials
    // For now, return mock credentials
    return {
      username: process.env.DEFAULT_ADMIN_USER || 'Administrator',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'password'
    };
  }

  // API Methods
  async connectServer(req, res) {
    try {
      const { serverName, username, password } = req.body;

      if (!serverName || !username || !password) {
        return res.status(400).json({ error: 'Server name, username, and password are required' });
      }

      // Validate server connectivity (placeholder)
      const isConnected = await this.validateServerConnection(serverName, username, password);

      if (!isConnected) {
        return res.status(400).json({ error: 'Cannot connect to server. Check credentials and network.' });
      }

      // Save server to database
      const server = await this.databaseService.addServer({
        name: serverName,
        hostname: serverName
      });

      res.json({
        message: 'Server connected successfully',
        server
      });

    } catch (error) {
      console.error('Server connection error:', error);
      res.status(500).json({ error: 'Failed to connect to server' });
    }
  }

  async runServerCleanup(req, res) {
    try {
      const { serverName } = req.body;
      const triggeredBy = req.user?.email || 'system';

      if (!serverName) {
        return res.status(400).json({ error: 'Server name is required' });
      }

      // Add job to queue
      const job = await this.queueService.addCleanupJob(serverName, {
        triggeredBy,
        priority: 'high'
      });

      res.json({
        message: 'Cleanup job queued successfully',
        jobId: job.id,
        serverName
      });

    } catch (error) {
      console.error('Cleanup queue error:', error);
      res.status(500).json({ error: 'Failed to queue cleanup job' });
    }
  }

  async runBulkCleanup(req, res) {
    try {
      const { serverNames, inactiveHours = 8, dryRun = false } = req.body;
      const triggeredBy = req.user?.email || 'system';

      if (!Array.isArray(serverNames) || serverNames.length === 0) {
        return res.status(400).json({ error: 'Server names array is required' });
      }

      // Add jobs to queue
      const jobs = await this.queueService.addBulkCleanupJobs(serverNames, {
        triggeredBy,
        inactiveHours,
        dryRun,
        priority: 'normal'
      });

      res.json({
        message: `Cleanup queued for ${jobs.length} servers`,
        jobs: jobs.map(job => ({ id: job.id, serverName: job.data.serverName }))
      });

    } catch (error) {
      console.error('Bulk cleanup error:', error);
      res.status(500).json({ error: 'Failed to queue bulk cleanup' });
    }
  }

  async getCleanupStatus(req, res) {
    try {
      const status = await this.databaseService.getCleanupStatus();
      res.json(status);
    } catch (error) {
      console.error('Cleanup status error:', error);
      res.status(500).json({ error: 'Failed to fetch cleanup status' });
    }
  }

  async getCleanupHistory(req, res) {
    try {
      const { serverName, limit = 50 } = req.query;
      const history = await this.databaseService.getCleanupLogs(serverName, parseInt(limit));
      res.json(history);
    } catch (error) {
      console.error('Cleanup history error:', error);
      res.status(500).json({ error: 'Failed to fetch cleanup history' });
    }
  }

  async getCleanupLogs(req, res) {
    try {
      const { serverName } = req.params;
      const logs = await this.databaseService.getCleanupLogs(serverName, 100);
      res.json(logs);
    } catch (error) {
      console.error('Cleanup logs error:', error);
      res.status(500).json({ error: 'Failed to fetch cleanup logs' });
    }
  }

  async getActiveSessions(req, res) {
    try {
      const { serverId } = req.query;
      const sessions = await this.databaseService.getActiveSessions(serverId ? parseInt(serverId) : null);
      res.json(sessions);
    } catch (error) {
      console.error('Active sessions error:', error);
      res.status(500).json({ error: 'Failed to fetch active sessions' });
    }
  }

  async getQueueStatus(req, res) {
    try {
      const queueStats = await this.queueService.getQueueStats();
      const schedulerStatus = await this.schedulerService.getSchedulerStatus();

      res.json({
        queue: queueStats,
        scheduler: schedulerStatus
      });
    } catch (error) {
      console.error('Queue status error:', error);
      res.status(500).json({ error: 'Failed to fetch queue status' });
    }
  }

  async scheduleCleanup(req, res) {
    try {
      const { serverNames, cronExpression, name, description } = req.body;
      const createdBy = req.user?.email || 'system';

      // This would create a scheduled job - placeholder for now
      res.json({
        message: 'Scheduled cleanup created (placeholder)',
        name,
        cronExpression,
        serverNames
      });
    } catch (error) {
      console.error('Schedule cleanup error:', error);
      res.status(500).json({ error: 'Failed to schedule cleanup' });
    }
  }

  async validateServerConnection(serverName, username, password) {
    // Placeholder - implement actual WinRM connectivity test
    try {
      // Test ping first
      const pingResult = await this.pingServer(serverName);
      if (!pingResult) return false;

      // Test WinRM (simplified)
      return true;
    } catch (error) {
      return false;
    }
  }

  async pingServer(serverName) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      await execAsync(`ping -n 1 ${serverName}`, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Analytics endpoint
  async getCleanupAnalytics(req, res) {
    try {
      const { days = 30 } = req.query;
      const analytics = await this.databaseService.getCleanupAnalytics(parseInt(days));
      const serverStats = await this.databaseService.getServerCleanupStats();

      res.json({
        analytics,
        serverStats
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }
}

module.exports = CleanupController;
