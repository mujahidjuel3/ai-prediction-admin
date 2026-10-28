# Academic Sentinel Admin

Next.js administration frontend for Academic Sentinel.

## Local development

Copy `.env.example` to `.env.local`, then run `npm install` and `npm run dev`. `NEXT_PUBLIC_API_BASE_URL` is the full API base URL, including `/api/v1`; the local example points to `http://localhost:4000/api/v1`.

Production uses `https://api.academicsentinel.live/api/v1`. Set the variable in the Vercel Production environment and redeploy for the value to be included in the Next.js build.

## Checks

Run `npm run lint`, `npm run typecheck`, and `npm run build`.
