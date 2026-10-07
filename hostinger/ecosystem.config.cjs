module.exports = {
  apps: [
    {
      name: 'callnotify-backend',
      script: 'backend/src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        JWT_SECRET: 'change_this_to_your_secure_secret_key_2026'
      }
    }
  ]
};
