# c8y-nitro Starter Template

A starter template for building [Cumulocity IoT](https://cumulocity.com/) microservices with **[c8y-nitro](https://schplitt.github.io/c8y-nitro/)** — a Nitro module that automates bootstrapping, Docker builds, manifest generation, and deployable zip creation.

> 📖 **Full documentation:** [schplitt.github.io/c8y-nitro](https://schplitt.github.io/c8y-nitro/)

## Quick Start

Scaffold a new project with [create-c8y-nitro](https://github.com/schplitt/create-c8y-nitro):

```sh
pnpm create c8y-nitro my-microservice
# or
npm create c8y-nitro@latest my-microservice
```

This downloads the template, sets up `package.json` for your project (`name` derived from the directory, `version` reset, template metadata stripped), initializes git, and installs dependencies.

```sh
cd my-microservice
```

<details>
<summary>Manual alternative: plain <code>giget</code> clone</summary>

```sh
pnpm dlx giget@latest gh:schplitt/c8y-nitro-starter my-microservice
cd my-microservice
pnpm install
```

Note: this copies the template verbatim — you'll need to adjust `package.json` (name, version, author, …) yourself.

</details>

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
server/                        # Server code root (nitro.config.ts → serverDir: './server')
  routes/
    user.get.ts                  # GET /user — current user via @c8y/client + structured logging
    tenant-options.get.ts        # GET /tenant-options — read manifest settings at runtime
    admin-only.ts                # GET /admin-only — role guard (object-syntax handler)
    multi-role.ts                # GET /multi-role — OR-style multi-role guard
    schedule-notification.get.ts # GET /schedule-notification — schedule a one-shot job
    jobs.get.ts                  # GET /jobs — list/cancel scheduled jobs
  plugins/
    credentials-updated.ts       # Lifecycle hook: react when tenants subscribe/unsubscribe
    schedule-jobs.ts             # Re-seed recurring jobs at boot (heartbeat)
  tasks.ts                       # c8yTasks() registry — tasks + runtime job scheduling
index.html                     # Optional landing page (delete if API-only)
nitro.config.ts                # Nitro + c8y-nitro configuration
.env.example                   # Environment variable template
```

---

## Example Patterns

### Route handler

Every `.ts` file under `server/routes/` becomes an HTTP endpoint. The file name encodes the HTTP method:

```ts
// server/routes/hello.get.ts  →  GET /hello
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
// server/routes/admin-only.ts  →  GET /admin-only
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

Tenant options declared in the manifest `settings` array are readable at runtime. Since **0.7.0** the API is client-first: pass a Cumulocity client (which selects the target tenant) and get back a handle to read/write. Reads are cached (TTL configurable per key):

```ts
import { useDeployedTenantClient, useTenantOption } from 'c8y-nitro/utils'

// The client determines which tenant is targeted:
//   useDeployedTenantClient()      → the microservice owner tenant
//   useUserTenantClient(event)     → the current request's tenant (multi-tenant)
const client = await useDeployedTenantClient()

const value = await useTenantOption(client, 'myOption').read()
const secret = await useTenantOption(client, 'credentials.secret').read() // decrypted automatically

// The handle also supports writes:
await useTenantOption(client, 'myOption').set('new-value')
const token = await useTenantOption(client, 'credentials.secret').getOrInsert('')

// Or operate on a whole settings category:
import { useTenantOptions } from 'c8y-nitro/utils'
const all = await useTenantOptions(client).list()
```

> Docs: [Tenant options guide](https://schplitt.github.io/c8y-nitro/guide/tenant-options)

---

### Nitro plugins — lifecycle hooks

Files under `server/plugins/` run once at server startup. Register c8y-nitro lifecycle hooks here:

```ts
// server/plugins/credentials-updated.ts
import { definePlugin } from 'nitro'

export default definePlugin((nitroApp) => {
  // Fired whenever subscribed tenants change (new subscription or unsubscribe).
  // `prev`/`next` are auto-typed as TenantCredentials via c8y-nitro's hook augmentation.
  nitroApp.hooks.hook('c8y:tenantCredentialsUpdated', (prev, next) => {
    const added = Object.keys(next).filter((t) => !prev || !(t in prev))
    console.log('New tenants:', added)
    // TODO: provision per-tenant resources, warm caches …
  })
})
```

> Docs: [Runtime hooks reference](https://schplitt.github.io/c8y-nitro/reference/runtime-hooks)

---

### Tasks and scheduling

c8y-nitro ships its own **runtime** task registry, `c8yTasks()`. You register
functions once (**tasks**) and schedule named instances of them (**jobs**) that
run now, once in the future, or repeatedly on a cron — all decided at runtime.
It uses its own cron engine, so no `experimental: { tasks: true }` is required.

**Build a registry** (`server/tasks.ts`) — each `createTask()` widens the type,
so `scheduleJob()`/`run()` autocomplete task names and reject typos:

```ts
import type { TaskEvent } from 'c8y-nitro/utils'
import { c8yTasks } from 'c8y-nitro/utils'

export const tasks = c8yTasks()
  .createTask('send-notification', async (event: TaskEvent<{ recipient: string, message: string }>) => {
    // resolve live state from ids in the payload, then do the work
  })
```

**Schedule a job** from a route or plugin (import the singleton):

```ts
import { tasks } from '../tasks'

// once, N seconds from now — { at: Date | ISO } or { cron: '…' } also work
tasks.scheduleJob({
  name: 'welcome-notification',
  task: 'send-notification',
  payload: { recipient: 'admin', message: 'Hello!' },
  schedule: { in: 30 },
  replace: true,
})

tasks.run('send-notification', { payload: { recipient: 'admin', message: 'now' } }) // run ad-hoc
tasks.listJobs() // inspect · triggerJob(name) · cancelJob(name)
```

Recurring jobs (`{ cron }`) evaluate in UTC by default (pass a `timezone`), and
support `immediate`, `maxRuns`, and `concurrency: 'single' | 'parallel'`.

> **Jobs live in memory** — a restart clears them. Re-seed recurring jobs from a
> boot plugin (see `server/plugins/schedule-jobs.ts`).

> Docs: [Tasks & scheduling guide](https://schplitt.github.io/c8y-nitro/guide/scheduled-tasks)

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production — creates Docker image + deployable `.zip` |
| `pnpm preview` | Preview the production build locally |
| `pnpm bootstrap` | Manually run the bootstrap flow |
| `pnpm roles` | Manage development user roles |
| `pnpm typegen` | Generate c8y-nitro types (run after changing the manifest, or before typechecking a fresh checkout) |
| `pnpm typecheck` | TypeScript type check |

## Learn More

| Resource | Link |
|---|---|
| create-c8y-nitro (scaffolding CLI) | [github.com/schplitt/create-c8y-nitro](https://github.com/schplitt/create-c8y-nitro) |
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
