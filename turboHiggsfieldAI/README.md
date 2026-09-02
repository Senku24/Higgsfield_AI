# Higgsfield

Avatar and video generation platform. Create personalized avatars from selfies and generate videos with them.

## Tech Stack

- **Monorepo**: Turborepo + Bun workspaces
- **Backend**: Express 5, Prisma 8 (PostgreSQL), BullMQ (Redis)
- **Frontend**: React 19, TanStack Query, Tailwind CSS, Radix UI
- **Storage**: AWS S3

## Project Structure

```
turboHiggsfieldAI/
├── apps/
│   ├── backend/       # Express API server
│   └── frontend/      # React SPA
└── packages/
    └── config/        # Shared config (credit costs, etc.)
```

## Prerequisites

- [Bun](https://bun.sh) >= 1.3.13
- PostgreSQL database
- Redis (optional, for background job queues)

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` with your values:

| Variable | Description |
|---|---|
| `DATABASE_URL_UNPOOLED` | PostgreSQL connection string |
| `JWT_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `OPENAI_API_KEY` | OpenAI API key (content moderation) |
| `GOOGLE_GENAI_API_KEY` | Google Gemini API key (avatar generation) |
| `OPENROUTER_API_KEY` | OpenRouter API key (video generation) |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | AWS region |
| `AWS_S3_BUCKET` | S3 bucket name |
| `REDIS_URL` | Redis connection URL |
| `FRONTEND_URL` | Frontend origin for CORS |

### 3. Setup database

```bash
cd apps/backend
bunx prisma db push
```

## Running

### Both apps (from root)

```bash
bun run dev
```

### Individual apps

**Backend** (port 3000):
```bash
cd apps/backend
bun run dev
```

**Frontend** (port 5173):
```bash
cd apps/frontend
PORT=5173 bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/signup` | No | Create account |
| POST | `/api/v1/signin` | No | Sign in |
| POST | `/api/v1/refresh` | No | Refresh access token |
| GET | `/api/v1/me` | Yes | Current user + credit balance |
| POST | `/api/v1/avatar` | Yes | Create avatar |
| GET | `/api/v1/avatars` | Yes | List avatars |
| GET | `/api/v1/avatar/:id` | Yes | Get avatar details |
| POST | `/api/v1/video` | Yes | Create video |
| GET | `/api/v1/videos` | Yes | List videos |
| GET | `/api/v1/video/:id` | Yes | Get video details |

## Credits System

- Sign up: **50 credits**
- Avatar generation: **10 credits**
- Video generation: **35 credits**

## License

MIT
