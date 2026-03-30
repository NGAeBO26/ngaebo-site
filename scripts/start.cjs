// scripts/start.cjs
const { spawn } = require('child_process');

const port = process.env.PORT || '8080';
const args = ['serve', '-s', 'dist', '-l', port];
const child = spawn('npx', args, { stdio: 'inherit', shell: true });

child.on('exit', (code) => process.exit(code));
child.on('error', (err) => {
  console.error('Failed to start serve:', err);
  process.exit(1);
});