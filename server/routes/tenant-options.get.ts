/**
 * GET /tenant-options
 *
 * Reads tenant options that were declared in the manifest `settings` array
 * inside nitro.config.ts.
 *
 * As of c8y-nitro 0.7.0 the tenant options API is client-first: you pass a
 * Cumulocity client that determines *which* tenant is targeted, and get back a
 * handle you then read/write.
 *
 *   useTenantOption(client, key).read() / .set() / .getOrInsert() / .delete() …
 *
 * Here we use useDeployedTenantClient() — the microservice's own service user —
 * to read the owner tenant's config (equivalent to the pre-0.7.0 behaviour).
 * For the current request's tenant in a multi-tenant deployment, pass
 * useUserTenantClient(event) instead.
 *
 * Reads are cached — the TTL is configurable per key via `c8y.cache.tenantOptions`
 * in nitro.config.ts or via NITRO_C8Y_DEFAULT_TENANT_OPTIONS_TTL.
 *
 * Keys starting with "credentials." are stored encrypted by Cumulocity and
 * returned decrypted here.
 *
 * Docs: https://schplitt.github.io/c8y-nitro/guide/tenant-options
 */
import { defineEventHandler } from 'nitro/h3'
import { useDeployedTenantClient, useTenantOption } from 'c8y-nitro/utils'

export default defineEventHandler(async () => {
  const client = await useDeployedTenantClient()

  const myOption = await useTenantOption(client, 'myOption').read()
  const secret = await useTenantOption(client, 'credentials.secret').read()

  return {
    myOption,
    secret,
  }
})
