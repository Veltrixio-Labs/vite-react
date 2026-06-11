# Veltrixio SaaS Platform Frontend

Standalone React/Vite frontend for the Veltrixio SaaS platform.

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Local URLs:

- Main website: `http://localhost:5173`
- Platform admin: `http://admin.localhost:5173`
- Tenant public/manage site: `http://abchardware.localhost:5173`

## Build

```bash
npm run build
```

The static build output is created in `dist/`.

## Production Hosting

Set `VITE_API_BASE_URL` to the deployed backend API URL, for example:

```env
VITE_API_BASE_URL=https://api.veltrixio.com
VITE_APP_DOMAIN=veltrixio.com
VITE_ADMIN_HOST=admin.veltrixio.com
```

For tenant subdomains, create a wildcard DNS record if Hostinger supports it:

```text
*.veltrixio.com -> frontend hosting target
```

If wildcard subdomains are not supported in your hosting package, each tenant subdomain must be created manually.
