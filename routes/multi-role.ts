/**
 * GET /multi-role
 *
 * Route accessible to users that have ANY ONE of the listed roles.
 * Useful when both an admin and a read-only role should be allowed in.
 *
 * Passing an array to hasUserRequiredRole() performs an OR check —
 * the user needs at least one matching role.
 *
 * For tenant-scoped access control, see also:
 *   isUserFromAllowedTenant(['t12345', 't99999'])
 *   isUserFromDeployedTenant()          — restricts to the hosting tenant only
 *
 * Docs: https://schplitt.github.io/c8y-nitro/guide/auth-middleware
 */
import { defineHandler } from 'nitro/h3'
import { hasUserRequiredRole } from 'c8y-nitro/utils'

export default defineHandler({
  middleware: [
    hasUserRequiredRole(['ROLE_MY_MICROSERVICE_ADMIN', 'ROLE_MY_MICROSERVICE_READ']),
  ],

  handler: async () => {
    return {
      message: 'You have at least one of the required roles.',
    }
  },
})
