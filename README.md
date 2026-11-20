# Always Present Remote Viewer

Standalone memorial service viewer extracted from `HeatherFeist/w3bbsite` branch `cursor/remote-viewing-a169`.

## Run locally

```sh
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase settings, the app runs in local-preview mode and memorial data is saved only in the current browser. For shared memorial links and cross-device memories, configure Supabase as described below.

## Supabase setup for shared memorials

1. Create or select a Supabase project.
2. In the Supabase SQL editor, run [`supabase/migrations/20261119000000_remote_viewing.sql`](supabase/migrations/20261119000000_remote_viewing.sql).
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` for local development and as build environment variables in Cloudflare Pages.
4. Use only the Supabase **anon/public** key in the frontend. Never put a `service_role` key in a `VITE_` variable or commit it.

The migration exposes memorial read/write functions to anonymous visitors using the high-entropy private link code as a bearer credential. Anyone who has a memorial link can read and add memories to that memorial. Keep links private. Add moderation/rate limiting and stronger host authorization before using this for sensitive or high-volume events.

## Deploy to Cloudflare Pages

1. In Cloudflare, go to **Workers & Pages → Create → Pages → Connect to Git** and select `HeatherFeist/Remote-Viewer`.
2. Select the `transfer/remote-viewer` branch while it is being prepared; after merging the finished work, use `main`.
3. Set build command to `npm run build` and build output directory to `dist`. The project is a Vite static site; no server or secret is required for the frontend.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under the Pages project's environment variables, for both Production and Preview if desired, then trigger a new deployment.
5. In **Custom domains**, add `remoteviewr.com` and follow Cloudflare's DNS instructions. Add `www.remoteviewr.com` too only if you want that hostname; configure a redirect to the apex separately if desired.

`public/_redirects` contains the SPA fallback so direct links such as `/viewing/<code>` work on refresh. Cloudflare Pages normally supports this file as-is.

## Current limitations

- Paid plan prices are not offered in this standalone version; checkout is not implemented.
- Jitsi is embedded; Zoom, Teams, and Meet open their supplied HTTPS URL in a new tab.
- Photo uploads are resized in the browser and stored with the memorial record. For production at scale, move media to object storage.
