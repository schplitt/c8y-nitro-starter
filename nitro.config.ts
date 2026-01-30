import { defineNitroConfig } from 'nitro/config'
import c8y from 'c8y-nitro'

export default defineNitroConfig({
  preset: 'node_server',
  serverDir: './server',

  builder: "rolldown",

  c8y: {
    // Configure c8y-nitro options here
  },

  modules: [
    c8y(),
  ],
})
