import { defineNuxtModule, addPlugin, createResolver, addServerHandler } from '@nuxt/kit'

export type ModuleOptions = object

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'browser-to-server-logs',
    configKey: 'browserToServerLogs',
  },
  defaults: {},
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url)

    addPlugin(resolver.resolve('./runtime/plugin'))

    addServerHandler({
      route: '/api/_browser-to-client-logs',
      handler: resolver.resolve('./runtime/server/api/_browser-to-client-logs/index.post'),
    })
  },
})
