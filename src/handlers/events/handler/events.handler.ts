/* eslint-disable */
import {handleApiGatewayEvent, handleEventBridgeEvent, handleSqsEvent} from '../functions'

async function handler(event: any) {
  const isSqsEvent = event.Records && event.Records.length > 0
  const isEventBridgeEvent = event['detail-type'] !== undefined

  if (isSqsEvent) {
    await handleSqsEvent(event)
    return
  }

  if (isEventBridgeEvent) {
    await handleEventBridgeEvent(event)
    return
  }

  return await handleApiGatewayEvent(event)
}

export {handler}
