module.exports = {
  apps: [{
    name: 'valbrief-backend',
    cwd: '/root/ValBrief/backend',
    script: 'src/index.ts',
    interpreter: 'ts-node',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    restart_delay: 3000,
    max_restarts: 10,
  }],
}
