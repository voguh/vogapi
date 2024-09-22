import Logger from 'vogapi/utils/Logger'
import Strings from 'vogapi/utils/Strings'

export default class LoggerService {
  private static _defaultLogger = new Logger('vogapi')
  private static _customLoggersMap = new Map<string, Logger>()

  public static getLogger(category?: string): Logger {
    if (!Strings.isNullOrEmpty(category) && category !== 'default' && category !== 'vogapi') {
      let _logger = this._customLoggersMap.get(category)
      if (_logger == null) {
        _logger = new Logger(category)
        this._customLoggersMap.set(category, _logger)
      }

      return _logger
    }

    return this._defaultLogger
  }
}
