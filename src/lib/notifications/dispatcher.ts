import { InAppProvider } from "./providers/in-app-provider"
import { NotificationPayload } from "./types"

const inAppProvider = new InAppProvider()

export async function dispatchNotification(payload: NotificationPayload) {
  await inAppProvider.send(payload)
}