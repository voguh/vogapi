import http from 'node:http'

import cors from 'cors'
import express, { Express } from 'express'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'

import ErrorBoundaryController from 'vogapi/controllers/ErrorBoundaryController'
import TwitchChannelController from 'vogapi/controllers/twitch/TwitchChannelController'
import TwitchGameController from 'vogapi/controllers/twitch/TwitchGameController'
import TwitchTeamController from 'vogapi/controllers/twitch/TwitchTeamController'
import TwitchUserController from 'vogapi/controllers/twitch/TwitchUserController'
import UtilsController from 'vogapi/controllers/UtilsController'
import CacheService from 'vogapi/services/CacheService'
import LoggerService from 'vogapi/services/LoggerService'
import TwurpleApiClient from 'vogapi/services/TwurpleApiClient'
import BuildSwaggerDocs from 'vogapi/utils/BuildSwaggerDocs'
import RestController, { RestRoute } from 'vogapi/utils/RestController'
import Strings from 'vogapi/utils/Strings'

morgan.token('remote-addr', (req) => {
  return (req.headers['cf-connecting-ip'] ?? req.headers['x-forwarded-for'] ?? req.socket.remoteAddress) as string
})

const _logger = LoggerService.getLogger()
class Main {
  private static _express: Express
  private static _webServer: http.Server

  public static async start(_args: string[]): Promise<void> {
    _logger.debug('Checking required environment variables...')
    if (this._checkEnvironmentVariables()) {
      process.exit(1)
    }

    _logger.debug('Connecting to cache database...')
    await CacheService.init()

    this._express = express()
    this._webServer = http.createServer(this._express)
    this._express.disable('x-powered-by')
    this._express.use(express.json())
    this._express.use(express.urlencoded({ extended: true }))
    this._express.use(cors({ origin: '*' }))
    this._express.use(morgan('short', { stream: { write: (msg) => _logger.info(msg.replace('\n', '')) } }))

    _logger.debug('Registering HTTP routes...')

    _logger.debug('Registering twitch endpoints...')
    const twurpleAPIClient = new TwurpleApiClient()
    this._registerRoute('/twitch/channel', new TwitchChannelController(twurpleAPIClient))
    this._registerRoute('/twitch/game', new TwitchGameController(twurpleAPIClient))
    this._registerRoute('/twitch/team', new TwitchTeamController(twurpleAPIClient))
    this._registerRoute('/twitch/user', new TwitchUserController(twurpleAPIClient))

    _logger.debug('Registering HTML generic endpoints...')
    this._registerRoute('/', new UtilsController())

    this._express.use('/api-docs', swaggerUi.serve, swaggerUi.setup(BuildSwaggerDocs.build(this._express._router)))
    this._express.use(ErrorBoundaryController.catch)

    _logger.debug('Starting HTTP server...')
    await new Promise<void>((resolve) => this._webServer.listen(process.env.PORT, resolve))
    _logger.info(`HTTP server successfully started on port ${process.env.PORT}!`)
  }

  public static async stop(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this._webServer.close((err) => {
        if (err != null) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

    await CacheService.stop()
  }

  private static _checkEnvironmentVariables(): boolean {
    const variables = ['PORT', 'CACHE_DATABASE_URL', 'TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET']
    let missingRequiredVars = false

    for (const varName of variables) {
      const envVar = process.env[varName]
      if (!Strings.isNullOrEmpty(envVar)) {
        continue
      }

      _logger.fatal(`Missing environment variable: ${varName}`)
      missingRequiredVars = true
    }

    return missingRequiredVars
  }

  private static _registerRoute(baseURL: string, controller: RestController): RestRoute[] {
    const routes = controller.build()

    for (const route of routes) {
      const normalizedPath = `/${baseURL}/${route.path}`.replace(/\/+/g, '/')
      this._express[route.method](normalizedPath, ...route.middlewares, route.handler)
      _logger.info(`Registering route [${route.method.toUpperCase()}] '${normalizedPath}'`)
    }

    return routes
  }
}

Main.start(process.argv)
process.on('SIGTERM', Main.stop)
