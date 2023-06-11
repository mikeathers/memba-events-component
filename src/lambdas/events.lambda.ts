import path, {join} from 'path'
import {Construct} from 'constructs'
import {ITable} from 'aws-cdk-lib/aws-dynamodb'
import {IQueue} from 'aws-cdk-lib/aws-sqs'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import CONFIG from '../config'
import {Runtime, Tracing} from 'aws-cdk-lib/aws-lambda'
import {Duration} from 'aws-cdk-lib'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {IEventBus, Rule} from 'aws-cdk-lib/aws-events'
import {LambdaFunction} from 'aws-cdk-lib/aws-events-targets'

interface EventsLambdaProps {
  scope: Construct
  table: ITable
  stage: string
  eventBus: IEventBus
  deadLetterQueue: IQueue
}

export class EventsLambda {
  public eventsLambda: NodejsFunction

  constructor(props: EventsLambdaProps) {
    this.eventsLambda = this.createEventsLambda(props)
  }

  private createEventsLambda(props: EventsLambdaProps): NodejsFunction {
    const {scope, stage, table, eventBus, deadLetterQueue} = props
    const lambdaName = `${CONFIG.STACK_PREFIX}EventsLambda-${stage}`

    const handleProps: NodejsFunctionProps = {
      functionName: lambdaName,
      environment: {
        PRIMARY_KEY: 'id',
        TABLE_NAME: table.tableName,
        EVENT_BUS_ARN: eventBus.eventBusArn,
      },
      runtime: Runtime.NODEJS_16_X,
      reservedConcurrentExecutions: 1,
      timeout: Duration.minutes(1),
      memorySize: 256,
      tracing: Tracing.DISABLED, // Disables Xray
      logRetention: RetentionDays.FIVE_DAYS,
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
        keepNames: true,
        sourceMap: true,
      },
      depsLockFilePath: path.join(__dirname, '..', '..', 'yarn.lock'),
      deadLetterQueueEnabled: true,
      deadLetterQueue,
      retryAttempts: 0,
    }

    const eventsLambda = new NodejsFunction(scope, lambdaName, {
      entry: join(__dirname, '../handlers/events/index.ts'),
      ...handleProps,
    })

    table.grantReadWriteData(eventsLambda)

    const accountRule = new Rule(scope, 'AccountRule', {
      eventBus,
      eventPattern: {
        source: ['Account'],
        detailType: ['Create', 'Update', 'Delete'],
      },
    })

    const tenantRule = new Rule(scope, 'TenantRule', {
      eventBus,
      eventPattern: {
        source: ['Tenant'],
        detailType: ['Create', 'Update', 'Delete'],
      },
    })

    const eventsLambdaFunction = new LambdaFunction(eventsLambda)
    accountRule.addTarget(eventsLambdaFunction)
    tenantRule.addTarget(eventsLambdaFunction)

    return eventsLambda
  }
}
