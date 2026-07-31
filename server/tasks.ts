/**
 * Task registry — c8yTasks()
 *
 * c8y-nitro ships its own runtime task registry. Unlike Nitro's native task
 * system, everything here is decided at *runtime*: you register functions once
 * (tasks), then schedule named instances of them (jobs) that run immediately,
 * once in the future, or repeatedly on a cron.
 *
 *   • Task — a function, known at compile time, registered once via createTask().
 *   • Job  — a named, scheduled instance of a task. Its name is chosen at runtime
 *            and it carries its own payload, schedule, and concurrency policy.
 *            One task can back many jobs.
 *
 * This module has no side effects beyond building the registry, so it is safe to
 * import from anywhere (routes, plugins). The registry is a plain runtime
 * singleton: import THIS export wherever you schedule, inspect, or cancel jobs.
 *
 * No `experimental: { tasks: true }` needed — the registry schedules with its own
 * cron engine (croner) and never touches Nitro's task system.
 *
 * Docs: https://schplitt.github.io/c8y-nitro/guide/scheduled-tasks
 */
import type { TaskEvent } from 'c8y-nitro/utils'
import { c8yTasks, createLogger } from 'c8y-nitro/utils'

export const tasks = c8yTasks()
  /**
   * Task "send-notification" — a one-shot unit of background work.
   *
   * Annotating the event (`TaskEvent<{ … }>`) types the payload, so scheduleJob()
   * and run() type-check whatever you pass. Prefer stable identifiers in the
   * payload (e.g. a recipient id) and resolve live values inside the handler.
   */
  .createTask('send-notification', async (event: TaskEvent<{ message: string, recipient: string }>) => {
    // createLogger() is the standalone logger for background / non-request
    // contexts. Call log.emit() explicitly when you are done.
    const log = createLogger()
    const { message, recipient } = event.payload

    log.set({ task: event.task, job: event.job, recipient })

    try {
      // TODO: replace with real notification logic, e.g. create a Cumulocity
      //       operation, send an email, push a message to a queue, etc.
      console.log(`[send-notification] → ${recipient}: ${message}`)

      // Note: `status` is reserved by evlog for numeric HTTP status codes,
      // so use a custom field (e.g. `outcome`) for task result state.
      log.set({ outcome: 'sent' })
      return { result: 'sent' as const }
    }
    catch (err) {
      log.set({ outcome: 'failed', error: String(err) })
      throw err
    }
    finally {
      // emit() flushes the wide log event — always call it in background tasks.
      log.emit()
    }
  })

  /**
   * Task "heartbeat" — a payload-less task, armed as a recurring job at boot by
   * server/plugins/schedule-jobs.ts (see the docs' "re-seed on startup" note).
   */
  .createTask('heartbeat', () => {
    const log = createLogger()
    log.set({ task: 'heartbeat', outcome: 'ok' })
    console.log(`[heartbeat] alive at ${new Date().toISOString()}`)
    log.emit()
    return { result: 'ok' as const }
  })
