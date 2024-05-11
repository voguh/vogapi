import type { Response } from 'express'

import TwurpleApiClient from 'vogapi/services/TwurpleApiClient'
import RestController from 'vogapi/utils/RestController'

export default abstract class TwitchBaseController extends RestController {
  constructor(protected readonly _apiClient = new TwurpleApiClient()) {
    super()
  }

  /* ============================================================================================ */

  protected _sendRawString(res: Response, content: string): void {
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Length', content.length)
    res.send(content)
  }
}
