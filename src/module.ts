import { defineNuxtModule, addPlugin, createResolver, addServerHandler } from '@nuxt/kit'

export type ModuleOptions = object

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'browser-to-server-logs',
    configKey: 'browserToServerLogs',
  },
  defaults: {},
  setup(_options, _nuxt) {
    if (!_nuxt.options.dev) return
    const resolver = createResolver(import.meta.url)
    _nuxt.options.features.devLogs = 'silent'
    _nuxt.options.nitro = _nuxt.options.nitro || {}
    _nuxt.options.nitro.experimental = _nuxt.options.nitro.experimental || {}
    _nuxt.options.nitro.experimental.websocket = true
    _nuxt.options.experimental = _nuxt.options.experimental || {}

    addServerHandler({
      route: '/api/_client-to-browser-logs',
      handler: resolver.resolve('./runtime/server/api/_client-to-browser-logs'),
    })

    addPlugin(resolver.resolve('./runtime/plugin.client'))
  },
})
