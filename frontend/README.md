# Frontend - React + TypeScript + Vite

React frontend for the Task Breakdown application.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update the API URL if your backend is running on a different port:
```
VITE_API_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client and endpoints
│   │   ├── client.ts     # Axios setup
│   │   └── tasks.ts      # Task API calls
│   ├── components/       # React components
│   │   ├── TaskInput.tsx
│   │   ├── MicroGoalCard.tsx
│   │   └── MicroGoalsList.tsx
│   ├── hooks/            # Custom React hooks
│   │   └── useTasks.ts   # Task management hook
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   └── time.ts       # Time formatting
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── package.json
└── vite.config.ts
```

## Features

### Task Input
- Enter all your daily tasks in a single text area
- Submit to AI for breakdown into micro-goals

### Micro-Goals Review
- View AI-generated micro-goals
- Edit task titles, descriptions, and time estimates
- Delete unwanted micro-goals
- See total estimated time

### Confirmation
- Save edited micro-goals to database
- Start over with new tasks

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Query** - Server state management
- **Axios** - HTTP client

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
