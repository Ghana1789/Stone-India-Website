import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const spawnOptions = {
  stdio: 'inherit',
  shell: false,
  env: { ...process.env, USE_MOCK: 'false' }
};

console.log('🚀 Starting Stone India Multi-Role Portal...');

// 🛠 PATH FIX: Resolve vendor scripts directly
// This bypasses the broken .cmd shell wrappers that break at the "&" in the path on Windows.
const viteBin = path.resolve(__dirname, 'client/node_modules/vite/bin/vite.js');
const nodemonBin = path.resolve(__dirname, 'server/node_modules/nodemon/bin/nodemon.js');

// Start Backend
const server = spawn(process.execPath, [nodemonBin, 'server.js'], { 
  ...spawnOptions, 
  cwd: path.resolve(__dirname, 'server')
});

// Start Frontend
const client = spawn(process.execPath, [viteBin], { 
  ...spawnOptions, 
  cwd: path.resolve(__dirname, 'client')
});

server.on('error', (err) => console.error('Failed to start server:', err));
client.on('error', (err) => console.error('Failed to start client:', err));

process.on('SIGINT', () => {
  server.kill();
  client.kill();
  process.exit();
});
