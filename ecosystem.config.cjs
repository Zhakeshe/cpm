module.exports = {
  apps: [
    {
      name: "kern-ftc-scrimmage",
      cwd: "/var/www/kern-ftc-scrimmage",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
