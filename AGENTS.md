# AGENTS.md

Cumulocity IoT microservice built with [c8y-nitro](https://schplitt.github.io/c8y-nitro/) on [Nitro v3](https://v3.nitro.build/). Server code lives in `server/`; module and manifest config lives in `nitro.config.ts`.

## Where to Look

Don't rely on memory for these APIs, because they change often. Check the docs:

- **c8y-nitro:** [llms.txt](https://schplitt.github.io/c8y-nitro/llms.txt) (index) · [llms-full.txt](https://schplitt.github.io/c8y-nitro/llms-full.txt) (full docs) · [migration](https://schplitt.github.io/c8y-nitro/migration)
- **Nitro / h3:** [v3.nitro.build](https://v3.nitro.build/) · [h3.dev](https://h3.dev/)
- **Logging:** [evlog.dev](https://www.evlog.dev)
- **Cumulocity:** [docs](https://cumulocity.com/docs/) · [REST API](https://cumulocity.com/api/core/) · [microservice manifest & multi-tenancy](https://cumulocity.com/docs/microservice-sdk/general-aspects/)

## Commands

```sh
pnpm typegen && pnpm typecheck   # validate changes (works offline)
pnpm dev                         # needs a real tenant in .env, only run when asked
pnpm build                       # needs Docker, only run when asked
```

Run `pnpm typegen` again after changing the manifest (roles, settings).

## Reminders

- No auto-imports in Nitro v3. Import from `nitro/h3`, `nitro`, `c8y-nitro/utils`, `c8y-nitro/types` and `c8y-nitro/runtime`.
- Use the c8y-nitro helpers (`use*Client`, auth middleware, `useTenantOption`, `fetchAllPages`/`paginate`, `c8yTasks`) instead of hand-rolled versions.
- Never commit or print `.env` contents or credentials.

## Logging & Errors (evlog)

- Handlers: `useLogger(event)`, then `log.set({...})`. This builds one wide event per request.
- Tasks/plugins: `createLogger()`, and **always** call `log.emit()`, ideally in `finally`.
- `status` is reserved for HTTP codes. Use a different field such as `outcome`.
- Throw `createError` from `c8y-nitro/utils`, not from h3. Every field except `cause` and `internal` is sent to the client, so put upstream bodies and diagnostics in `internal`.

## Maintaining Documentation

When making changes to the project:

- **`AGENTS.md`**: technical details, architecture and best practices for AI agents
  - Project architecture and file structure
  - Internal patterns and conventions
  - Development workflows
  - Build/deployment processes
  - Tool configurations and quirks

- **`README.md`**: user-facing documentation:
  - ✅ New endpoints, plugins or tasks
  - ✅ New configuration options (manifest, roles, tenant options, cache)
  - ✅ Changes to existing API behavior
  - ✅ Environment variables users can set
  - ✅ Installation or setup instructions
  - ✅ Usage examples and code snippets

## Agent Guidelines

When working on this project:

1. **Check the docs** listed above before using a c8y-nitro, Nitro or Cumulocity API you're not sure about.
2. **Validate changes** with `pnpm typegen && pnpm typecheck`.
3. **Update this file** when adding new modules or patterns, or changing architecture.
4. **Record learnings**: when the user corrects a mistake or gives context about how something should be done, add it to "Project Context & Learnings" below if it's a recurring pattern (not a one-time fix).
5. **Call out documentation changes**: when you update `README.md` or `AGENTS.md`, mention it at the end of your response so the user can review it.
6. **Use available workflow tools first**: for branch/commit/PR work, use the available MCP/devtools first. Fall back to the `gh` CLI only when they aren't available.
7. **Use conventional naming for git work**: branch names use prefixes like `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, `build/`, `types/`, `style/`, `perf/`, `examples/` and `ci/`. Commit subjects and PR titles use conventional-commit style with the most fitting type.
8. **Default PR behavior**: if the current branch already contains the related work, open the PR from the current branch to `main` unless the user asks to isolate part of the work or use a different base branch.
9. **Always include a PR body**: if a related issue is known, include a GitHub-style reference to it.
10. **Ask when requirements are unclear**: ask one focused question instead of implementing a guess.
11. **Prefer simple inline logic over trivial helpers**: don't add tiny one-line helpers or throwaway `parse*` helpers for one-off logic. Inline simple normalization or branching unless there's real reuse or a clear API boundary.

## Project Context & Learnings

This section captures project-specific knowledge, tool quirks and lessons learned during development. When the user corrects you or explains how something should be done in this project, add it here if it's a recurring pattern (not a one-time fix).

> **Note:** Before adding something, ask whether it's a one-time fix or will come up again. Only document patterns that are likely to recur or are notable enough to prevent future mistakes.

### Tools & Dependencies

- `nitro` is pinned to an exact beta that must match `c8y-nitro`'s peer dependency. Bump both together.
- `nitro prepare` is gone. Use `pnpm typegen`.

### Patterns & Conventions

- Use conventional branch prefixes and conventional-commit style commit subjects / PR titles.
- Prefer simple, clean, reusable solutions over ad-hoc implementations.
- Keep trivial one-off normalization and branching inline instead of extracting tiny helper functions too early.

### Common Mistakes to Avoid

- Don't import `createError` from h3. Use the one from `c8y-nitro/utils`.
- Don't create tiny helper/utility functions or `parse*`/`normalize*` wrappers for trivial one-off logic.
- Don't guess when the requested behavior or scope is unclear.
