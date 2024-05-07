import { LogLevel } from '@d-fischer/logger'
import { ApiClient, ApiConfig } from '@twurple/api'
import { AppTokenAuthProvider } from '@twurple/auth'

import LoggerService from './LoggerService'

const _logger = LoggerService.getLogger('twurple')
export default class TwurpleApiClient extends ApiClient {
  constructor(config?: Omit<ApiConfig, 'authProvider' | 'logger'>) {
    super({
      ...(config ?? {}),
      authProvider: new AppTokenAuthProvider(process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET),
      logger: { custom: (level, message) => this._customLogger(level, message) }
    })
  }

  private _customLogger(level: LogLevel, message: string): void {
    switch (level) {
      case LogLevel.TRACE:
        return _logger.trace(message)
      case LogLevel.DEBUG:
        return _logger.debug(message)
      case LogLevel.INFO:
        return _logger.info(message)
      case LogLevel.WARNING:
        return _logger.warn(message)
      case LogLevel.ERROR:
        return _logger.error(message)
      case LogLevel.CRITICAL:
        return _logger.error(message)
      default:
        return _logger.debug(message)
    }
  }
}
