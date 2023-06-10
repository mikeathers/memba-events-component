import {AttributeType, BillingMode, ITable, Table} from 'aws-cdk-lib/aws-dynamodb'
import {Construct} from 'constructs'
import CONFIG from '../config'
import {RemovalPolicy} from 'aws-cdk-lib'

export class Databases extends Construct {
  public readonly eventsTable: ITable

  constructor(scope: Construct, id: string, stage: string) {
    super(scope, id)

    this.eventsTable = this.createEventsTable({scope: this, stage})
  }

  private createEventsTable(props: {stage: string; scope: Construct}) {
    const {scope, stage} = props
    const tableName = `${CONFIG.STACK_PREFIX}-${stage}`

    const eventsTable = new Table(scope, tableName, {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName,
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    })

    eventsTable.addGlobalSecondaryIndex({
      indexName: 'accountId',
      partitionKey: {
        name: 'accountId',
        type: AttributeType.STRING,
      },
    })

    return eventsTable
  }
}
