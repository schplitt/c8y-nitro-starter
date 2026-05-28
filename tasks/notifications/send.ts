/**
 * Task: notifications:send
 *
 * Nitro tasks are fire-and-forget units of work that run outside of the
 * request/response cycle. They are ideal for:
 *   - deferred processing (scheduled with scheduleTask())
 *   - background jobs triggered from a route or a hook
 *   - anything that should not block an HTTP response
 *
 * The task name is derived from the file path relative to the tasks/ directory:
 *   tasks/notifications/send.ts  →  "notifications:send"
 *
 * Requires `experimental: { tasks: true }` in nitro.config.ts.
 *
 * Docs: https://schplitt.github.io/c8y-nitro/guide/scheduled-tasks
 */
import { defineTask } from 'nitro/task'
import { createLogger } from 'c8y-nitro/utils'

export default defineTask({
  meta: {
    name: 'notifications:send',
    description: 'Send a notification to a Cumulocity user',
  },

  async run({ payload }) {
    // createLogger() is the standalone logger for background / non-request
    // contexts. Call log.emit() explicitly when you are done.
    const log = createLogger()

    const { message, recipient } = payload as { message: string; recipient: string }

    log.set({ task: 'notifications:send', recipient })

    try {
      // TODO: replace with real notification logic, e.g. create a Cumulocity
      //       operation, send an email, push a message to a queue, etc.
      console.log(`[notifications:send] → ${recipient}: ${message}`)

      log.set({ status: 'sent' })
      return { result: 'sent' }
    }
    catch (err) {
      log.set({ status: 'failed', error: String(err) })
      throw err
    }
    finally {
      // emit() flushes the wide log event — always call it in background tasks.
      log.emit()
    }
  },
})
