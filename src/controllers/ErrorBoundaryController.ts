import { NextFunction, Request, Response } from 'express'

import BaseHTTPError from 'vogapi/errors/BaseHTTPError'
import Logger from 'vogapi/services/Logger'

export default class ErrorBoundaryController {
  public static async catch(err: any, _req: Request, res: Response, _next: NextFunction): Promise<void> {
    if (err instanceof BaseHTTPError) {
      res.status(err.statusCode).send(err.message)
    } else if (err instanceof Error) {
      Logger.error(err.message, err)
    } else {
      Logger.error(err)
    }
    res.status(500).send('An unknown error occurred')
  }
}
