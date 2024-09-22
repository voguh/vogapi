import type { Request as ExpressRequest, Response } from 'express'

import TwitchBaseController from 'vogapi/controllers/twitch/TwitchBaseController'
import BadRequestError from 'vogapi/errors/BadRequestError'
import NotFoundError from 'vogapi/errors/NotFoundError'
import CacheService from 'vogapi/services/CacheService'
import { Errors } from 'vogapi/utils/constants'
import DateUtils from 'vogapi/utils/DateUtils'
import { GET, SwaggerPath, SwaggerResponse } from 'vogapi/utils/RestController'
import Strings from 'vogapi/utils/Strings'

type Request = ExpressRequest<{ userName: string }, any, any, Record<string, any>>
export default class TwitchUserController extends TwitchBaseController {
  private async _getUserId(userName: string): Promise<string> {
    const key = `user:${userName}:id`

    const cachedId = await CacheService.getFromCache(key)
    if (cachedId == null) {
      const userInfo = await this._apiClient.users.getUserByName(userName)
      if (userInfo == null) {
        throw new NotFoundError(Errors.ERR_USER_NOT_FOUND)
      }

      return CacheService.setInCache(key, userInfo.id)
    }

    return cachedId
  }

  private async _getUserProfilePictureUrl(userName: string): Promise<string> {
    const key = `user:${userName}:profilePictureUrl`

    const cachedProfilePictureUrl = await CacheService.getFromCache(key)
    if (cachedProfilePictureUrl == null) {
      const userInfo = await this._apiClient.users.getUserByName(userName)
      if (userInfo == null) {
        throw new NotFoundError(Errors.ERR_USER_NOT_FOUND)
      }

      return CacheService.setInCache(key, userInfo.profilePictureUrl, 3600)
    }

    return cachedProfilePictureUrl
  }

  private async _getUserCreationDate(userName: string): Promise<string> {
    const key = `user:${userName}:creationDate`

    const cachedCreationDate = await CacheService.getFromCache(key)
    if (cachedCreationDate == null) {
      const userInfo = await this._apiClient.users.getUserByName(userName)
      if (userInfo == null) {
        throw new NotFoundError(Errors.ERR_USER_NOT_FOUND)
      }

      return CacheService.setInCache(key, userInfo.creationDate.toISOString())
    }

    return cachedCreationDate
  }

  /* ============================================================================================ */

  @GET('/accountage/:userName')
  @SwaggerPath({ summary: 'Returns user account age.', tags: ['twitch/user'] })
  @SwaggerResponse(200, 'User account age.')
  @SwaggerResponse(400, 'User name is invalid.')
  @SwaggerResponse(404, 'User not found.')
  public async getUserAccountAge(req: Request, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userCreationDate = await this._getUserCreationDate(userName)
    this._sendRawString(res, DateUtils.betweenString(new Date(userCreationDate), new Date()))
  }

  @GET('/avatar/:userName')
  @SwaggerPath({ summary: 'Returns user account avatar url.', tags: ['twitch/user'] })
  @SwaggerResponse(200, 'User account age.')
  @SwaggerResponse(400, 'User name is invalid.')
  @SwaggerResponse(404, 'User not found.')
  public async getUserAvatar(req: Request, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userProfilePictureUrl = await this._getUserProfilePictureUrl(userName)
    this._sendRawString(res, userProfilePictureUrl)
  }

  @GET('/creation/:userName')
  @SwaggerPath({ summary: 'Returns user account creation date.', tags: ['twitch/user'] })
  @SwaggerResponse(200, 'User account creation date.')
  @SwaggerResponse(400, 'User name is invalid.')
  @SwaggerResponse(404, 'User not found.')
  public async getUserCreationDate(req: Request, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userCreationDate = await this._getUserCreationDate(userName)
    this._sendRawString(res, userCreationDate)
  }

  @GET('/id/:userName')
  @SwaggerPath({ summary: 'Returns user account id.', tags: ['twitch/user'] })
  @SwaggerResponse(200, 'User account id.')
  @SwaggerResponse(400, 'User name is invalid.')
  @SwaggerResponse(404, 'User not found.')
  public async getUserId(req: Request, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userId = await this._getUserId(userName)
    this._sendRawString(res, userId)
  }
}
