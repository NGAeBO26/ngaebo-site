// scripts/start.js
const { spawn } = require('child_process');

const port = process.env.PORT || '8080';
const args = ['serve', '-s', 'dist', '-l', port];

// Use shell: true only if you need npx resolution on some environments.
// Here we call npx directly so use shell: true to ensure npx is found.
const child = spawn(`npx`, args, { stdio: 'inherit', shell: true });

child.on('exit', (code) => process.exit(code));
child.on('error', (err) => {
  console.error('Failed to start serve:', err);
  process.exit(1);
});
