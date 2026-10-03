module.exports = {
  apps: [
    {
      name: 'bigview-api',
      script: './dist/server.js',
      cwd: '/home/ubuntu/bigview-trading-bot/server',
      node_args: '-r tsconfig-paths/register',
      env: {
        NODE_ENV: 'production',
        SERVER_PORT: 3002,
        PORT: 3002,
        TS_NODE_BASEURL: './dist'
      },
    },
    {
      name: 'bigview-engine',
      script: './dist/AI.js',
      cwd: '/home/ubuntu/bigview-trading-bot/server',
      node_args: '-r tsconfig-paths/register',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        TS_NODE_BASEURL: './dist'
      },
    }
  ]
};
