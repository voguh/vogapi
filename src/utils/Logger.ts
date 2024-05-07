import 'winston-daily-rotate-file'
import path from 'node:path'

import winston, { format, transports } from 'winston'

import { LIB_PATH, LOGS_PATH } from 'vogapi/utils/constants'

class StackTraceFormat implements winston.Logform.Format {
  colorize = format.colorize().colorize
  options?: object
  transform: winston.Logform.TransformFunction = (info, _opts) => {
    const symbols = Object.getOwnPropertySymbols(info)
    const splatKey = symbols.find((symbol) => symbol.toString() === 'Symbol(splat)')
    if (splatKey != null) {
      const slat = info[splatKey]?.[0]
      if (slat != null && typeof slat === 'string' && slat.startsWith('Error')) {
        const [_error, _loggerMethod, caller] = slat.split('\n')

        const matcher = caller.match(/^\s+at Function\.(.*) \((.*)\)$/)
        if (matcher != null && matcher.length >= 3) {
          const [_fullString, functionName, fileNameWithRowAndColumn] = matcher
          const [fileName, lineNumber, columnNumber] = fileNameWithRowAndColumn.split(':')

          let partialPath = fileName.replace(`${LIB_PATH}/`, '').replaceAll('/', '.')
          if (partialPath.endsWith('.js') || partialPath.endsWith('.ts')) {
            partialPath = partialPath.slice(0, -3)
          }

          partialPath += `.${functionName}`

          return {
            ...info,
            timestamp: new Date().toISOString(),
            levelAndCategory: this.colorize(info.level, `${info.category}/${info.level}`),
            functionName,
            fileName,
            lineNumber,
            columnNumber,
            package: `net.oscproject.vogapi.${partialPath}:${lineNumber}`
          }
        }
      }
    }

    return info
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
    const stack = new Error().stack
    this._logger.error(message, stack)
  }

  public debug(message: any): void {
    const stack = new Error().stack
    this._logger.debug(message, stack)
  }

  public info(message: any): void {
    const stack = new Error().stack
    this._logger.info(message, stack)
  }

  public warn(message: any): void {
    const stack = new Error().stack
    this._logger.warn(message, stack)
  }

  public error(message: any): void {
    const stack = new Error().stack
    this._logger.error(message, stack)
  }

  public fatal(message: any): void {
    const stack = new Error().stack
    this._logger.error(message, stack)
  }
}
