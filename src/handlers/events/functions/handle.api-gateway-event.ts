import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import {addCorsHeader, errorHasMessage} from '../../../utils'
import {getAllEvents, getEventsForAccount} from './api-handler-functions'
import {DynamoDB} from 'aws-sdk'

const dbClient = new DynamoDB.DocumentClient()

export const handleApiGatewayEvent = async (event: APIGatewayProxyEvent) => {
  console.log('request:', JSON.stringify(event, undefined, 2))

  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: '',
  }

  addCorsHeader(event)

  try {
    switch (event.httpMethod) {
      case 'GET': {
        if (event.path.includes('get-events-for-account') && event.pathParameters?.id) {
          const response = await getEventsForAccount({
            id: event.pathParameters.id,
            dbClient,
          })
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        } else {
          const response = await getAllEvents({dbClient})
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        }
        break
      }
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`)
    }
  } catch (err) {
    console.error(err)
    result.statusCode = 500

    if (errorHasMessage(err)) result.body = err.message
    else result.body = 'Something went very wrong.'
  }
  return result
}
