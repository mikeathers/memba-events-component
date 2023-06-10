import {DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'
import {mocked} from 'jest-mock'

import {sampleAPIGatewayEvent} from '../../../test-support'
import {addCorsHeader} from '../../../utils'
import {queryBySecondaryKey} from '../../../aws'
import {HttpStatusCode} from '../../../types'

const mockedPut = jest.fn()
const mockedScan = jest.fn()
const mockQueryBySecondaryKey = mocked(queryBySecondaryKey)
const mockUuid = mocked(uuidv4)
const mockAddCorsHeader = mocked(addCorsHeader)

let optionsUsedToConstructDocumentClient: DynamoDB.Types.ClientConfiguration

jest.doMock('aws-sdk', () => ({
  EventBridge: jest.fn(),
  DynamoDB: {
    DocumentClient: jest.fn((options) => {
      optionsUsedToConstructDocumentClient = {...options}

      return {
        put: mockedPut,
        scan: mockedScan,
      }
    }),
  },
}))

jest.mock('uuid')
jest.mock('../../../utils')
jest.mock('../../../aws')

import {handler} from '../index'

describe('Events Handler', () => {
  const uuid = '1234'
  const accountId = '111'
  const eventName = 'CreateEvent'

  beforeEach(() => {
    jest.resetAllMocks()
    process.env.TABLE_NAME = 'Events-Dev'
    process.env.EVENT_BUS_ARN = 'test-event-bus'
    mockUuid.mockReturnValue(uuid)
  })

  describe('Handle SQS Messages', () => {
    const mockEvent = {
      Records: [
        {
          body: {
            detail: {
              accountId,
            },
            eventName,
          },
        },
      ],
    }
    it('should call dbClient.put if at least one record is found', async () => {
      const Item = {
        id: uuid,
        accountId,
        eventName,
        detail: {
          accountId,
        },
      }
      mockedPut.mockImplementation(() => {
        return {
          promise: () => ({
            Item,
          }),
        }
      })

      await handler(mockEvent)

      expect(mockedPut).toHaveBeenCalledWith({
        TableName: 'Events-Dev',
        Item,
      })
    })
  })

  describe('Handle EventBridge Messages', () => {
    const mockEvent = {
      'detail-type': 'TestEvent',
      detail: {
        accountId,
        eventName,
      },
    }

    it('should call dbClient with the correct item', async () => {
      const Item = {
        id: uuid,
        accountId,
        detail: {
          accountId,
          eventName,
        },
        'detail-type': 'TestEvent',
      }
      mockedPut.mockImplementation(() => {
        return {
          promise: () => ({
            Item,
          }),
        }
      })

      await handler(mockEvent)

      expect(mockedPut).toHaveBeenCalledWith({
        TableName: 'Events-Dev',
        Item,
      })
    })
  })

  describe('Handle Api Gateway', () => {
    const id = 1234
    const mockEvents = [
      {eventName: 'eventOne'},
      {eventName: 'eventTwo'},
      {eventName: 'eventThree'},
    ]

    it('should call addCorsHeader', async () => {
      mockedScan.mockImplementation(() => {
        return {
          promise: () => ({
            Items: [],
          }),
        }
      })
      await handler({
        ...sampleAPIGatewayEvent,
        httpMethod: 'GET',
      })

      expect(mockAddCorsHeader).toHaveBeenCalled()
    })

    it('should throw error when unsupported route found', async () => {
      try {
        await handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'POP',
          pathParameters: {id: '1234'},
        })
      } catch (err) {
        expect((err as Error).message).toBe('Unsupported route: "POP"')
      }
    })

    describe('Get all events for account', () => {
      it('should return a 200 (OK) response with all the events for the account id provided (', async () => {
        mockQueryBySecondaryKey.mockResolvedValue(
          mockEvents as DynamoDB.DocumentClient.AttributeMap[],
        )

        await expect(
          handler({
            ...sampleAPIGatewayEvent,
            httpMethod: 'GET',
            path: 'get-events-for-account',
            pathParameters: {id},
          }),
        ).resolves.toEqual({
          statusCode: HttpStatusCode.OK,
          body: JSON.stringify({
            message: 'Events have been found.',
            result: mockEvents,
          }),
        })
      })

      it('should return a 200 (OK) response if no events were found for the account id provided', async () => {
        mockQueryBySecondaryKey.mockResolvedValue(undefined)

        await expect(
          handler({
            ...sampleAPIGatewayEvent,
            httpMethod: 'GET',
            path: 'get-events-for-account',
            pathParameters: {id},
          }),
        ).resolves.toEqual({
          statusCode: HttpStatusCode.OK,
          body: JSON.stringify({
            message: `No events for account: ${id} have been found.`,
          }),
        })
      })
    })

    describe('Get all events', () => {
      it('should return a 200 (OK) response with all the events if events are found', async () => {
        mockedScan.mockImplementation(() => {
          return {
            promise: () => ({
              Items: mockEvents,
            }),
          }
        })

        await expect(
          handler({
            ...sampleAPIGatewayEvent,
            httpMethod: 'GET',
          }),
        ).resolves.toEqual({
          statusCode: HttpStatusCode.OK,
          body: JSON.stringify({
            result: {Items: mockEvents},
          }),
        })
      })
    })
  })
})
