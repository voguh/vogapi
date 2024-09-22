import { NextFunction, Request, RequestHandler, Response } from 'express'
import { OpenAPIV3 } from 'openapi-types'

type Decorator = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor

/* ============================================================================================== */

export interface RestRoute {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head'
  path: string
  middlewares: RequestHandler[]
  handler: RequestHandler
}

interface RouteMethod {
  (req: Request, res: Response, nextFunction: NextFunction): Promise<void>
  REST_API: Omit<RestRoute, 'handler'>
  REST_DOCS?: OpenAPIV3.OperationObject
}

/* ============================================================================================== */

export function SwaggerPath(docs: Omit<OpenAPIV3.OperationObject, 'responses'>): Decorator {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    if (descriptor.value.REST_DOCS == null) {
      descriptor.value.REST_DOCS = {}
    }

    Object.assign(descriptor.value.REST_DOCS, docs)

    return descriptor
  }
}

type ResponseRest = Omit<OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject, 'description'>
export function SwaggerResponse(code: string | number, description: string, rest?: ResponseRest): Decorator {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    if (descriptor.value.REST_DOCS == null) {
      descriptor.value.REST_DOCS = { responses: {} }
    } else if (descriptor.value.REST_DOCS.responses == null) {
      descriptor.value.REST_DOCS.responses = {}
    }

    descriptor.value.REST_DOCS.responses[code] = { description, ...(rest ?? {}) }

    return descriptor
  }
}

/* ============================================================================================== */

function rest(method: RestRoute['method'], path: string, middlewares: RequestHandler[]): Decorator {
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

function routeMethodGuard(methodFunction: any): methodFunction is RouteMethod {
  return typeof methodFunction === 'function' && 'REST_API' in methodFunction
}

export default class RestController {
  public build(): RestRoute[] {
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    const routes: RestRoute[] = []

    for (const methodName of methods.filter((method) => !['constructor', 'build'].includes(method))) {
      const methodFunction = this[methodName]
      if (routeMethodGuard(methodFunction)) {
        const restApi = methodFunction.REST_API

        const handlerWrapper: RequestHandler & { REST_DOCS: OpenAPIV3.OperationObject } = async (req, res, next) => {
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
