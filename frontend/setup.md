# Frontend Setup Guide

React + TypeScript frontend built with [Vite](https://vite.dev/).

## Prerequisites

- **Node.js** >= 18 (tested with v24.12.0)
- **npm** >= 9 (tested with v11.6.2)

## Getting Started

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (default: http://localhost:5173)
npm run dev
```

## Available Scripts

| Command             | Description                                          |
|---------------------|------------------------------------------------------|
| `npm run dev`       | Start the Vite dev server with HMR                   |
| `npm run build`     | Type-check with `tsc` then build for production      |
| `npm run preview`   | Serve the production build locally for testing        |
| `npm run lint`      | Run ESLint across the project                        |

## Project Structure

```
frontend/
├── public/              # Static assets served as-is
├── src/
│   ├── assets/          # Images, SVGs, and other importable assets
│   ├── App.tsx          # Root application component
│   ├── App.css          # App-level styles
│   ├── main.tsx         # Entry point — mounts React to the DOM
│   └── index.css        # Global styles
├── index.html           # HTML entry point (Vite injects scripts here)
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript project references
├── tsconfig.app.json    # TypeScript config for application code
├── tsconfig.node.json   # TypeScript config for Node/Vite config files
├── eslint.config.js     # ESLint flat config
└── package.json
```

## Key Dependencies

| Package                  | Version | Purpose                        |
|--------------------------|---------|--------------------------------|
| `react`                  | ^19.2   | UI library                     |
| `react-dom`              | ^19.2   | React DOM renderer             |
| `typescript`             | ~5.9    | Static type checking           |
| `vite`                   | ^8.0    | Build tool and dev server      |
| `@vitejs/plugin-react`   | ^6.0    | React Fast Refresh for Vite    |
| `eslint`                 | ^9.39   | Linting                        |

## Connecting to the Backend API

The FastAPI backend runs on `http://localhost:8000`. To proxy API requests during development, add a `server.proxy` entry to `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

With this proxy, fetch calls like `fetch('/api/plans')` in the frontend will be forwarded to the backend during development — no CORS configuration needed.

## Building for Production

```bash
npm run build
```

Output is written to `frontend/dist/`. Serve it with any static file server or via the backend.
