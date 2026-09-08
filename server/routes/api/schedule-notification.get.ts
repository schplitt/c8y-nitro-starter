/**
 * GET /api/schedule-notification?delay=30
 *
 * Schedules a one-shot job that runs the "send-notification" task once in the
 * future, using the c8y-nitro task registry (see server/tasks.ts).
 *
 * scheduleJob() takes a `schedule`:
 *   - { in: 30 }            → once, 30 seconds from now
 *   - { at: Date | ISO }    → once, at an exact instant (taken literally)
 *   - { cron: '* * * * *' } → recurring (see server/plugins/schedule-jobs.ts)
 *
 * Job names are unique — pass `replace: true` to overwrite an existing one.
 * It returns a JobInfo (nextRun, running, kind, …).
 *
 * Docs: https://schplitt.github.io/c8y-nitro/guide/scheduled-tasks
 */
import { defineEventHandler, getQuery } from 'nitro/h3'
import { tasks } from '../../tasks'

export default defineEventHandler((event) => {
  const query = getQuery(event)

  // How many seconds from now to run the job (default: 30 s).
  const delaySeconds = typeof query.delay === 'string' ? Number(query.delay) : 30

  const job = tasks.scheduleJob({
    // Unique, caller-chosen job name — the handle for triggerJob()/cancelJob().
    name: 'welcome-notification',
    // Name of a task registered in server/tasks.ts. Typos are a compile error.
    task: 'send-notification',
    // Forwarded to the task handler's event.payload (type-checked).
    payload: {
      message: 'Hello from the scheduler!',
      recipient: 'admin',
    },
    schedule: { in: delaySeconds },
    // Overwrite instead of throwing if this route is hit more than once.
    replace: true,
  })

  return {
    message: `Job scheduled to run in ${delaySeconds} second(s).`,
    job,
  }
})
