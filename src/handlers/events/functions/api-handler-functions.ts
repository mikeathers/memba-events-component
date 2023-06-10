import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, QueryResult} from '../../../types'
import {queryBySecondaryKey} from '../../../aws'

interface GetEventsForAccountProps {
  id: string
  dbClient: DynamoDB.DocumentClient
}
export const getEventsForAccount = async (
  props: GetEventsForAccountProps,
): Promise<QueryResult> => {
  const {id, dbClient} = props
  const tableName = process.env.TABLE_NAME ?? ''
  const queryKey = 'accountId'
  const queryValue = id

  const queryResponse = await queryBySecondaryKey({
    queryKey,
    queryValue,
    tableName,
    dbClient,
  })

  if (queryResponse && queryResponse.length > 0) {
    return {
      body: {
        message: 'Events have been found.',
        result: queryResponse,
      },
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: {
      message: `No events for account: ${id} have been found.`,
    },
    statusCode: HttpStatusCode.OK,
  }
}

interface GetAllEventsProps {
  dbClient: DynamoDB.DocumentClient
}

export const getAllEvents = async (props: GetAllEventsProps): Promise<QueryResult> => {
  const {dbClient} = props
  const queryResponse = await dbClient
    .scan({
      TableName: process.env.TABLE_NAME ?? '',
    })
    .promise()
  return {
    body: {
      result: queryResponse,
    },
    statusCode: HttpStatusCode.OK,
  }
}
