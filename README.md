# Formula 1 Picks

A modern, full-stack web application for Formula 1 fans to make predictions, join leagues, and compete on the leaderboard.

This application is split into two main parts:
- **Frontend**: A React 19 single-page application (PWA support) built with Bun, Tailwind CSS, Shadcn UI, and Framer Motion. It is deployed via Cloudflare Workers.
- **Backend**: A REST API built with Bun, TypeScript, and Supabase. It includes scheduled cron jobs for race data sync.

---

## 🏎️ Features

- View upcoming races and driver standings.
- Make predictions for race weekends.
- Create and join private leagues with friends.
- Real-time leaderboard updates and scoring.
- In-app chat within leagues.
- Push notifications and PWA installability.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + React Router v7
- **Styling**: Tailwind CSS v4, Radix UI, Framer Motion
- **Tooling**: Bun for fast builds and dev server
- **Hosting**: Cloudflare Workers (`wrangler`)

### Backend
- **Runtime**: Bun
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (OTP and sessions)
- **Task Scheduling**: `node-cron` for automated data syncing

---

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

Ensure you have the following installed on your machine:
- [Bun](https://bun.sh/) (latest version recommended)
- A [Supabase](https://supabase.com/) project (for the database and auth)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/formula1-picks.git
cd formula1-picks
```

### 2. Backend Setup

Navigate to the backend directory and configure the environment:

```bash
cd backend
bun install
```

**Environment Variables:**
Create a `.env` file from the provided example:

```bash
cp .env.example .env
```
Fill in the `.env` file with your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
PORT=8080
```

**Run the Backend Server:**
```bash
bun dev
```
*The API will start on `http://localhost:8080` and will automatically seed initial race and driver data.*

### 3. Frontend Setup

Open a new terminal session and navigate to the frontend directory:

```bash
cd frontend
bun install
```

**Environment Variables:**
Create a `.env.local` file (or configure your `.env.development`):

```bash
echo "BUN_PUBLIC_API_URL=http://localhost:8080" > .env.local
```

**Run the Frontend Development Server:**
```bash
bun dev
```
*The application will be accessible at `http://localhost:3000` (or the port defined by Bun).*

---

## 📦 Deployment

### Backend
The backend is configured to be deployed via platforms like Railway or Render, utilizing the `railway.toml` and `railpack.json` files for zero-config deployments. Ensure environment variables (`SUPABASE_URL`, etc.) are securely added to your hosting provider.

### Frontend
The frontend is deployed to Cloudflare Workers using Wrangler.

1. Ensure you are authenticated with Cloudflare:
   ```bash
   bunx wrangler login
   ```
2. Deploy the application:
   ```bash
   bun run deploy
   ```
*(A staging environment is also available via `bun run deploy:staging`).*

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is proprietary.