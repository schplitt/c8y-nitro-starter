# c8y-nitro Starter Template

A starter template for building [Cumulocity IoT](https://cumulocity.com/) microservices with **[c8y-nitro](https://schplitt.github.io/c8y-nitro/)** — a Nitro module that automates bootstrapping, Docker builds, manifest generation, and deployable zip creation.

> 📖 **Full documentation:** [schplitt.github.io/c8y-nitro](https://schplitt.github.io/c8y-nitro/)

## Quick Start

```sh
pnpm dlx giget@latest gh:schplitt/c8y-nitro-starter my-microservice
cd my-microservice
pnpm install
```

Copy `.env.example` to `.env` and fill in your development tenant credentials:

```sh
cp .env.example .env
```

```env
C8Y_BASEURL=https://your-tenant.cumulocity.com
C8Y_DEVELOPMENT_TENANT=t12345
C8Y_DEVELOPMENT_USER=your-username
C8Y_DEVELOPMENT_PASSWORD=your-password
```

Then start developing:

```sh
pnpm dev
```

On first run c8y-nitro will automatically check if the microservice exists on your tenant, create it if needed, subscribe, and save the bootstrap credentials to `.env`.
See the [auto-bootstrap guide](https://schplitt.github.io/c8y-nitro/guide/auto-bootstrap) for details.

---

## Project Structure

```
routes/
  user.get.ts                  # GET /user — current user via @c8y/client + structured logging
  tenant-options.get.ts        # GET /tenant-options — read manifest settings at runtime
  admin-only.ts                # GET /admin-only — role guard (object-syntax handler)
  multi-role.ts                # GET /multi-role — OR-style multi-role guard
  schedule-notification.get.ts # GET /schedule-notification — one-shot task scheduling
plugins/
  credentials-updated.ts       # Lifecycle hook: react when tenants subscribe/unsubscribe
tasks/
  notifications/
    send.ts                    # Task "notifications:send" — background work unit
index.html                     # Optional landing page (delete if API-only)
nitro.config.ts                # Nitro + c8y-nitro configuration
.env.example                   # Environment variable template
```

---

## Example Patterns

### Route handler

Every `.ts` file under `routes/` becomes an HTTP endpoint. The file name encodes the HTTP method:

```ts
// routes/hello.get.ts  →  GET /hello
import { defineEventHandler } from 'nitro/h3'
import { useUserClient } from 'c8y-nitro/utils'

export default defineEventHandler(async (event) => {
  const client = useUserClient(event)   // @c8y/client authenticated as the calling user
  const { data: user } = await client.user.current()
  return user
})
```

> Docs: [Nitro route handlers](https://v3.nitro.build/guide/routing) · [useUserClient](https://schplitt.github.io/c8y-nitro/reference/utilities)

---

### Object-syntax handler with per-route middleware

`defineHandler({ middleware, handler })` lets you attach middleware that runs before the handler. This is the recommended pattern for access control:

```ts
// routes/admin-only.ts  →  GET /admin-only
import { defineHandler } from 'nitro/h3'
import { hasUserRequiredRole } from 'c8y-nitro/utils'

export default defineHandler({
  middleware: [
    // Throws 403 if the calling user doesn't have this role.
    hasUserRequiredRole('ROLE_MY_MICROSERVICE_ADMIN'),
  ],
  handler: async () => {
    return { message: 'Admin access granted.' }
  },
})
```

Available middleware helpers from `c8y-nitro/utils`:

| Helper | Description |
|---|---|
| `hasUserRequiredRole(role)` | Require a single role |
| `hasUserRequiredRole([...roles])` | Require any one of multiple roles (OR) |
| `isUserFromAllowedTenant([...ids])` | Restrict to specific tenant IDs |
| `isUserFromDeployedTenant()` | Restrict to the hosting tenant only |

> Docs: [Auth middleware guide](https://schplitt.github.io/c8y-nitro/guide/auth-middleware)

---

### Structured logging

`useLogger(event)` returns a request-scoped logger. Fields added with `log.set()` are merged into a single wide log event emitted when the handler completes:

```ts
import { defineEventHandler } from 'nitro/h3'
import { useLogger, useUserClient } from 'c8y-nitro/utils'

export default defineEventHandler(async (event) => {
  const log = useLogger(event)
  const client = useUserClient(event)

  const { data: user } = await client.user.current()
  log.set({ action: 'get-user', userId: user.userName })

  return user
})
```

For background contexts (tasks, plugins) use `createLogger()` and call `log.emit()` manually.

> Docs: [Logging guide](https://schplitt.github.io/c8y-nitro/guide/logging)

---

### Structured errors

Use `createError` from `c8y-nitro/utils` (not h3's built-in) to include `why`, `fix`, and `link` fields in both the log event and the JSON response:

```ts
import { createError } from 'c8y-nitro/utils'

throw createError({
  status: 402,
  message: 'Payment required',
  why: 'Subscription has expired',
  fix: 'Renew your subscription at https://example.com/billing',
  link: 'https://docs.example.com/billing',
})
```

---

### Tenant options

Tenant options declared in the manifest `settings` array are readable at runtime via `useTenantOption()`. Results are cached (TTL configurable per key):

```ts
import { useTenantOption } from 'c8y-nitro/utils'

const value = await useTenantOption('myOption')
const secret = await useTenantOption('credentials.secret') // decrypted automatically
```

> Docs: [Tenant options guide](https://schplitt.github.io/c8y-nitro/guide/tenant-options)

---

### Nitro plugins — lifecycle hooks

Files under `plugins/` run once at server startup. Register c8y-nitro lifecycle hooks here:

```ts
// plugins/credentials-updated.ts
import type { TenantCredentials } from 'c8y-nitro/types'
import { definePlugin } from 'nitro'

export default definePlugin((nitroApp) => {
  // Fired whenever subscribed tenants change (new subscription or unsubscribe).
  nitroApp.hooks.hook('c8y:tenantCredentialsUpdated', (prev: TenantCredentials | null, next: TenantCredentials) => {
    const added = Object.keys(next).filter((t) => !prev || !(t in prev))
    console.log('New tenants:', added)
    // TODO: provision per-tenant resources, warm caches …
  })
})
```

> Docs: [Runtime hooks reference](https://schplitt.github.io/c8y-nitro/reference/runtime-hooks)

---

### Tasks and scheduling

Tasks are standalone work units under `tasks/`. Enable them with `experimental: { tasks: true }` in `nitro.config.ts`.

**Define a task** (`tasks/notifications/send.ts` → name `"notifications:send"`):

```ts
import { defineTask } from 'nitro/task'
import { createLogger } from 'c8y-nitro/utils'

export default defineTask({
  meta: { name: 'notifications:send', description: 'Send a notification' },
  async run({ payload }) {
    const log = createLogger()
    // ... do work ...
    log.emit() // always emit in background tasks
    return { result: 'done' }
  },
})
```

**Schedule a task** from a route:

```ts
import { scheduleTask } from 'c8y-nitro/utils'

// number = seconds from now | string = "5 minutes" | Date = exact time
await scheduleTask('notifications:send', {
  payload: { recipient: 'admin', message: 'Hello!' },
  schedule: 30,
})
```

> Docs: [Scheduled tasks guide](https://schplitt.github.io/c8y-nitro/guide/scheduled-tasks)

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production — creates Docker image + deployable `.zip` |
| `pnpm preview` | Preview the production build locally |
| `pnpm bootstrap` | Manually run the bootstrap flow |
| `pnpm roles` | Manage development user roles |
| `pnpm typegen` | Generate Nitro types (run after changing config) |
| `pnpm typecheck` | TypeScript type check |

## Learn More

| Resource | Link |
|---|---|
| c8y-nitro docs | [schplitt.github.io/c8y-nitro](https://schplitt.github.io/c8y-nitro/) |
| What is c8y-nitro? | [/guide/what-is-c8y-nitro](https://schplitt.github.io/c8y-nitro/guide/what-is-c8y-nitro) |
| Configuration reference | [/reference/module-options](https://schplitt.github.io/c8y-nitro/reference/module-options) |
| Utilities reference | [/reference/utilities](https://schplitt.github.io/c8y-nitro/reference/utilities) |
| Environment variables | [/reference/environment-variables](https://schplitt.github.io/c8y-nitro/reference/environment-variables) |
| Manifest guide | [/guide/manifest](https://schplitt.github.io/c8y-nitro/guide/manifest) |
| Deployment guide | [/guide/deployment](https://schplitt.github.io/c8y-nitro/guide/deployment) |
| Nitro docs | [v3.nitro.build](https://v3.nitro.build/) |
| Cumulocity IoT | [cumulocity.com](https://cumulocity.com/) |

## License

MIT
