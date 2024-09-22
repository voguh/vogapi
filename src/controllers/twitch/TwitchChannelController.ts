import type { Request as ExpressRequest, Response } from 'express'
import type { ParsedQs } from 'qs'

import TwitchBaseController from 'vogapi/controllers/twitch/TwitchBaseController'
import BadRequestError from 'vogapi/errors/BadRequestError'
import NotFoundError from 'vogapi/errors/NotFoundError'
import CacheService from 'vogapi/services/CacheService'
import { Errors } from 'vogapi/utils/constants'
import DateUtils from 'vogapi/utils/DateUtils'
import { GET, SwaggerPath, SwaggerResponse } from 'vogapi/utils/RestController'
import Strings from 'vogapi/utils/Strings'

type Request = ExpressRequest<{ channelName: string }, any, any, ParsedQs>
export default class TwitchChannelController extends TwitchBaseController {
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

  /* ============================================================================================ */

  @GET('/emotes/:channelName')
  @SwaggerPath({ summary: "Returns channel's emotes names.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel emotes names separated by spaces.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found.')
  public async getChannelEmotes(req: Request, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userId = await this._getUserId(channelName)
    const channelEmotes = await this._apiClient.chat.getChannelEmotes(userId)
    this._sendRawString(res, (channelEmotes ?? []).map((emote) => emote.name).join(' '))
  }

  @GET('/followcount/:channelName')
  @SwaggerPath({ summary: "Returns channel's followers count.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel followers count.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found.')
  public async getChannelFollowCount(req: Request, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userId = await this._getUserId(channelName)
    const followersCount = await this._apiClient.channels.getChannelFollowerCount(userId)
    this._sendRawString(res, String(followersCount))
  }

  @GET('/randomclip/:channelName')
  @SwaggerPath({ summary: "Returns channel's random clip url.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel random clip url.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found.')
  public async getChannelRandomClip(req: Request, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userId = await this._getUserId(channelName)
    const { data: clipsInfo } = await this._apiClient.clips.getClipsForBroadcaster(userId)
    const randomIndex = Math.floor(Math.random() * clipsInfo.length)
    this._sendRawString(res, `https://clips.twitch.tv/${clipsInfo[randomIndex].id}`)
  }

  @GET('/streamgame/:channelName')
  @SwaggerPath({ summary: "Returns channel's last stream game name.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel stream category/game.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found.')
  public async getChannelStreamGame(req: Request, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userId = await this._getUserId(channelName)
    const channelInfo = await this._apiClient.channels.getChannelInfoById(userId)
    this._sendRawString(res, channelInfo.gameName)
  }

  @GET('/streamtitle/:channelName')
  @SwaggerPath({ summary: "Returns channel's last stream title.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel stream title.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found.')
  public async getChannelStreamTitle(req: Request, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userId = await this._getUserId(channelName)
    const channelInfo = await this._apiClient.channels.getChannelInfoById(userId)
    this._sendRawString(res, channelInfo.title)
  }

  @GET('/streamuptime/:channelName')
  @SwaggerPath({ summary: "Returns channel's current stream uptime.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel current stream uptime.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found or stream offline.')
  public async getChannelStreamUptime(req: Request, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const streamInfo = await this._apiClient.streams.getStreamByUserName(channelName)
    if (streamInfo == null) {
      throw new BadRequestError(Errors.ERR_STREAM_OFFLINE)
    }

    this._sendRawString(res, DateUtils.betweenString(streamInfo.startDate, new Date()))
  }

  @GET('/streamviewerscount/:channelName')
  @SwaggerPath({ summary: "Returns channel's current stream viewers count.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel current stream viewers count.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found or stream offline.')
  public async getChannelStreamViewersCount(req: Request, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const streamInfo = await this._apiClient.streams.getStreamByUserName(channelName)
    if (streamInfo == null) {
      throw new NotFoundError(Errors.ERR_STREAM_OFFLINE)
    }

    this._sendRawString(res, String(streamInfo.viewers))
  }
}
