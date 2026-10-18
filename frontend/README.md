# VoltFlow Frontend

React + TypeScript single-page application for the VoltFlow EV charging and energy management platform.

## Requirements
- Node.js 20 or newer
- npm

## Local development
From this directory:

```bash
npm ci
npm run dev
```

The Vite development server prints the local URL (normally `http://localhost:5173`). The API defaults to `http://localhost:8080/api`; override it at build time with `VITE_API_BASE_URL` when needed.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

`npm run build` performs TypeScript project checks before generating production assets.

## Docker
From the repository root, use `docker compose up --build`. The frontend Dockerfile injects `VITE_API_BASE_URL` at build time; setting it only in the running container does not change already-built Vite assets.

## Authentication note
The current client stores the JWT in `localStorage`, which is convenient for a student/demo project but is exposed to JavaScript running in the page. Preventing XSS and considering secure, HttpOnly cookies are important before any production deployment.
