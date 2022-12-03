module.exports = {
  apps: [
    {
      name: 'CraBack',
      exec_mode: 'cluster',
      instances: 'max', // Or a number of instances
      script: '/usr/bin/npm',
      args: 'run start'
    }
  ]
}
