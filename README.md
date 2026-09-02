# Higgsfield AI

A full-stack application for creating custom AI avatars and generating avatar-based videos. Users can sign up, upload a reference image to build a multi-angle avatar profile, and generate videos of that avatar from a text prompt.

Built as a monorepo using Turborepo, with a Bun/Express backend and a React frontend.

## Features

- **User authentication** — sign up and sign in with JWT-based sessions
- **Avatar creation** — upload an image to automatically generate left, right, and front profile shots of an avatar
- **AI video generation** — generate videos of an avatar from a text prompt
- **Dashboard** — central place to view and manage avatars and videos

## Tech Stack

**Frontend**
- React 19 + React Router
- TanStack Query
- Tailwind CSS
- Radix UI components
- Bun (dev server & bundler)

**Backend**
- Bun + Express
- Prisma ORM with PostgreSQL
- JWT authentication (jsonwebtoken, bcrypt)
- Google GenAI SDK for image/video generation

**Tooling**
- Turborepo (monorepo build orchestration)
- TypeScript throughout
- ESLint (shared config package)

## Project Structure

```
turboHiggsfieldAI/
├── apps/
│   ├── backend/          # Express API server
│   │   ├── index.ts      # Route definitions
│   │   ├── image.ts      # Avatar image generation
│   │   ├── video.ts      # Video generation
│   │   ├── middleware/   # Auth middleware
│   │   └── prisma/       # Database schema & client
│   └── frontend/         # React application
│       └── src/
│           ├── pages/    # Landing, Signin, Signup, Dashboard, VideoCreator
│           └── components/
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── eslint-config/       # Shared lint rules
│   └── typescript-config/   # Shared TS config
└── turbo.json
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.3+
- Node.js v24+
- PostgreSQL database

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Senku24/Higgsfield_AI.git
   cd Higgsfield_AI/turboHiggsfieldAI
   ```

2. Install dependencies
   ```bash
   bun install
   ```

3. Set up environment variables

   Create a `.env` file inside `apps/backend/` with:
   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret
   GOOGLE_GENAI_API_KEY=your_google_genai_api_key
   ```

4. Run database migrations
   ```bash
   cd apps/backend
   npx prisma migrate dev
   ```

5. Start the development servers (from the repo root)
   ```bash
   bun run dev
   ```

The frontend and backend will start via Turborepo's dev pipeline. The backend runs on port `3000`.

## API Endpoints

| Method | Endpoint                  | Description                          |
|--------|----------------------------|---------------------------------------|
| POST   | `/api/v1/signup`           | Register a new user                   |
| POST   | `/api/v1/signin`           | Log in and receive a JWT              |
| POST   | `/api/v1/avatar`           | Create an avatar from an uploaded image |
| GET    | `/api/v1/avatars`          | List avatars                          |
| GET    | `/api/v1/avatar/:avatarId` | Get a specific avatar                 |
| POST   | `/api/v1/video`            | Generate a video from a prompt        |
| GET    | `/api/v1/videos`           | List generated videos                 |
| GET    | `/api/v1/video/:videoId`   | Get a specific video                  |
| GET    | `/api/v1/me`               | Get the current authenticated user    |

## Pages

- **Landing** — marketing/entry page
- **Sign Up / Sign In** — authentication pages
- **Dashboard** — overview of avatars and videos
- **Video Creator** — interface for generating avatar videos

## Screenshots

### Landing Page
<img width="1465" height="663" alt="Screenshot 2026-09-02 at 6 26 12 AM" src="https://github.com/user-attachments/assets/4f9ee65f-ba93-428e-8fb9-7d445740a729" />


### Sign Up / Sign In
<img width="1469" height="828" alt="Screenshot 2026-09-02 at 6 27 30 AM" src="https://github.com/user-attachments/assets/7ffa2ecb-e200-41fc-a63a-a7e55956d717" />


### Dashboard

<img width="1468" height="757" alt="Screenshot 2026-09-02 at 6 26 36 AM" src="https://github.com/user-attachments/assets/a2889ef0-06fd-4a70-acc1-5fe9c3ad541f" />

### Video Creator
<img width="1459" height="728" alt="Screenshot 2026-09-02 at 6 27 07 AM" src="https://github.com/user-attachments/assets/b1c611e3-9c39-48bd-82e9-e4c63a0cc967" />


## Scripts

| Command             | Description                          |
|----------------------|--------------------------------------|
| `bun run dev`        | Start all apps in development mode   |
| `bun run build`      | Build all apps                       |
| `bun run lint`       | Lint all packages                    |
| `bun run check-types`| Run TypeScript checks                |
| `bun run format`     | Format code with Prettier            |

