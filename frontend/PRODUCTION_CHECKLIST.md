Frontend Production Checklist

- Ensure environment variables are configured in Vercel (API_URL, WS_URL, etc.)
- Run `npm run prebuild` (this is run automatically by `npm run build`)
- Confirm `public/images/slider/index.json` exists and contains slider images. The prebuild script will generate it by copying from the project root `images/` folder if found.
- Verify backend endpoints: `/api/*` are reachable from deployment domain and CORS is configured.
- Confirm `JWT` authentication for admin is working and refresh/expiry behavior is tested.
- Verify SMS / MoMo push workflows with staging credentials.
- Test QR validation and camera permissions on mobile devices.
- Run `npm run build` and validate output; enable gzip/brotli in hosting platform.

Deployment to Vercel
- Push `frontend` to GitHub and connect the repository to Vercel.
- In Vercel project settings set `Root Directory` to `frontend` (if monorepo), Build Command: `npm run build`, Output Directory: `dist`.
- Add environment variables from `.env.example` in Vercel dashboard using the same keys.

Backend Deployment
- Deploy backend to Render, Railway or Heroku and configure `VITE_API_URL` accordingly.
- Ensure CORS, HTTPS and JWT secret environment variables are configured.
