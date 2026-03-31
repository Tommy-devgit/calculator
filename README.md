# Orbit Calculator

Professional desktop scientific calculator built with **React + Vite**, packaged with **Electron**.

> The app code lives in the `client/` directory.

## Quick start

```bash
cd client
npm install
npm run electron:dev
```

- Vite dev server: http://localhost:5175

## Scripts (run inside `client/`)

- `npm run dev` — run the web dev server (port 5175)
- `npm run electron:dev` — run Vite + Electron in development
- `npm run build` — build the web app to `client/dist/`
- `npm run electron:preview` — build then launch Electron against the built files
- `npm run electron:pack` — package the desktop app with electron-builder
- `npm run lint` — run ESLint

## Project structure

- `client/` — React/Vite UI + Electron main/preload + packaging config

## Notes

Electron loads the dev server in development using `VITE_DEV_SERVER_URL` (set by `client/scripts/run-electron.cjs`).