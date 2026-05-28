/**
 * Plugin: credentials-updated
 *
 * Nitro plugins run once when the server starts. They are the right place to
 * register lifecycle hooks, set up background intervals, or initialise
 * shared module-level state.
 *
 * c8y-nitro emits `c8y:tenantCredentialsUpdated` whenever the set of tenants
 * subscribed to this microservice changes (a new tenant subscribes, or one
 * unsubscribes). The hook receives the previous and updated TenantCredentials
 * maps so you can react to individual tenant changes.
 *
 * Other available c8y-nitro hooks:
 *   (none others yet — watch the changelog for additions)
 *
 * Docs: https://schplitt.github.io/c8y-nitro/reference/runtime-hooks
 */
import type { TenantCredentials } from 'c8y-nitro/types'
import { definePlugin } from 'nitro'

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('c8y:tenantCredentialsUpdated', (prev: TenantCredentials | null, next: TenantCredentials) => {
    const added = Object.keys(next).filter((t) => !prev || !(t in prev))
    const removed = prev ? Object.keys(prev).filter((t) => !(t in next)) : []

    if (added.length > 0) {
      console.log('[credentials] new tenant(s) subscribed:', added.join(', '))
      // TODO: provision per-tenant resources, warm caches, send notifications …
    }

    if (removed.length > 0) {
      console.log('[credentials] tenant(s) unsubscribed:', removed.join(', '))
      // TODO: clean up per-tenant resources, revoke tokens …
    }
  })
})
