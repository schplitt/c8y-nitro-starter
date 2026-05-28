import { defineNitroConfig } from 'nitro/config'
import c8y from 'c8y-nitro'

export default defineNitroConfig({
  preset: 'node_server',
  // serverDir defaults to './server' — set to './' so routes/, plugins/,
  // and tasks/ live at the project root (same layout as the playground).
  serverDir: './',

  builder: 'rolldown',

  experimental: {
    // Required to use Nitro tasks and scheduleTask() from c8y-nitro/utils.
    tasks: true,
    // Enables async_hooks-based context propagation so helpers like useLogger()
    // can reach the current request from deeply nested call stacks.
    asyncContext: true,
  },

  c8y: {
    // ── Manifest ─────────────────────────────────────────────────────────────
    // Defines the cumulocity.json that is bundled into the deployable .zip.
    // All fields map 1-to-1 to the Cumulocity microservice manifest spec.
    // Docs: https://schplitt.github.io/c8y-nitro/guide/manifest
    manifest: {
      // Custom roles that users of this microservice can be assigned.
      roles: ['ROLE_MY_MICROSERVICE_ADMIN', 'ROLE_MY_MICROSERVICE_READ'],
      // Tenant options the microservice reads at runtime.
      // Keys starting with "credentials." are stored encrypted.
      settings: [
        { key: 'myOption', defaultValue: 'default-value' },
        { key: 'credentials.secret', defaultValue: 'change-me' },
      ],
      // Roles that the microservice's own service user must have.
      requiredRoles: ['ROLE_OPTION_MANAGEMENT_READ'],
    },

    // ── Cache ─────────────────────────────────────────────────────────────────
    // All TTLs are in seconds.
    // Docs: https://schplitt.github.io/c8y-nitro/guide/cache
    cache: {
      // How long subscribed-tenant credentials are cached (default: 600 s).
      credentialsTTL: 600,
      // Per-key TTL overrides for tenant options.
      tenantOptions: {
        myOption: 300,
        // 'credentials.secret' will use the default TTL (10 minutes).
      },
    },

    // ── Dev options ───────────────────────────────────────────────────────────
    // Options that only apply during `pnpm dev`.
    // Docs: https://schplitt.github.io/c8y-nitro/guide/auto-bootstrap
    dev: {
      // Set to false to skip injecting the dev user into every request.
      // injectDevUser: true,
    },
  },

  modules: [
    c8y(),
  ],
})
