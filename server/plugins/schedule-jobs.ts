/**
 * Plugin: schedule-jobs
 *
 * Recurring jobs live in process memory and only arm when the module that
 * schedules them runs. A Nitro plugin runs once at server startup, so it is the
 * right place to (re-)seed the recurring jobs that must run from boot.
 *
 * IMPORTANT: jobs are NOT a durable queue. A restart or redeploy clears every
 * scheduled job — which is exactly why this re-seeding belongs in a boot plugin.
 *
 * Docs: https://schplitt.github.io/c8y-nitro/guide/scheduled-tasks
 */
import { definePlugin } from 'nitro'
import { tasks } from '../tasks'

export default definePlugin(() => {
  // Recurring: run "heartbeat" every 5 minutes. Cron is evaluated in UTC by
  // default; pass `timezone: 'Europe/Berlin'` to align to a wall clock instead.
  tasks.scheduleJob({
    name: 'heartbeat',
    task: 'heartbeat',
    schedule: { cron: '*/5 * * * *' },
    // `replace: true` keeps this idempotent if the module is ever re-evaluated.
    replace: true,
    // Optional extras: `immediate: true` also runs once now; `maxRuns: N` stops
    // after N runs; `concurrency: 'parallel'` lets overlapping runs coexist.
  })
})
