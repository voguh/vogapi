import { NextFunction, Request, RequestHandler, Response } from 'express'

type Decorator = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor

/* ============================================================================================== */

export interface SwaggerDocs {
  summary: string
  description?: string
  tags?: string[]
}

export function SwaggerDocs(docs: SwaggerDocs): Decorator {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.value.REST_DOCS = docs

    return descriptor
  }
}

/* ============================================================================================== */

function rest(method: string, path: string, middlewares: RequestHandler[]): Decorator {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.value.REST_API = { method, middlewares, path }

    return descriptor
  }
}

export function GET(path?: string, middlewares?: RequestHandler[]): Decorator {
  return rest('get', path ?? '', middlewares ?? [])
}

export function POST(path?: string, middlewares?: RequestHandler[]): Decorator {
  return rest('post', path ?? '', middlewares ?? [])
}

export function PUT(path?: string, middlewares?: RequestHandler[]): Decorator {
  return rest('put', path ?? '', middlewares ?? [])
}

export function PATCH(path?: string, middlewares?: RequestHandler[]): Decorator {
  return rest('patch', path ?? '', middlewares ?? [])
}

export function DELETE(path?: string, middlewares?: RequestHandler[]): Decorator {
  return rest('delete', path ?? '', middlewares ?? [])
}

export function OPTIONS(path?: string, middlewares?: RequestHandler[]): Decorator {
  return rest('options', path ?? '', middlewares ?? [])
}

export function HEAD(path?: string, middlewares?: RequestHandler[]): Decorator {
  return rest('head', path ?? '', middlewares ?? [])
}

/* ============================================================================================== */

interface RouteMethod {
  (req: Request, res: Response, nextFunction: NextFunction): Promise<void>
  REST_API: Omit<RestRoute, 'handler'>
  REST_DOCS?: SwaggerDocs
}

function routeMethodGuard(methodFunction: any): methodFunction is RouteMethod {
  return typeof methodFunction === 'function' && 'REST_API' in methodFunction
}

/* ============================================================================================== */

export interface RestRoute {
  method: string
  path: string
  middlewares: RequestHandler[]
  handler: RequestHandler
}

export default class RestControler {
  public build(): RestRoute[] {
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    const routes: RestRoute[] = []

    for (const methodName of methods.filter((method) => !['constructor', 'build'].includes(method))) {
      const methodFunction = this[methodName]
      if (routeMethodGuard(methodFunction)) {
        const restApi = methodFunction.REST_API

        const handlerWrapper: RequestHandler & { REST_DOCS: SwaggerDocs } = async (req, res, next) => {
          try {
            await methodFunction.apply(this, [req, res, next])
          } catch (e) {
            next(e)
          }
        }
        handlerWrapper.REST_DOCS = methodFunction.REST_DOCS

        routes.push({
          method: restApi.method,
          path: restApi.path,
          middlewares: restApi.middlewares,
          handler: handlerWrapper
        })
      }
    }

    return routes
  }
}
