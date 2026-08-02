# LearnHub

Production-style online learning platform — **React** frontend + **Node.js/Express** backend + **MongoDB**.

## Quick start

### 1. MongoDB (optional for local dev)

If MongoDB is **not** installed, the API will use an **in-memory database** automatically and seed demo users on first start.

For persistent data, install [MongoDB](https://www.mongodb.com/try/download/community) or use [Atlas](https://www.mongodb.com/atlas), then set in `server/.env`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/learnhub
```

### 2. Install & seed

```bash
cd C:\Users\udayd\Learnhub
npm install
npm run seed
```

(`npm run seed:admin` works too — same as `seed`.)

### 3. Run

**Option A — one command (recommended)** from project root:

```bash
cd C:\Users\udayd\Learnhub
npm install
npm run dev
```

Starts API + React together. Wait for `LearnHub API http://localhost:5000` and `Local: http://localhost:5173/`.

**Option B — two terminals**

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

**Troubleshooting**

| Error | Fix |
|-------|-----|
| `ECONNREFUSED` on `/api/v1/...` | API not running — start `server` (see above) |
| `EADDRINUSE` port 5000 | Run `npm run kill-port -w server`, then `npm run dev` again |
| `Missing script: seed:admin` | Use `npm run seed` or `npm run seed:admin` from project root |
| `Cannot find module ... index.js` | Use `npm run dev` in `server/`, not `node index.js` |
| MongoDB `ECONNREFUSED :27017` | Start MongoDB, **or** restart API — dev mode uses in-memory DB automatically |

Run `npm run seed` once after MongoDB is connected.

- Frontend: http://localhost:5173  
- API: http://localhost:5000  

## Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Instructor | instructor@learnhub.com | Instructor@123 |
| Student | student@learnhub.com | Student@123 |

## Features

- Student: register, browse, free/paid enroll, video player, quiz, certificate
- Instructor: create courses, upload media, dashboard stats
- Admin: users, approve instructors, courses, orders/revenue
- Payments: Razorpay (optional — dev mode enrolls without keys)

## Folder structure

```
Learnhub/
├── client/     React + Vite + Tailwind
└── server/     Express 5 + Mongoose
```

## API reference

See [server/API.md](server/API.md) for all endpoints.

## Optional services

Add to `server/.env`:

- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
- `GOOGLE_CLIENT_ID` — Google sign-in backend verification
- `SMTP_USER` / `SMTP_PASS` — free Gmail SMTP password reset emails
- `OPENAI_API_KEY` — video quiz via Whisper + GPT (paid)
- `GEMINI_API_KEY` — **free** video quiz via [Google AI Studio](https://aistudio.google.com/apikey) (recommended for dev)

Add the same Google OAuth client id to `client/.env`:

```
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```
