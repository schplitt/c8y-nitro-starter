import { defineHandler } from 'nitro/h3'
import { useUserClient } from 'c8y-nitro/utils'

export default defineHandler(async (event) => {
  const userClient = useUserClient(event)
  const data = await userClient.user.current()
  const user = data.data
  
  return user
})