import { NextFunction, Request, Response } from 'express'

import BaseHTTPError from 'vogapi/errors/BaseHTTPError'
import Logger from 'vogapi/services/Logger'
import { Errors } from 'vogapi/utils/constants'

export default class ErrorBoundaryController {
  public static async catch(err: any, _req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.setHeader('Content-Type', 'text/plain')
    if (err instanceof BaseHTTPError) {
      res.setHeader('Content-Length', err.message.length)
      res.status(err.statusCode).send(err.message)
    } else {
      if (err instanceof Error) {
        Logger.error(err.message, err)
      } else {
        Logger.error(err)
      }

      res.setHeader('Content-Length', Errors.ERR_UNKNWON_ERROR.length)
      res.status(500).send(Errors.ERR_UNKNWON_ERROR)
    }
  }
}
