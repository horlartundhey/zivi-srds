# zivi-srds

School Result Distribution System.

## Structure

- `client/`: Vite React frontend
- `server/`: Node.js backend

## Local development

Install all dependencies:

```bash
npm run install:all
```

Run the frontend and backend separately:

```bash
npm run client
npm run server
```

If you want the local cron scheduler enabled, set `ENABLE_EMAIL_CRON=true` in `server/.env` before starting the backend.

## Vercel deployment

Deploy `client` and `server` as two separate Vercel projects.

### Client deployment

Use the `client/` directory as the Vercel root.

- Vercel config: `client/vercel.json`
- build command: `npm run build`
- output directory: `dist`

Add this environment variable to the client project:

- `VITE_API_BASE_URL=https://your-server-project.vercel.app/api`

### Server deployment

Use the `server/` directory as the Vercel root.

- Vercel config: `server/vercel.json`
- API entrypoint: `server/api/[...path].js`
- daily queue resume runs through Vercel Cron against `/api/email/process`

Required environment variables for the server project:

- `MONGODB_URI`
- `BREVO_SMTP_USER`
- `BREVO_SMTP_KEY`
- `BREVO_FROM_EMAIL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `APP_URL`
- `CRON_SECRET`

Set `APP_URL` to the deployed server domain, for example `https://your-server-project.vercel.app`.