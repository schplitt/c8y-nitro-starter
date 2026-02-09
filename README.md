# c8y-nitro Starter Template

A starter template for building Cumulocity IoT microservices with [c8y-nitro](https://github.com/schplitt/c8y-nitro) powered by [nitro](https://v3.nitro.build/).

## Quick Start

The fastest way to get started with c8y-nitro is like this:

```sh
pnpm dlx giget@latest gh:schplitt/c8y-nitro-starter my-microservice
cd my-microservice
pnpm install
```

Configure your development tenant in `.env`:

```sh
C8Y_BASEURL=https://your-tenant.cumulocity.com
C8Y_DEVELOPMENT_TENANT=t12345
C8Y_DEVELOPMENT_USER=your-username
C8Y_DEVELOPMENT_PASSWORD=your-password
```

Then start developing:

```sh
pnpm dev
```

## Getting Started

### 1. Configure Environment

Rename `.env.example` to `.env` and add your Cumulocity development tenant credentials:

```env
C8Y_BASEURL=https://your-tenant.cumulocity.com
C8Y_DEVELOPMENT_TENANT=t12345
C8Y_DEVELOPMENT_USER=your-username
C8Y_DEVELOPMENT_PASSWORD=your-password
```

### 2. Start Development

Install the dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

That's it! The module will automatically:
- Check if your microservice exists on the tenant
- Create it if needed
- Subscribe your tenant to the microservice
- Retrieve and save bootstrap credentials to your `.env` file

After auto-bootstrap completes, your `.env` file will contain the bootstrap credentials.

### 3. Test the Example

Visit `http://localhost:3000/` to see the example route.

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production (creates deployable zip, docker needed)
- `pnpm preview` - Preview production build
- `pnpm bootstrap` - Manually bootstrap the microservice
- `pnpm roles` - Manage development user roles
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run tests

## Project Structure

```
server/
  routes/
    api/
      user.get.ts    # Example API route at /api/user
      config.get.ts  # Configuration endpoint at /api/config
  index.html         # Optional: Simple SSR page (can be deleted if not needed)
nitro.config.ts      # Nitro and c8y-nitro configuration
.env                 # Environment variables (create from .env.example)
```

The `index.html` file in `server/` provides a simple server-side rendered landing page. This is optional and can be deleted if you only need API endpoints.

## Learn More

- [c8y-nitro Documentation](https://github.com/schplitt/c8y-nitro)
- [Nitro Documentation](https://v3.nitro.build/)
- [Cumulocity IoT](https://cumulocity.com/)

## License

MIT