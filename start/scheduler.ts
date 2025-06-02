import ScheduleService from '#services/schedule/schedule_service'
import CrawlJob from '../app/jobs/crawl_job.js'

const scheduler = new ScheduleService()

scheduler.addJob({
  key: 'crawl_job',
  cronExpression: '*/5 * * * *',
  job: new CrawlJob(),
})

scheduler.scheduleAllJobs()
