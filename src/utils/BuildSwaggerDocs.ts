import fs from 'node:fs'
import path from 'node:path'

import { RequestHandler } from 'express'
import { JsonObject } from 'swagger-ui-express'

import { ROOT_PATH } from 'vogapi/utils/constants'
import { SwaggerDocs } from 'vogapi/utils/RestControler'

interface ExpressLayerKey {
  name: string
  optional: boolean
  offset: number
}

interface ExpressRoute {
  path: string
  stack: ExpressLayer[]
  methods: Record<string, boolean>
}

interface ExpressLayer {
  handle: RequestHandler
  name: string
  params: any
  path: any
  keys: ExpressLayerKey[]
  regexp: RegExp
  route: ExpressRoute
}

interface ExpressRouter {
  (...params: any): any
  params: any
  _params: string[]
  caseSensitive: boolean
  mergeParams: any
  strict: boolean
  stack: ExpressLayer[]
}

export default class BuildSwaggerDocs {
  public static build(router: ExpressRouter): JsonObject {
    const pkgJson = JSON.parse(fs.readFileSync(path.resolve(ROOT_PATH, 'package.json'), 'utf-8'))
    const paths = router.stack
      .filter((layer) => layer.route != null)
      .reduce<Record<string, any>>((acc, { route }) => {
        if (!(route.path in acc)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const docs = route.stack.at(-1).handle.REST_DOCS as SwaggerDocs
          const method = Object.entries(route.methods).find(([, active]) => active)?.[0]

          acc[route.path] = {
            [method]: {
              summary: docs?.summary,
              description: docs?.description,
              tags: docs.tags,
              produces: ['application/json'],
              parameters: route.path
                .split('/')
                .filter((r) => r.startsWith(':'))
                .map((param) => ({
                  name: param.substring(1),
                  in: 'path',
                  required: true,
                  schema: { type: 'string' }
                }))
            }
          }
        }

        return acc
      }, {})

    return {
      openapi: '3.1.0',
      info: {
        title: pkgJson.displayName,
        description: pkgJson.description,
        version: pkgJson.version,
        license: {
          name: pkgJson.license,
          url: '/license'
        }
      },
      servers: [
        {
          url: process.env.HOST ?? 'http://localhost:8080'
        }
      ],
      paths: paths
    }
  }
}
