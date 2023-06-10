/* eslint-disable */
import {DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'

const dbClient = new DynamoDB.DocumentClient()

export const handleSqsEvent = async (event: any) => {
  for (const record of event.Records) {
    if (!record.body.detail) return

    const item = {
      id: uuidv4(),
      accountId: record.body.detail.accountId,
      ...record.body,
    }

    await dbClient
      .put({
        TableName: process.env.TABLE_NAME ?? '',
        Item: item,
      })
      .promise()
  }
}
