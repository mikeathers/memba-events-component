interface ConfigProps {
  STACK_PREFIX: string
  REGION: string
  AWS_ACCOUNT_ID_PROD: string
  AWS_ACCOUNT_ID_DEV: string
  DOMAIN_NAME: string
  DEV_DOMAIN_NAME: string
  API_URL: string
  DEV_API_URL: string
  SHARED_EVENT_BUS_NAME: string
}

const CONFIG: ConfigProps = {
  STACK_PREFIX: 'Events',
  REGION: 'eu-west-2',
  AWS_ACCOUNT_ID_PROD: '635800996936',
  AWS_ACCOUNT_ID_DEV: '544312030237',
  DOMAIN_NAME: 'memba.co.uk',
  DEV_DOMAIN_NAME: 'dev.memba.co.uk',
  API_URL: 'events.memba.co.uk',
  DEV_API_URL: 'events.dev.memba.co.uk',
  SHARED_EVENT_BUS_NAME: 'SharedEventBus',
}

export default CONFIG
