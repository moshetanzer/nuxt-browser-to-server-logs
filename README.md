
# Nuxt Browser-to-Server Logs
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A handy Nuxt module to forward browser console logs to server terminal — ideal for debugging with AI terminal agents (e.g., claude code etc).

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

<!-- Highlight some of the features your module provide here -->
- Captures console.log, warn, error, and info
- Sends logs only in the browser and in development mode
- Filters out SSR-related logs automatically
- Handles uncaught errors and promise rejections

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add nuxt-browser-to-server-logs
```

You're all set — logs from the browser will now stream into your server terminal! 🎉

## Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
  ```

</details>


<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-browser-to-server-logs/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-browser-to-server-logs

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-browser-to-server-logs.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-browser-to-server-logs

[license-src]: https://img.shields.io/npm/l/nuxt-browser-to-server-logs.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-browser-to-server-logs

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
