import {
  ClientsConfig,
  EventContext,
  IOClients,
  LRUCache,
  ServiceContext,
} from '@vtex/api'

import RequestHub from './hub'
import CheckoutIO from './checkout'

export class Clients extends IOClients {
  public get checkoutIO() {
    return this.getOrSet('checkoutIO', CheckoutIO)
  }

  public get requestHub() {
    return this.getOrSet('requestHub', RequestHub)
  }
}

declare global {
  type Context = ServiceContext<Clients>

  interface StatusChangeContext extends EventContext<Clients> {
    body: {
      domain: string
      orderId: string
      currentState: string
      lastState: string
      currentChangeDate: string
      lastChangeDate: string
    }
  }
}

const memoryCache = new LRUCache<string, any>({ max: 5000 })

metrics.trackCache('xcart', memoryCache)

const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: 800,
    },
    requestHub: {
      timeout: 3000,
    },
    checkoutIO: {
      timeout: 5000,
    },
    status: {
      memoryCache,
    },
  },
}

export default clients
