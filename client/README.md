# Orbit Calculator

Desktop-style calculator built with React + Vite, packaged with Electron.

## Features
- Basic ops: `+ - * /`
- `AC` clear, `Backspace` delete
- Percent and sign toggle
- Keyboard support
- Desktop packaging via Electron

## Development
Install dependencies:
```powershell
npm.cmd --prefix d:\Code\calculator\client install
```

Run the web dev server:
```powershell
npm.cmd --prefix d:\Code\calculator\client run dev
```

Run Electron in dev mode:
```powershell
npm.cmd --prefix d:\Code\calculator\client run electron:dev
```

## Build
Build the production web app:
```powershell
npm.cmd --prefix d:\Code\calculator\client run build
```

Package the desktop app:
```powershell
npm.cmd --prefix d:\Code\calculator\client run electron:pack
```

Artifacts are written under `client/dist`.

## Keyboard shortcuts
- Digits: `0-9`
- Operators: `+ - * /`
- Decimal: `.`
- Evaluate: `Enter` or `=`
- Clear: `Esc`
- Delete: `Backspace`
- Percent: `%`

## Troubleshooting
If `npm install` fails with `EBUSY` on `node_modules\electron`, close any running Electron/Vite process and delete `client/node_modules/electron`, then re-run install.
