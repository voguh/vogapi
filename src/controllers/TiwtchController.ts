import { Request as ExpressRequest, Response } from 'express'
import { ParsedQs } from 'qs'

import BadRequestError from 'vogapi/errors/BadRequestError'
import NotFoundError from 'vogapi/errors/NotFoundError'
import CacheService from 'vogapi/services/CacheService'
import TwurpleApiClient from 'vogapi/services/TwurpleApiClient'
import { Errors } from 'vogapi/utils/constants'
import DateUtils from 'vogapi/utils/DateUtils'
import RestController, { GET, SwaggerPath, SwaggerResponse } from 'vogapi/utils/RestController'
import Strings from 'vogapi/utils/Strings'

type Request<Params = Record<string, string>, Query = ParsedQs> = ExpressRequest<Params, any, any, Query>
export default class TwitchController extends RestController {
  constructor(private readonly _apiClient = new TwurpleApiClient()) {
    super()
  }

  /* ============================================================================================ */

  private async _getUserId(userName: string): Promise<string> {
    const key = `username::${userName}`

    const cachedUserId = await CacheService.getFromCache(key)
    if (cachedUserId == null) {
      const userInfo = await this._apiClient.users.getUserByName(userName)
      if (userInfo == null) {
        throw new BadRequestError(Errors.ERR_USER_NOT_FOUND)
      }

      return CacheService.setInCache(key, userInfo.id)
    }

    return cachedUserId
  }

  private async _getUserProfilePictureUrl(userName: string): Promise<string> {
    const key = `userpurl::${userName}`

    const cachedUserProfilePictureUrl = await CacheService.getFromCache(key)
    if (cachedUserProfilePictureUrl == null) {
      const userInfo = await this._apiClient.users.getUserByName(userName)
      if (userInfo == null) {
        throw new BadRequestError(Errors.ERR_USER_NOT_FOUND)
      }

      return CacheService.setInCache(key, userInfo.profilePictureUrl, 3600)
    }

    return cachedUserProfilePictureUrl
  }

  private async _getUserCreationDate(userName: string): Promise<string> {
    const key = `userdate::${userName}`

    const cachedUserCreationDate = await CacheService.getFromCache(key)
    if (cachedUserCreationDate == null) {
      const userInfo = await this._apiClient.users.getUserByName(userName)
      if (userInfo == null) {
        throw new BadRequestError(Errors.ERR_USER_NOT_FOUND)
      }

      return CacheService.setInCache(key, userInfo.creationDate.toISOString())
    }

    return cachedUserCreationDate
  }

  private async _getGameId(gameName: string): Promise<string> {
    const key = `gamename::${gameName}`

    const cachedGameId = await CacheService.getFromCache(key)
    if (cachedGameId == null) {
      const gameInfo = await this._apiClient.games.getGameByName(gameName)
      if (gameInfo == null) {
        throw new BadRequestError(Errors.ERR_USER_NOT_FOUND)
      }

      return CacheService.setInCache(key, gameInfo.id)
    }

    return cachedGameId
  }

  private async _getGameBoxArt(gameName: string): Promise<string> {
    const key = `gameboxart::${gameName}`

    const cachedGameBoxArt = await CacheService.getFromCache(key)
    if (cachedGameBoxArt == null) {
      const gameInfo = await this._apiClient.games.getGameByName(gameName)
      if (gameInfo == null) {
        throw new BadRequestError(Errors.ERR_USER_NOT_FOUND)
      }

      return CacheService.setInCache(key, gameInfo.boxArtUrl.replace('-{width}x{height}', ''), 3600)
    }

    return cachedGameBoxArt
  }

  private async _getTeamId(teamName: string): Promise<string> {
    const key = `teamname::${teamName}`

    const cachedTeamId = await CacheService.getFromCache(key)
    if (cachedTeamId == null) {
      const teamInfo = await this._apiClient.teams.getTeamByName(teamName)
      if (teamInfo == null) {
        throw new BadRequestError(Errors.ERR_TEAM_NOT_FOUND)
      }

      return CacheService.setInCache(key, teamInfo.id)
    }

    return cachedTeamId
  }

  private async _getTeamProfilePictureUrl(teamName: string): Promise<string> {
    const key = `teamaurl::${teamName}`

    const cachedTeamProfilePictureUrl = await CacheService.getFromCache(key)
    if (cachedTeamProfilePictureUrl == null) {
      const teamInfo = await this._apiClient.teams.getTeamByName(teamName)
      if (teamInfo == null) {
        throw new BadRequestError(Errors.ERR_TEAM_NOT_FOUND)
      }

      return CacheService.setInCache(key, teamInfo.logoThumbnailUrl, 3600)
    }

    return cachedTeamProfilePictureUrl
  }

  private _sendRawString(res: Response, content: string): void {
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Length', content.length)
    res.send(content)
  }

  /* ============================================================================================ */

  @GET('/channel/emotes/:channelName')
  @SwaggerPath({ summary: "Returns channel's emotes names.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel emotes names separated by spaces.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found.')
  public async getChannelEmotes(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userId = await this._getUserId(channelName)
    const channelEmotes = await this._apiClient.chat.getChannelEmotes(userId)
    this._sendRawString(res, (channelEmotes ?? []).map((emote) => emote.name).join(' '))
  }

  @GET('/channel/followcount/:channelName')
  @SwaggerPath({ summary: "Returns channel's followers count.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel followers count.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found.')
  public async getChannelFollowCount(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userId = await this._getUserId(channelName)
    const followersCount = await this._apiClient.channels.getChannelFollowerCount(userId)
    this._sendRawString(res, String(followersCount))
  }

  @GET('/channel/randomclip/:channelName')
  @SwaggerPath({ summary: "Returns channel's random clip url.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel random clip url.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found.')
  public async getChannelRandomClip(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userId = await this._getUserId(channelName)
    const { data: clipsInfo } = await this._apiClient.clips.getClipsForBroadcaster(userId)
    const randomIndex = Math.floor(Math.random() * clipsInfo.length)
    this._sendRawString(res, `https://clips.twitch.tv/${clipsInfo[randomIndex].id}`)
  }

  @GET('/channel/streamgame/:channelName')
  @SwaggerPath({ summary: "Returns channel's last stream game name.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel stream category/game.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found.')
  public async getChannelStreamGame(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userId = await this._getUserId(channelName)
    const channelInfo = await this._apiClient.channels.getChannelInfoById(userId)
    this._sendRawString(res, channelInfo.gameName)
  }

  @GET('/channel/streamtitle/:channelName')
  @SwaggerPath({ summary: "Returns channel's last stream title.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel stream title.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found.')
  public async getChannelStreamTitle(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userId = await this._getUserId(channelName)
    const channelInfo = await this._apiClient.channels.getChannelInfoById(userId)
    this._sendRawString(res, channelInfo.title)
  }

  @GET('/channel/streamuptime/:channelName')
  @SwaggerPath({ summary: "Returns channel's current stream uptime.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel current stream uptime.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found or stream offline.')
  public async getChannelStreamUptime(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
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

  @GET('/channel/streamviwerscount/:channelName')
  @SwaggerPath({ summary: "Returns channel's current stream viwers count.", tags: ['twitch/channel'] })
  @SwaggerResponse(200, 'Channel current stream viwers count.')
  @SwaggerResponse(400, 'Channel name is invalid.')
  @SwaggerResponse(404, 'Channel not found or stream offline.')
  public async getChannelStreamViwersCount(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
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

  /* ============================================================================================ */

  @GET('/game/id/:gameName')
  @SwaggerPath({ summary: 'Returns game id.', tags: ['twitch/game'] })
  @SwaggerResponse(200, 'Category/Game id.')
  @SwaggerResponse(400, 'Game name is invalid.')
  @SwaggerResponse(404, 'Game not found.')
  public async getGameId(req: Request<{ gameName: string }, never>, res: Response): Promise<void> {
    const { gameName } = req.params
    if (Strings.isNullOrEmpty(gameName)) {
      throw new BadRequestError('Missing or invalid gameName')
    }

    const gameId = await this._getGameId(gameName)
    this._sendRawString(res, gameId)
  }

  @GET('/game/boxart/:gameName')
  @SwaggerPath({ summary: 'Returns game box art url.', tags: ['twitch/game'] })
  @SwaggerResponse(200, 'Category/Game boxart url.')
  @SwaggerResponse(400, 'Game name is invalid.')
  @SwaggerResponse(404, 'Game not found.')
  public async getGameBoxArt(req: Request<{ gameName: string }, never>, res: Response): Promise<void> {
    const { gameName } = req.params
    if (Strings.isNullOrEmpty(gameName)) {
      throw new BadRequestError('Missing or invalid gameName')
    }

    const gameBoxArtUrl = await this._getGameBoxArt(gameName)
    this._sendRawString(res, gameBoxArtUrl)
  }

  /* ============================================================================================ */

  @GET('/team/avatar/:teamName')
  @SwaggerPath({ summary: 'Returns team avatar url.', tags: ['twitch/team'] })
  @SwaggerResponse(200, 'Team avatar url.')
  @SwaggerResponse(400, 'Team name is invalid.')
  @SwaggerResponse(404, 'Team not found.')
  public async getTeamAvatar(req: Request<{ teamName: string }, never>, res: Response): Promise<void> {
    const { teamName } = req.params
    if (Strings.isInvalidTwitchUserName(teamName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_TEAM_NAME)
    }

    const teamLogoThumbnailUrl = await this._getTeamProfilePictureUrl(teamName)
    this._sendRawString(res, teamLogoThumbnailUrl)
  }

  @GET('/team/id/:teamName')
  @SwaggerPath({ summary: 'Returns team id.', tags: ['twitch/team'] })
  @SwaggerResponse(200, 'Team id.')
  @SwaggerResponse(400, 'Team name is invalid.')
  @SwaggerResponse(404, 'Team not found.')
  public async getTeamId(req: Request<{ teamName: string }, never>, res: Response): Promise<void> {
    const { teamName } = req.params
    if (Strings.isInvalidTwitchUserName(teamName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_TEAM_NAME)
    }

    const teamId = await this._getTeamId(teamName)
    this._sendRawString(res, teamId)
  }

  @GET('/team/members/:teamName')
  @SwaggerPath({ summary: 'Returns team members.', tags: ['twitch/team'] })
  @SwaggerResponse(200, 'Team members separeted by spaces.')
  @SwaggerResponse(400, 'Team name is invalid.')
  @SwaggerResponse(404, 'Team not found.')
  public async getTeamMembers(req: Request<{ teamName: string }, never>, res: Response): Promise<void> {
    const { teamName } = req.params
    if (Strings.isInvalidTwitchUserName(teamName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_TEAM_NAME)
    }

    const teamInfo = await this._apiClient.teams.getTeamByName(teamName)
    if (teamInfo == null) {
      throw new NotFoundError(Errors.ERR_TEAM_NOT_FOUND)
    }

    this._sendRawString(res, teamInfo.userRelations.map((user) => user.name).join(' '))
  }

  /* ============================================================================================ */

  @GET('/user/accountage/:userName')
  @SwaggerPath({ summary: 'Returns user account age.', tags: ['twitch/user'] })
  @SwaggerResponse(200, 'User account age.')
  @SwaggerResponse(400, 'User name is invalid.')
  @SwaggerResponse(404, 'User not found.')
  public async getUserAccountAge(req: Request<{ userName: string }, never>, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userCreationDate = await this._getUserCreationDate(userName)
    this._sendRawString(res, DateUtils.betweenString(new Date(userCreationDate), new Date()))
  }

  @GET('/user/avatar/:userName')
  @SwaggerPath({ summary: 'Returns user account avatar url.', tags: ['twitch/user'] })
  @SwaggerResponse(200, 'User account age.')
  @SwaggerResponse(400, 'User name is invalid.')
  @SwaggerResponse(404, 'User not found.')
  public async getUserAvatar(req: Request<{ userName: string }, never>, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userProfilePictureUrl = await this._getUserProfilePictureUrl(userName)
    this._sendRawString(res, userProfilePictureUrl)
  }

  @GET('/user/creation/:userName')
  @SwaggerPath({ summary: 'Returns user account creation date.', tags: ['twitch/user'] })
  @SwaggerResponse(200, 'User account creation date.')
  @SwaggerResponse(400, 'User name is invalid.')
  @SwaggerResponse(404, 'User not found.')
  public async getUserCreationDate(req: Request<{ userName: string }, never>, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userInfo = await this._apiClient.users.getUserByName(userName)
    if (userInfo == null) {
      throw new NotFoundError(Errors.ERR_USER_NOT_FOUND)
    }

    const userCreationDate = await this._getUserCreationDate(userName)
    this._sendRawString(res, userCreationDate)
  }

  @GET('/user/id/:userName')
  @SwaggerPath({ summary: 'Returns user account id.', tags: ['twitch/user'] })
  @SwaggerResponse(200, 'User account id.')
  @SwaggerResponse(400, 'User name is invalid.')
  @SwaggerResponse(404, 'User not found.')
  public async getUserId(req: Request<{ userName: string }, never>, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_USER_NAME)
    }

    const userId = await this._getUserId(userName)
    this._sendRawString(res, userId)
  }
}
