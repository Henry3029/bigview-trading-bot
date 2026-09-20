module.exports = {
  apps: [
    {
      name: 'bigview-api',
      script: './server.ts',
      cwd: '/home/ubuntu/bigview-trading-bot/server',
      interpreter: 'node',
      interpreter_args: '--import tsx',
    },
    {
      name: 'bigview-engine',
      script: './AI.ts',
      cwd: '/home/ubuntu/bigview-trading-bot/server',
      interpreter: 'node',
      interpreter_args: '--import tsx',
    }
  ]
};
