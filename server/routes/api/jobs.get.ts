/**
 * GET /api/jobs            → list all currently registered jobs
 * GET /api/jobs?cancel=NAME → cancel a job by name, then list the rest
 *
 * Demonstrates the inspection side of the c8y-nitro task registry. Every job
 * carries its `nextRun`, whether it is `running`, and (for recurring jobs) the
 * cron expression plus a few upcoming `nextRuns`.
 *
 * Docs: https://schplitt.github.io/c8y-nitro/guide/scheduled-tasks
 */
import { defineEventHandler, getQuery } from 'nitro/h3'
import { tasks } from '../../tasks'

export default defineEventHandler((event) => {
  const query = getQuery(event)

  let cancelled: boolean | undefined
  if (typeof query.cancel === 'string') {
    // cancelJob() returns true when a job was found and stopped, false otherwise.
    cancelled = tasks.cancelJob(query.cancel)
  }

  return {
    cancelled,
    jobs: tasks.listJobs(),
  }
})
