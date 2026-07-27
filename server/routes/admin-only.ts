/**
 * GET /admin-only
 *
 * Demonstrates the object-syntax handler with per-route middleware.
 *
 * defineHandler({ middleware, handler }) lets you attach one or more
 * middleware functions that run before the main handler. Each middleware
 * receives the same H3Event and can throw to short-circuit the chain.
 *
 * hasUserRequiredRole() checks the effective roles of the Cumulocity user
 * extracted from the incoming Authorization header and throws 403 if the
 * required role is not present.
 *
 * Docs: https://schplitt.github.io/c8y-nitro/guide/auth-middleware
 */
import { defineHandler } from 'nitro/h3'
import { hasUserRequiredRole } from 'c8y-nitro/utils'

export default defineHandler({
  // Middleware runs before the handler. Add as many as you need — they execute
  // left-to-right and the first one to throw stops the chain.
  middleware: [hasUserRequiredRole('ROLE_MY_MICROSERVICE_ADMIN')],

  handler: async () => {
    return {
      message: 'Welcome, admin! You have the ROLE_MY_MICROSERVICE_ADMIN role.',
    }
  },
})
