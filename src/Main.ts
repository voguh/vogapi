import express, { Express } from 'express'
import morgan from 'morgan'

import Logger from 'vogapi/services/Logger'
import Strings from 'vogapi/utils/Strings'

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
    this._express.use(morgan('short', { stream: { write: (msg) => Logger.info(msg.replace('\n', '')) } }))

    await new Promise<void>((resolve) => this._express.listen(process.env.PORT, resolve))
    Logger.info(`HTTP server successfully started on port ${process.env.PORT}!`)
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
}

Main.start(process.argv)
