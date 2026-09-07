# INSTALLATION.md — Scholarship CRM

Full setup guide: local development, environment variables, and production deployment.

---

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 14+ (local install, or a managed instance — Render, Railway, Supabase, etc.)
- A Cloudinary account (free tier is enough) for document/receipt/avatar storage
- An SMTP account for sending emails (Gmail App Password works fine for development)

---

## 1. Clone & install

```bash
git clone <your-repo-url> scholarship-crm
cd scholarship-crm
```

## 2. Backend setup

```bash
cd backend
cp .env.example .env
npm install
```

### Fill in `backend/.env`

| Variable | Where to get it |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Your PostgreSQL instance |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Generate two long random strings, e.g. `openssl rand -hex 32` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Your email provider (Gmail: use an [App Password](https://myaccount.google.com/apppasswords), not your normal password) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | [Cloudinary Dashboard](https://cloudinary.com/console) → shown on the account home page |
| `CLOUDINARY_FOLDER` | Any name, e.g. `scholarship_crm` — the top-level Cloudinary folder all uploads are organized under |

### Create the database and run migrations

```bash
# create the database (adjust to your local Postgres setup)
createdb scholarship_crm_claude

npm run db:migrate     # creates all tables
npm run db:seed        # creates the default Super Admin account
```

### Start the backend

```bash
npm run dev
```

The API is now running at `http://localhost:5000/api/v1`. Verify with:
```bash
curl http://localhost:5000/api/v1/health
```

## 3. Frontend setup

```bash
cd ../client
cp .env.example .env
npm install
```

Set `VITE_API_URL=http://localhost:5000/api/v1` in `client/.env`. The frontend never talks to Cloudinary directly — all uploads go through the backend's `multipart/form-data` endpoints.

```bash
npm run dev
```

The app is now running at `http://localhost:5173`.

## 4. First login

```
Email:    admin@scholarshipcrm.com
Password: Admin@12345
```

**Change this password immediately** via Profile → Change Password.

---

## Production Deployment

### Backend → Render

1. Create a new **Web Service** on Render, point it at the `backend/` folder.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add all variables from `.env.example` in Render's environment settings — use Render's own managed PostgreSQL for `DB_*` if you provision one there, and set `DB_SSL=true`.
5. Run migrations once after first deploy: use Render's shell (`npm run db:migrate && npm run db:seed`).

### Frontend → Vercel

1. Import the `client/` folder as a new Vercel project.
2. Framework preset: **Vite**.
3. Set `VITE_API_URL` to your deployed Render backend URL (e.g. `https://your-app.onrender.com/api/v1`).
4. Vercel auto-detects the build command (`npm run build`) and output directory (`dist`) — `vercel.json` already includes the SPA rewrite rule so client-side routing works on refresh.

### Database → managed PostgreSQL

Any managed Postgres works (Render, Railway, Supabase, Neon). Set `DB_SSL=true` in the backend's environment for managed providers that require SSL.

### Post-deploy checklist

- [ ] `GET /api/v1/health` returns `"database": "connected"`
- [ ] Default Super Admin password has been changed
- [ ] CORS `CLIENT_URL` in backend `.env` matches your deployed frontend URL exactly
- [ ] Cloudinary upload folder (`CLOUDINARY_FOLDER`) is set and reachable — test by uploading a document after deploy
- [ ] SMTP is verified (check backend logs on boot for "SMTP transporter is ready")
