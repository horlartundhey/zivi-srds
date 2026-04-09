# zivi-srds

School Result Distribution System.

## Structure

- `client/`: Vite React frontend
- `server/`: Node.js backend and shared Express app
- `api/`: Vercel serverless entrypoint

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

This repository is configured to deploy from the workspace root on Vercel:

- the React app is built from `client/`
- the API is served through `api/[...path].js`
- SPA routes are rewritten to `client/dist/index.html`
- queued emails are processed inside the request lifecycle so they complete on serverless
- the daily queue resume runs through Vercel Cron against `/api/email/process`

### Required Vercel environment variables

- `MONGODB_URI`
- `BREVO_SMTP_USER`
- `BREVO_SMTP_KEY`
- `BREVO_FROM_EMAIL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `APP_URL`
- `CRON_SECRET`

Set `APP_URL` to your production domain, for example `https://your-project.vercel.app` or your custom domain.

`CRON_SECRET` should be set in Vercel so scheduled requests to `/api/email/process` are authenticated.