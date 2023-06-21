import {Construct} from 'constructs'
import {Duration, Stack, StackProps} from 'aws-cdk-lib'
import CONFIG from './config'
import {Databases} from './databases'
import {Queue} from 'aws-cdk-lib/aws-sqs'
import {EventBus} from 'aws-cdk-lib/aws-events'
import {EventsLambda} from './lambdas'

interface MembaEventsComponentProps extends StackProps {
  stage: string
}
export class MembaEventsComponentStack extends Stack {
  constructor(scope: Construct, id: string, props: MembaEventsComponentProps) {
    super(scope, id, props)
    const {stage} = props

    const devEventBusArn = `arn:aws:events:${CONFIG.REGION}:${CONFIG.AWS_ACCOUNT_ID_DEV}:event-bus/${CONFIG.SHARED_EVENT_BUS_NAME}`
    const prodEventBusArn = `arn:aws:events:${CONFIG.REGION}:${CONFIG.AWS_ACCOUNT_ID_PROD}:event-bus/${CONFIG.SHARED_EVENT_BUS_NAME}`
    const eventBusArn = stage === 'prod' ? prodEventBusArn : devEventBusArn

    const database = new Databases(this, `${CONFIG.STACK_PREFIX}Databases`)

    const deadLetterQueue = new Queue(this, `${CONFIG.STACK_PREFIX}-DLQ`, {
      retentionPeriod: Duration.days(7),
      queueName: `${CONFIG.STACK_PREFIX}-DLQ`,
    })

    const eventBus = EventBus.fromEventBusArn(this, `SharedEventBus`, eventBusArn)

    new EventsLambda({
      scope: this,
      eventBus,
      deadLetterQueue,
      table: database.eventsTable,
    })
  }
}
