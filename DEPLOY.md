# Deploying a live demo link (for sharing with Valentin)

Two ways to put this in front of someone:

- **A) Send the downloadable report** — run a check in the app, click **Download report**, get a self-contained `.html` file. Attach it to an email / Slack / LinkedIn DM. Opens in any browser, prints to PDF. Zero infrastructure. *This is the safest, lowest-friction option and needs nothing below.*
- **B) Deploy a live link** — host the app so Valentin clicks a URL and runs checks himself. Steps below.

---

## B) Deploy to Vercel (recommended host for Next.js)

### 1. Get the code into a Git repo
The app lives in `Cortea/POC`. Two options:

**Option 1 — point Vercel at a subfolder (keep one repo for everything):**
```bash
cd "Cortea"            # the parent folder
git init
git add .
git commit -m "Cortea research + Audit Quality Agent POC"
# push to a new GitHub repo, then in Vercel set Root Directory = POC
```

**Option 2 — deploy just the POC:**
```bash
cd "Cortea/POC"
git init
git add .
git commit -m "Audit Quality Agent POC"
# push to a new GitHub repo; Root Directory stays default
```

### 2. Import into Vercel
1. vercel.com → **Add New… → Project** → import the GitHub repo.
2. **Framework preset:** Next.js (auto-detected).
3. **Root Directory:** set to `POC` if you used Option 1; leave default for Option 2.
4. **Environment Variables:** add `ANTHROPIC_API_KEY = sk-ant-...` (and optionally `CORTEA_POC_MODEL`). This is a **server-side secret** — it is never exposed to the browser because the model call runs only in the `/api/check` route.
5. **Deploy.**

You'll get a URL like `https://cortea-poc.vercel.app`.

### 3. Function timeout
The check route sets `maxDuration = 60` (the Vercel **Hobby** ceiling). A single-statement check fits comfortably. On **Pro** you can raise it to `300` in `app/api/check/route.ts` if you later batch multiple statements.

### CLI alternative
```bash
npm i -g vercel
cd "Cortea/POC"
vercel            # first run links/creates the project
vercel env add ANTHROPIC_API_KEY     # paste the key
vercel --prod
```

---

## ⚠️ Before you share a live URL — protect your API key spend
A public URL means **anyone who has it can run checks and spend your Anthropic credits.** Pick one:

- **Best:** enable Vercel **Deployment Protection → Password Protection** (Project → Settings → Deployment Protection). Requires a Vercel **Pro** plan. Share the password with Valentin only.
- **Free & pragmatic:** treat the URL as unlisted — share it privately with one person, and **rotate the `ANTHROPIC_API_KEY` afterwards** (or set a low spend cap on that key in the Anthropic Console). Fine for a one-person demo.
- The sample statements are bundled in the app, so there's no document upload surface to abuse — only the model-call cost.

---

## Recommendation for this use case
Lead with **the downloadable report (A)** — it's the thing Valentin can read in 30 seconds without setup, and it carries the methodology footer that shows the product thinking. Offer the **live link (B)** as a "want to try it yourself?" follow-up if he's interested.
