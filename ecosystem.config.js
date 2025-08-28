module.exports = {
  apps: [
    {
      name: 'fieldwire',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/fieldwire',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
      error_file: '/var/log/fieldwire/err.log',
      out_file: '/var/log/fieldwire/out.log',
      log_file: '/var/log/fieldwire/combined.log',
      time: true,
    },
  ],
}
