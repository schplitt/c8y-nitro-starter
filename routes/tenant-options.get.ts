/**
 * GET /tenant-options
 *
 * Reads tenant options that were declared in the manifest `settings` array
 * inside nitro.config.ts.
 *
 * useTenantOption() fetches the value from Cumulocity's tenant-options API
 * using the microservice's bootstrap credentials. Results are cached — the
 * TTL is configurable per key via `c8y.cache.tenantOptions` in nitro.config.ts
 * or via the NITRO_C8Y_DEFAULT_TENANT_OPTIONS_TTL environment variable.
 *
 * Keys starting with "credentials." are stored encrypted by Cumulocity and
 * returned decrypted here.
 *
 * Docs: https://schplitt.github.io/c8y-nitro/guide/tenant-options
 */
import { defineEventHandler } from 'nitro/h3'
import { useTenantOption } from 'c8y-nitro/utils'

export default defineEventHandler(async () => {
  const myOption = await useTenantOption('myOption')
  const secret = await useTenantOption('credentials.secret')

  return {
    myOption,
    secret,
  }
})
