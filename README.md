# EdTech CRM & Inquiry System

A full-stack CRM inquiry system: anyone can submit a public inquiry form; an admin logs in to view, filter, search and manage all inquiries.

- **Frontend:** React (Vite) + React Router
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL) via the `pg` driver and a standard connection string
- **Auth:** custom JWT auth built from scratch (bcrypt password hashing, `jsonwebtoken`, protected-route middleware). Supabase Auth is **not** used.

```
.
├── schema.sql            # tables: admins, inquiries
├── .env.example          # combined sample of all env vars
├── backend/              # Express API
│   ├── .env.example
│   └── src/ (server.js, db.js, seedAdmin.js, middleware/auth.js, routes/)
└── frontend/             # React app
    ├── .env.example
    └── src/ (App.jsx, api.js, pages/)
```

## Features

- Public form: User Type (Parent / Student / School), Category (Scholarship / Concert / Admission / General Query), Name, Email, Phone, Message. Validated on client and server, saved to Supabase.
- Admin login (JWT) and a protected dashboard.
- Table with Name, Phone, Email, User Type, Category, Date, Status (click a row to read the message; change status inline: New / In Progress / Resolved).
- Filters by Category, User Type (and Status), search by Name or Phone, pagination.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `schema.sql`, and run it.
3. Go to **Project Settings → Database → Connection string → URI** and copy it (replace `[YOUR-PASSWORD]`). If your network is IPv4-only, use the **Session pooler** string.

## 2. Run the backend

```bash
cd backend
cp .env.example .env      # then edit .env
npm install
npm run seed              # creates the admin user from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev               # http://localhost:5000
```

Environment variables (`backend/.env`):

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Long random string for signing tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `8h` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials created by `npm run seed` (min 8 chars) |
| `PORT` | API port (default 5000) |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated |

## 3. Run the frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm install
npm run dev               # http://localhost:5173
```

- Public form: `http://localhost:5173/`
- Admin login: `http://localhost:5173/admin/login`

## 4. How to test the custom JWT auth

With the backend running (replace email/password with your seeded admin):

```bash
# 1) Protected route WITHOUT a token -> 401
curl -i http://localhost:5000/api/inquiries

# 2) Wrong password -> 401
curl -i -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"wrong"}'

# 3) Login -> returns { token, admin }
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe@123"}'

# 4) Use the token -> 200 with inquiries
curl "http://localhost:5000/api/inquiries?category=Scholarship&user_type=Parent&search=ravi" \
  -H "Authorization: Bearer <TOKEN>"

# 5) Tampered / expired token -> 401
curl -i http://localhost:5000/api/inquiries -H "Authorization: Bearer abc.def.ghi"
```

In the UI: visiting `/admin` while logged out redirects to `/admin/login`; after login the dashboard loads, and **Logout** clears the token.

### API summary

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/inquiries` | Public | Submit an inquiry |
| POST | `/api/auth/login` | Public | Admin login, returns JWT |
| GET | `/api/auth/me` | Admin | Validate token |
| GET | `/api/inquiries` | Admin | List with `category`, `user_type`, `status`, `search`, `page`, `limit` |
| PATCH | `/api/inquiries/:id/status` | Admin | Update status |

## 5. Deployment

**Backend (Render):** New Web Service → root directory `backend` → build `npm install` → start `npm start`. Add env vars from the table above (set `CORS_ORIGIN` to your frontend URL). Run `npm run seed` once locally against the same `DATABASE_URL`, or from the Render shell.

**Frontend (Vercel or Netlify):** root directory `frontend`, build `npm run build`, output `dist`. Set `VITE_API_URL` to your deployed backend URL. `vercel.json` handles SPA routing (for Netlify add a `_redirects` file: `/* /index.html 200`).

## Security notes

- Passwords hashed with bcrypt (cost 12); login is rate-limited and constant-time for unknown emails.
- All SQL uses parameterised queries; search input has LIKE wildcards escaped.
- Row Level Security is enabled on both tables so they are not exposed via Supabase's public REST API; the backend connects with the database connection string.
- Never commit `.env`.
