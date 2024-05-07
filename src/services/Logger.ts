import fs from 'node:fs'
import path from 'node:path'

import * as dateFNS from 'date-fns'
import log4js from 'log4js'
import cron from 'node-cron'

import { LIB_PATH, LOGS_PATH } from 'vogapi/utils/constants'

const level = process.env.LOG_LEVEL ?? 'info'
const baseLayout: log4js.Layout = {
  type: 'pattern',
  tokens: {
    package: (ev) => {
      let partialPath = ev.fileName.replace(`${LIB_PATH}/`, '').replaceAll('/', '.')

      if (partialPath.endsWith('.js') || partialPath.endsWith('.ts')) {
        partialPath = partialPath.slice(0, -3)
      }

      partialPath += `.${ev.functionName}`

      return `net.oscproject.vogapi.${partialPath}:${ev.lineNumber}`
    }
  }
}

const fileLayout: log4js.Layout = { ...baseLayout, pattern: '%d{ISO8601_WITH_TZ_OFFSET} %p %x{package} - %m' }
const stdoutLayout: log4js.Layout = { ...baseLayout, pattern: '%d{ISO8601_WITH_TZ_OFFSET} %[%c/%p%] %x{package} - %m' }

log4js.configure({
  categories: {
    default: { appenders: ['file', 'stdout'], level, enableCallStack: true },
    twurple: { appenders: ['twurple-file', 'stdout'], level, enableCallStack: true }
  },
  appenders: {
    'twurple-file': { type: 'file', filename: path.resolve(LOGS_PATH, 'twurple.log'), layout: fileLayout },
    file: { type: 'file', filename: path.resolve(LOGS_PATH, 'vogapi.log'), layout: fileLayout },
    stdout: { type: 'stdout', layout: stdoutLayout }
  }
})

export default class LoggerService {
  private static _logger = log4js.getLogger('vogapi')
  private static _logsCleanupSchedule: cron.ScheduledTask

  public static async init(): Promise<void> {
    this._logsCleanupSchedule = cron.schedule('0 0 * * *', this._logsCleanup)
  }

  public static async stop(): Promise<void> {
    this._logsCleanupSchedule.stop()
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

  public static trace(message: any, ...args: any[]): void {
    this._logger.trace(message, ...args)
  }

  public static debug(message: any, ...args: any[]): void {
    this._logger.debug(message, ...args)
  }

  public static info(message: any, ...args: any[]): void {
    this._logger.info(message, ...args)
  }

  public static warn(message: any, ...args: any[]): void {
    this._logger.warn(message, ...args)
  }

  public static error(message: any, ...args: any[]): void {
    this._logger.error(message, ...args)
  }

  public static fatal(message: any, ...args: any[]): void {
    this._logger.fatal(message, ...args)
  }

  public static mark(message: any, ...args: any[]): void {
    this._logger.mark(message, ...args)
  }
}
