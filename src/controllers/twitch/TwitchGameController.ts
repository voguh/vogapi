import type { Request as ExpressRequest, Response } from 'express'

import TwitchBaseController from 'vogapi/controllers/twitch/TwitchBaseController'
import BadRequestError from 'vogapi/errors/BadRequestError'
import NotFoundError from 'vogapi/errors/NotFoundError'
import CacheService from 'vogapi/services/CacheService'
import { Errors } from 'vogapi/utils/constants'
import { GET, SwaggerPath, SwaggerResponse } from 'vogapi/utils/RestController'
import Strings from 'vogapi/utils/Strings'

type Request = ExpressRequest<{ gameName: string }, any, any, Record<string, any>>
export default class TwitchGameController extends TwitchBaseController {
  private async _getGameId(gameName: string): Promise<string> {
    const key = `game:${gameName}:id`

    const cachedGameId = await CacheService.getFromCache(key)
    if (cachedGameId == null) {
      const gameInfo = await this._apiClient.games.getGameByName(gameName)
      if (gameInfo == null) {
        throw new NotFoundError(Errors.ERR_USER_NOT_FOUND)
      }

      return CacheService.setInCache(key, gameInfo.id)
    }

    return cachedGameId
  }

  private async _getGameBoxArt(gameName: string): Promise<string> {
    const key = `game:${gameName}:boxArtUrl`

    const cachedBoxArtUrl = await CacheService.getFromCache(key)
    if (cachedBoxArtUrl == null) {
      const gameInfo = await this._apiClient.games.getGameByName(gameName)
      if (gameInfo == null) {
        throw new NotFoundError(Errors.ERR_USER_NOT_FOUND)
      }

      return CacheService.setInCache(key, gameInfo.boxArtUrl.replace('-{width}x{height}', ''), 3600)
    }

    return cachedBoxArtUrl
  }

  /* ============================================================================================ */

  @GET('/id/:gameName')
  @SwaggerPath({ summary: 'Returns game id.', tags: ['twitch/game'] })
  @SwaggerResponse(200, 'Category/Game id.')
  @SwaggerResponse(400, 'Game name is invalid.')
  @SwaggerResponse(404, 'Game not found.')
  public async getGameId(req: Request, res: Response): Promise<void> {
    const { gameName } = req.params
    if (Strings.isNullOrEmpty(gameName)) {
      throw new BadRequestError('Missing or invalid gameName')
    }

    const gameId = await this._getGameId(gameName)
    this._sendRawString(res, gameId)
  }

  @GET('/boxart/:gameName')
  @SwaggerPath({ summary: 'Returns game box art url.', tags: ['twitch/game'] })
  @SwaggerResponse(200, 'Category/Game box art url.')
  @SwaggerResponse(400, 'Game name is invalid.')
  @SwaggerResponse(404, 'Game not found.')
  public async getGameBoxArt(req: Request, res: Response): Promise<void> {
    const { gameName } = req.params
    if (Strings.isNullOrEmpty(gameName)) {
      throw new BadRequestError('Missing or invalid gameName')
    }

    const gameBoxArtUrl = await this._getGameBoxArt(gameName)
    this._sendRawString(res, gameBoxArtUrl)
  }
}
