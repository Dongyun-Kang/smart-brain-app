module.exports = {
  apps : [{
    name: 'app',
    cwd: '.',
    script: 'npm',
    args: 'start',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
