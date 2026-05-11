const { Queue, Worker, QueueScheduler } = require('bullmq');
const Redis = require('redis');

class CleanupQueueService {
  constructor(redisConfig = {}) {
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      ...redisConfig
    };

    this.cleanupQueue = null;
    this.cleanupWorker = null;
    this.queueScheduler = null;
  }

  async initialize() {
    // Create Redis connection
    const redisConnection = {
      host: this.redisConfig.host,
      port: this.redisConfig.port,
      password: this.redisConfig.password
    };

    // Initialize queue
    this.cleanupQueue = new Queue('server-cleanup', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000 // 1 minute
        }
      }
    });

    // Initialize queue scheduler for delayed jobs
    this.queueScheduler = new QueueScheduler('server-cleanup', {
      connection: redisConnection
    });

    console.log('Cleanup queue service initialized');
  }

  async addCleanupJob(serverName, options = {}) {
    const {
      priority = 'normal',
      delay = 0,
      triggeredBy = 'system',
      inactiveHours = 8,
      dryRun = false
    } = options;

    const jobId = `cleanup-${serverName}-${Date.now()}`;

    const job = await this.cleanupQueue.add(
      'cleanup-server',
      {
        serverName,
        triggeredBy,
        inactiveHours,
        dryRun,
        jobId
      },
      {
        jobId,
        priority: this.getPriorityValue(priority),
        delay,
        removeOnComplete: 10,
        removeOnFail: 5
      }
    );

    console.log(`Added cleanup job for ${serverName} with ID: ${job.id}`);
    return job;
  }

  async addBulkCleanupJobs(serverNames, options = {}) {
    const jobs = [];

    for (const serverName of serverNames) {
      const job = await this.addCleanupJob(serverName, {
        ...options,
        delay: jobs.length * 30000 // 30 second stagger
      });
      jobs.push(job);
    }

    return jobs;
  }

  getPriorityValue(priority) {
    const priorities = {
      'low': 1,
      'normal': 5,
      'high': 10,
      'critical': 20
    };
    return priorities[priority] || 5;
  }

  async getJobStatus(jobId) {
    const job = await this.cleanupQueue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
      state
    };
  }

  async getActiveJobs() {
    return await this.cleanupQueue.getActive();
  }

  async getWaitingJobs() {
    return await this.cleanupQueue.getWaiting();
  }

  async getCompletedJobs(limit = 10) {
    return await this.cleanupQueue.getCompleted(0, limit);
  }

  async getFailedJobs(limit = 10) {
    return await this.cleanupQueue.getFailed(0, limit);
  }

  async retryJob(jobId) {
    const job = await this.cleanupQueue.getJob(jobId);
    if (!job) throw new Error('Job not found');

    await job.retry();
    return job;
  }

  async removeJob(jobId) {
    const job = await this.cleanupQueue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  async cleanOldJobs(grace = 24 * 60 * 60 * 1000) { // 24 hours
    await this.cleanupQueue.clean(grace, 100, 'completed');
    await this.cleanupQueue.clean(grace, 50, 'failed');
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.cleanupQueue.getWaiting(),
      this.cleanupQueue.getActive(),
      this.cleanupQueue.getCompleted(),
      this.cleanupQueue.getFailed(),
      this.cleanupQueue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length
    };
  }

  async shutdown() {
    if (this.cleanupWorker) {
      await this.cleanupWorker.close();
    }
    if (this.queueScheduler) {
      await this.queueScheduler.close();
    }
    if (this.cleanupQueue) {
      await this.cleanupQueue.close();
    }
    console.log('Cleanup queue service shut down');
  }

  // Set up worker with job processor
  setJobProcessor(processorFunction) {
    this.cleanupWorker = new Worker('server-cleanup', processorFunction, {
      connection: {
        host: this.redisConfig.host,
        port: this.redisConfig.port,
        password: this.redisConfig.password
      },
      concurrency: 2, // Process 2 cleanup jobs simultaneously
      limiter: {
        max: 10,
        duration: 60000 // Max 10 jobs per minute
      }
    });

    this.cleanupWorker.on('completed', (job) => {
      console.log(`Cleanup job ${job.id} completed for ${job.data.serverName}`);
    });

    this.cleanupWorker.on('failed', (job, err) => {
      console.error(`Cleanup job ${job.id} failed for ${job.data.serverName}:`, err.message);
    });

    return this.cleanupWorker;
  }
}

module.exports = CleanupQueueService;