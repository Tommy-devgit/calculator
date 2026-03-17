const { spawn } = require('child_process')
const path = require('path')

const args = process.argv.slice(2)
const devUrlIndex = args.indexOf('--dev-url')
const devUrl = devUrlIndex >= 0 ? args[devUrlIndex + 1] : null

const electronPath = require('electron')
const appPath = path.join(__dirname, '..')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
if (devUrl) {
  env.VITE_DEV_SERVER_URL = devUrl
}

const child = spawn(electronPath, [appPath], {
  stdio: 'inherit',
  env,
})

child.on('close', (code) => {
  process.exit(code ?? 0)
})
