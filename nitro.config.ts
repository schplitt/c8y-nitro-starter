import { defineNitroConfig } from 'nitro/config'
import c8y from 'c8y-nitro'

export default defineNitroConfig({
  preset: 'node_server',
  serverDir: './server',

  builder: "rolldown",

  c8y: {
    // Configure c8y-nitro options here
    manifest: {
      roles: ['SOME_CUSTOM_ROLE', 'ANOTHER_ROLE'],
      settings: [
        { key: 'myOption', defaultValue: 'default' },
        { key: 'credentials.secret', defaultValue: 'change-me' },
      ],
      requiredRoles: ['ROLE_OPTION_MANAGEMENT_READ'],
    },
  },

  modules: [
    c8y(),
  ],
})
