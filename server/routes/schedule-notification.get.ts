/**
 * GET /schedule-notification?delay=30
 *
 * Schedules the `notifications:send` task to run once in the future.
 *
 * scheduleTask() accepts:
 *   - a number   → seconds from now
 *   - a string   → human-readable duration, e.g. "5 minutes", "1 hour"
 *   - a Date     → exact run time
 *
 * Requires `experimental: { tasks: true }` in nitro.config.ts.
 *
 * Docs: https://schplitt.github.io/c8y-nitro/guide/scheduled-tasks
 */
import { defineEventHandler, getQuery } from 'nitro/h3'
import { scheduleTask } from 'c8y-nitro/utils'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // How many seconds from now to run the task (default: 30 s).
  const delaySeconds = typeof query.delay === 'string' ? Number(query.delay) : 30

  const scheduled = await scheduleTask('notifications:send', {
    // payload is forwarded to the task's run() method as TaskEvent.payload.
    payload: {
      message: 'Hello from the scheduler!',
      recipient: 'admin',
    },
    schedule: delaySeconds,
  })

  return {
    message: `Task scheduled to run in ${delaySeconds} second(s).`,
    scheduled,
  }
})
