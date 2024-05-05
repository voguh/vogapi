import path from 'node:path'

import log4js from 'log4js'

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

export default log4js.getLogger('vogapi')
