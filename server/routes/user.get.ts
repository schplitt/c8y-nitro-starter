/**
 * GET /user
 *
 * Returns the currently authenticated Cumulocity user.
 *
 * useUserClient() creates a Cumulocity @c8y/client authenticated with the
 * credentials from the incoming Authorization header — no session management
 * or token storage needed.
 *
 * useLogger() returns a structured logger bound to the current request.
 * Fields added with log.set() are merged into a single wide log event that
 * is emitted when the handler returns or throws.
 *
 * Docs: https://schplitt.github.io/c8y-nitro/reference/utilities
 */
import { defineEventHandler } from 'nitro/h3'
import { useLogger, useUserClient } from 'c8y-nitro/utils'

export default defineEventHandler(async (event) => {
  const client = useUserClient(event)
  const log = useLogger(event)

  const { data: user } = await client.user.currentWithEffectiveRoles()

  // Attach structured fields — they appear in the emitted log event alongside
  // the request metadata (method, path, status, duration).
  log.set({ action: 'get-current-user', userId: user.userName })

  return user
})
