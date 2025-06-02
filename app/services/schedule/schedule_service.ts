import { JobConfig } from '#types/jobs'
import { CronJob } from 'cron'

export default class ScheduleService {
  private jobs: JobConfig[] = []

  addJob(jobConfig: JobConfig) {
    this.jobs.push(jobConfig)
  }

  scheduleSingleJob(jobConfig: JobConfig) {
    const cronjob: CronJob = new CronJob(jobConfig.cronExpression, async () => {
      try {
        await jobConfig.job.run()
      } catch (e) {
        console.error(e)
      }
    })
    cronjob.start()
  }

  scheduleAllJobs() {
    for (const job of this.jobs) {
      this.scheduleSingleJob(job)
    }
  }
}
