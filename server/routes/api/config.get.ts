import { defineHandler } from 'nitro/h3'

export default defineHandler(async () => {
  const baseUrl = process.env.C8Y_BASEURL!
  return {
    baseUrl: baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  }
})
