/* eslint-disable */
import {DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'

const dbClient = new DynamoDB.DocumentClient()

export const handleEventBridgeEvent = async (event: any) => {
  const item = {
    id: uuidv4(),
    accountId: event.detail.accountId,
    ...event,
  }

  await dbClient

    .put({
      TableName: process.env.TABLE_NAME ?? '',
      Item: item,
    })
    .promise()
}
