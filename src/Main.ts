import fs from 'node:fs'
import path from 'node:path'

import cors from 'cors'
import * as dateFNS from 'date-fns'
import express, { Express } from 'express'
import morgan from 'morgan'
import cron from 'node-cron'
import swaggerUi from 'swagger-ui-express'

import ErrorBoundaryController from 'vogapi/controllers/ErrorBoundaryController'
import TwitchController from 'vogapi/controllers/TiwtchController'
import Logger from 'vogapi/services/Logger'
import BuildSwaggerDocs from 'vogapi/utils/BuildSwaggerDocs'
import RestControler, { RestRoute } from 'vogapi/utils/RestControler'
import Strings from 'vogapi/utils/Strings'

import { LOGS_PATH } from './utils/constants'

morgan.token('remote-addr', (req) => {
  return (req.headers['cf-connecting-ip'] ?? req.headers['x-forwarded-for'] ?? req.socket.remoteAddress) as string
})

class Main {
  private static _express: Express

  public static async start(_args: string[]): Promise<void> {
    Logger.debug('Checking required environment variables...')
    if (this._checkEnvironmentVariables()) {
      process.exit(1)
    }

    this._express = express()
    this._express.disable('x-powered-by')
    this._express.use(express.json())
    this._express.use(express.urlencoded({ extended: true }))
    this._express.use(cors({ origin: '*' }))
    this._express.use(morgan('short', { stream: { write: (msg) => Logger.info(msg.replace('\n', '')) } }))

    this._registerRoute('/twitch', new TwitchController())

    this._express.use('/api-docs', swaggerUi.serve, swaggerUi.setup(BuildSwaggerDocs.build(this._express._router)))
    this._express.use(ErrorBoundaryController.catch)

    await new Promise<void>((resolve) => this._express.listen(process.env.PORT, resolve))
    Logger.info(`HTTP server successfully started on port ${process.env.PORT}!`)

    cron.schedule('0 0 * * *', this._logsCleanup)
  }

  private static _checkEnvironmentVariables(): boolean {
    const variables = ['PORT', 'TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET']
    let missingRequiredVars = false

    for (const varName of variables) {
      const envVar = process.env[varName]
      if (!Strings.isNullOrEmpty(envVar)) {
        continue
      }

      Logger.fatal(`Missing environment variable: ${varName}`)
      missingRequiredVars = true
    }

    return missingRequiredVars
  }

  private static _registerRoute(baseURL: string, controller: RestControler): RestRoute[] {
    const routes = controller.build()

    for (const route of routes) {
      const normalizedPath = `/${baseURL}/${route.path}`.replace(/\/+/g, '/')
      this._express[route.method](normalizedPath, ...route.middlewares, route.handler)
      Logger.info(`Registering route [${route.method.toUpperCase()}] '${normalizedPath}'`)
    }

    return routes
  }

  private static async _logsCleanup(): Promise<void> {
    const now = new Date()
    const files = fs.readdirSync(LOGS_PATH)

    for (const fileName of files) {
      const fileFullPath = path.resolve(LOGS_PATH, fileName)
      const stats = fs.statSync(fileFullPath)

      if (dateFNS.differenceInDays(stats.mtime, now) > 15) {
        fs.unlinkSync(fileFullPath)
      }
    }

    const yesterday = dateFNS.subDays(now, 1)
    const yesterdayPrefix = dateFNS.format(yesterday, 'yyyyMMdd')
    const twurpleFilePath = path.resolve(LOGS_PATH, 'twurple.log')
    if (fs.existsSync(twurpleFilePath)) {
      fs.renameSync(twurpleFilePath, path.resolve(LOGS_PATH, `${yesterdayPrefix}-twurple.log`))
    }

    const vogapiFilePath = path.resolve(LOGS_PATH, 'vogapi.log')
    if (fs.existsSync(vogapiFilePath)) {
      fs.renameSync(vogapiFilePath, path.resolve(LOGS_PATH, `${yesterdayPrefix}-vogapi.log`))
    }
  }
}

Main.start(process.argv)
