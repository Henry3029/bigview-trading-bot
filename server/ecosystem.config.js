module.exports = {
  apps: [
    {
      name: 'bigview-api',
      script: './dist/server.js', // Points to compiled JS
      cwd: '/home/ubuntu/bigview-trading-bot/server',
      env: {
        NODE_ENV: 'production',
        SERVER_PORT: 3002,
      },
    },
    {
      name: 'bigview-engine',
      script: './dist/AI.js', // Points to compiled AI engine
      cwd: '/home/ubuntu/bigview-trading-bot/server',
      env: {
        NODE_ENV: 'production',
      },
    }
  ]
};
