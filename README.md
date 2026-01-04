# RYVEX Frontend (MVP)

Vite + React + TypeScript + Tailwind authentication and home screens (mocked).


## Environment setup

Copy `.env.example` to `.env` and set your API URL:

```bash
cp .env.example .env
# Edit .env if needed
```

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Key Features

- **Auth**: Login/Sign-up on one screen with Google (mocked) and email/password
- **Protected Routes**: `/home` redirects to `/login` if not authenticated
- **State Management**: Zustand with localStorage persistence
- **Styling**: Tailwind CSS with dark theme and mobile-first design

## Project Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── LoginPage.tsx      # Combined login/sign-up UI
│   │   ├── auth.store.ts      # Zustand auth store (persisted)
│   │   ├── auth.service.ts    # Mocked auth API calls
│   │   └── auth.types.ts      # Auth type definitions
│   └── home/
│       └── HomePage.tsx       # Basic home screen with mocked data
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Divider.tsx
│   ├── Header.tsx
│   └── BottomNav.tsx
├── App.tsx                    # Routing and protected routes
├── main.tsx                   # App entry point
└── index.css                  # Tailwind imports and global styles
```

## Test Login

Use any email and password (min 4 chars) or click "Continue with Google" (mocked).
