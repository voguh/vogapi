import 'winston-daily-rotate-file'
import path from 'node:path'

import winston, { format, transports } from 'winston'

import { LOGS_PATH } from 'vogapi/utils/constants'

const loggerCallers = ['Logger.trace', 'Logger.debug', 'Logger.info', 'Logger.warn', 'Logger.error', 'Logger.fatal']

class StackTraceFormat implements winston.Logform.Format {
  colorize = format.colorize().colorize
  options?: object
  transform: winston.Logform.TransformFunction = (info, _opts) => {
    const symbols = Object.getOwnPropertySymbols(info)
    const splatKey = symbols.find((symbol) => symbol.toString() === 'Symbol(splat)')

    const returnInfo: winston.Logform.TransformableInfo = {
      ...info,
      timestamp: new Date().toISOString(),
      levelAndCategory: this.colorize(info.level, `${info.category}/${info.level}`)
    }

    if (splatKey != null) {
      const slat = info[splatKey]?.[0]

      if (typeof slat === 'string' && slat.startsWith('Error')) {
        let [_error, _loggerRow, caller] = slat.split('\n')

        if (loggerCallers.every((e) => !_loggerRow.trim().startsWith(`at ${e}`))) {
          caller = _loggerRow
        }

        let callerPath = (caller.split(' ').at(-1) ?? '').trim()
        if (callerPath.startsWith('(')) {
          callerPath = callerPath.slice(1)
        }

        if (callerPath.endsWith(')')) {
          callerPath = callerPath.slice(0, -1)
        }

        returnInfo.package = callerPath
      }
    }

    return returnInfo
  }
}

export default class Logger {
  private readonly _logger: winston.Logger

  constructor(category?: string) {
    this._logger = winston.createLogger({
      level: process.env.LOG_LEVEL ?? 'info',
      defaultMeta: { category },
      transports: [
        new transports.Console({
          format: format.combine(
            new StackTraceFormat(),
            format.errors({ stack: true }),
            format.printf((info) => `${info.timestamp} ${info.levelAndCategory} ${info.package} - ${info.message}`)
          )
        }),
        new transports.DailyRotateFile({
          filename: path.resolve(LOGS_PATH, `${category}-%DATE%.log`),
          datePattern: 'YYYYMMDD',
          zippedArchive: true,
          maxFiles: '14d',
          format: format.combine(
            new StackTraceFormat(),
            format.errors({ stack: true }),
            format.printf((info) => `${info.timestamp} ${info.level} ${info.package} - ${info.message}`)
          )
        })
      ]
    })
  }

  public trace(message: any): void {
    const stack = message instanceof Error ? message.stack : new Error().stack
    this._logger.debug(message, stack)
  }

  public debug(message: any): void {
    const stack = message instanceof Error ? message.stack : new Error().stack
    this._logger.debug(message, stack)
  }

  public info(message: any): void {
    const stack = message instanceof Error ? message.stack : new Error().stack
    this._logger.info(message, stack)
  }

  public warn(message: any): void {
    const stack = message instanceof Error ? message.stack : new Error().stack
    this._logger.warn(message, stack)
  }

  public error(message: any): void {
    const stack = message instanceof Error ? message.stack : new Error().stack
    this._logger.error(message, stack)
  }

  public fatal(message: any): void {
    const stack = message instanceof Error ? message.stack : new Error().stack
    this._logger.error(message, stack)
  }
}
