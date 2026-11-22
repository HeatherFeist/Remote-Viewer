# Always Present Remote Viewer: Product & Build Plan

Status: **draft for review.** Prices, tier limits and timings below are placeholders to confirm. Nothing in this plan is built yet except the free memorial app and the premium restyle.

## 1. Goal

Let a family or funeral director host a memorial service that people can attend from anywhere, with:

- a **live video feed** (open source: LiveKit)
- **guest speakers who book time slots**
- a **large-screen "Hall display"** for the room
- guest **photo and voice-clip uploads**
- **consented recordings** of each speaker
- a **downloadable memorial package** with an auto-built slideshow

Customers pay **once per memorial** through Stripe Checkout. No monthly subscription.

## 2. Tiers (placeholder prices)

| | **Free** | **Gathering** | **Service** | **Celebration** | **Full Package** |
|---|---|---|---|---|---|
| Price (one-time) | $0 | $29 | $79 | $149 | **$399** |
| Live service | External link (Jitsi / Zoom / Teams / Meet) | Built-in live video | Built-in | Built-in | Built-in |
| Hall display (TV mode) | No | Yes | Yes | Yes | Yes |
| Guest speaker window | none | 30 min (5 slots) | 60 min (10 slots) | 2 hr (20 slots) | 4 hr (40 slots) |
| Max viewers | n/a | 25 | 100 | 300 | 500 |
| Photo uploads | Existing (small) | 50 | 200 | 500 | Unlimited (fair use) |
| Voice-clip uploads | No | No | Yes | Yes | Yes |
| Speaker recording | No | No | No | Optional add-on | Included |
| Slideshow + download package | No | No | Basic | Yes | Yes |
| Kept for | 30 days | 1 year | 1 year | Forever | Forever |

**Slot sizing.** A tribute is typically 3-5 minutes (about 400-700 words). One slot is the host's chosen speaking length (3, 5 or 10 min) plus a 1-minute changeover, so 5 min speaking = 6 min per slot. Viewings are drop-in events, so the speaker window is a dedicated tribute segment inside the event, not the whole 4 hours. Slot length is configurable. The slot count follows from the tier's window.

> **To confirm with the client:** slot lengths, prices, viewer caps, retention periods, and which tiers include recording.

## 3. Features

### 3.1 Host and guest model (no guest logins)
- Today the private link is the credential. Keep that for guests.
- Add a **separate secret host link** (and optional email magic-link login) for managing slots, payments, approvals and downloads.
- Guests join with the guest link. They can claim a speaker slot, upload, and post messages without an account.

### 3.2 Guest speaker slots
- The host sets the service start time, speaker window and slot length. The system lays out the slots.
- Guests open "Speak at this service", enter their name and relationship, tick a recording-consent box, and claim a slot.
- The host can approve, reorder or remove speakers.
- The server enforces the tier's slot cap, so editing the page cannot unlock more slots.

### 3.3 Live video (LiveKit)
- Open source (Apache 2.0). Start with **LiveKit Cloud's free tier**, and consider self-hosting later if costs matter.
- A Supabase Edge Function issues short-lived LiveKit access tokens.
- Permissions: the host always has publish rights, the speaker whose slot is active gets publish rights, and everyone else is view-only. The host can mute or remove a speaker at any time.
- Device cameras and microphones are used directly in the browser (`getUserMedia`, which needs HTTPS and is already satisfied).

### 3.4 Hall display (large screen)
- A page such as `/hall/<code>` for a TV or projector: the current speaker full-screen, a name and relationship caption, a countdown timer with a 1-minute warning, and an "up next" list.
- It can run from a laptop over HDMI, from a smart TV browser, or cast from a browser tab (Chromecast / AirPlay).
- Runs **muted by default** to avoid feedback. Room audio should come from the venue's own sound system.
- Includes a pre-service checklist (internet, audio test, camera test).

### 3.5 Uploads
- Guests upload photos and short voice clips through the memorial link into a **private bucket**.
- Hosts **approve each item** before it appears.
- Size and count limits are enforced per tier, on the server.

### 3.6 Recording and consent
- Each speaker slot can be recorded as its own labeled clip (for example `Aunt-Carol-3-42pm`), plus an optional full-event recording.
- Only speakers who ticked the consent box are recorded and included.
- The host confirms they have permission to record the event.
- The page states clearly that the event is being recorded.
- Hosts can delete the recording, and a speaker can request removal of their clip.
- Recording laws vary by state and country. **Have a lawyer review the consent wording before launch.**

### 3.7 Storage options chosen at registration

| Option | What it means | Notes |
|---|---|---|
| **Save to this laptop** | The host's browser records to a chosen folder (File System Access API, Chrome/Edge on a laptop). A folder inside synced OneDrive or Google Drive uploads automatically. | No storage cost, private. The laptop must stay on and awake. Saves in small chunks so a crash does not lose everything. Recording quality is whatever the laptop receives. |
| **My Google Drive / My OneDrive** | OAuth sign-in with the narrowest scope. The app writes only to a folder it creates. | Needs app registration with Google (and possibly a review) and Microsoft. Build after the basics. |
| **Keep it for me** | App-managed private bucket (Cloudflare R2 or Supabase Storage). The host gets a download link and a login. | Costs us storage. Easiest for families. Files kept per the tier's retention. |

**Not offered:** creating new Microsoft accounts for customers. Personal accounts cannot be created through an API, automating sign-up breaks Microsoft's terms, and Microsoft 365 licences per customer would be costly. "Keep it for me" replaces it.

### 3.8 Memorial package
- A ZIP containing: approved photos, guest messages and tributes, voice clips, consented speaker clips (MP4/WebM), and a **self-contained offline `index.html` slideshow** that plays them in order with captions.
- Optional later: send to Google Drive and generate a **Google Slides** deck through the Slides API.
- Not possible: triggering Google Photos' own automatic memorial movies, because there is no public API for that. A rendered video slideshow (transitions, music) is a larger later project.

## 4. Payments (Stripe, one-time per memorial)

1. The host picks a tier on their host page.
2. A Supabase Edge Function creates a **Stripe Checkout session**. The card is entered on Stripe's hosted page, so no card data touches the app.
3. A second Edge Function receives the **Stripe webhook**, verifies its signature, and marks the memorial as paid (`plan`, `slot_limit`, `viewer_limit`, `paid_at`).
4. Limits are enforced in the database functions and Edge Functions, never only in the UI.
5. Receipts come from Stripe. Refunds are handled in the Stripe dashboard.
6. Build and test everything in **Stripe test mode** first.
7. Sales tax / VAT: consider Stripe Tax and ask an accountant.

## 5. Security and privacy

- Secrets (Stripe secret key, webhook secret, LiveKit API secret, any OAuth client secrets) live only in **Supabase Edge Function secrets and Cloudflare secrets**. Never in `VITE_` variables or the repo.
- The Supabase **anon key is public by design**. Protection comes from row-level security and the database functions.
- Memorial content is sensitive. Media goes in **private** storage and is shared through **expiring signed links**, never public URLs.
- The private link remains a bearer credential: anyone with it can view and contribute. The host link is separate and must be kept private.
- Add rate limiting and basic abuse protection on uploads and slot claims before public launch.

## 6. Cost model to estimate before pricing

- LiveKit streaming minutes (free tier first).
- Cloud recording and storage, only if we offer the "Keep it for me" option.
- Stripe fees (about 2.9% + 30 cents per payment).
- Supabase and Cloudflare usage at expected volume.

With laptop-local recording the main cost is LiveKit streaming, so margin at $399 should be healthy. Re-check once real usage data exists.

## 7. Build order

1. **Foundations**: finish the Cloudflare deploy, the domain, and the Supabase setup. Add the host link and host dashboard.
2. **Tiers and Stripe checkout** (test mode), including webhook and server-side limits.
3. **Speaker slots** and the **Hall display**, initially on the existing Jitsi link.
4. **Live video with LiveKit**: token function, room pages, speaking permissions.
5. **Uploads** with approval and limits.
6. **Recording with consent**, laptop-local first.
7. **Memorial package**: ZIP plus offline slideshow.
8. **Optional**: Google Drive / OneDrive connect, Google Slides export, cloud recording backup.

## 8. What the owner needs to do

- [ ] Merge the fix branch so Cloudflare deploys, and confirm a green deploy.
- [ ] Move the `remoteviewr.com` nameservers to Cloudflare and attach the domain to the Worker.
- [ ] Run the migration in Supabase and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Cloudflare.
- [ ] Create a **Stripe** account and stay in test mode.
- [ ] Create a **LiveKit Cloud** project (URL, API key, API secret).
- [ ] Confirm the tier table in section 2.
- [ ] Have a lawyer review the recording-consent wording.

## 9. Open questions

1. Final prices, slot lengths, viewer caps and retention per tier.
2. Which tiers include recording, and for how long recordings are kept.
3. Will hosts mostly be funeral directors (laptop, Chrome) or families (any device)? This decides how much we lean on laptop-local recording versus cloud storage.
4. Should uploads appear instantly or only after host approval? Recommended: approval first.
5. Is the Full Package at $399 the right top price after costs are known?
