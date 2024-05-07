import fs from 'node:fs'
import path from 'node:path'

import { RequestHandler } from 'express'
import { OpenAPIV3 } from 'openapi-types'

import { ROOT_PATH } from 'vogapi/utils/constants'

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
  handle: RequestHandler & { REST_DOCS: OpenAPIV3.OperationObject }
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
  public static build(router: ExpressRouter): OpenAPIV3.Document {
    const pkgJson = JSON.parse(fs.readFileSync(path.resolve(ROOT_PATH, 'package.json'), 'utf-8'))
    const paths = router.stack
      .filter((layer) => layer.route != null)
      .reduce<OpenAPIV3.PathsObject>((acc, { route }) => {
        if (!(route.path in acc)) {
          const docs = route.stack.at(-1).handle.REST_DOCS

          const rawParameters = route.path.split('/').filter((r) => r.startsWith(':'))
          const parameters = rawParameters.map<OpenAPIV3.ParameterObject>((param) => ({
            name: param.substring(1),
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }))

          const operationData: OpenAPIV3.OperationObject = {
            summary: docs?.summary,
            description: docs?.description,
            tags: docs?.tags,
            responses: {
              '200': { description: 'Ok' },
              '500': { description: 'Internal Server Error' },
              ...(docs?.responses ?? {})
            },
            parameters: parameters
          }

          const swaggerPath = rawParameters.reduce((acc, crr) => acc.replace(crr, `{${crr.substring(1)}}`), route.path)
          const method = Object.entries(route.methods).find(([, active]) => active)?.[0]
          acc[swaggerPath] = { [method]: operationData }
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
      servers: [{ url: process.env.HOST ?? 'http://localhost:8080' }],
      paths: paths
    }
  }
}
