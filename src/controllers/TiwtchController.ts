import { LogLevel, LoggerOptions } from '@d-fischer/logger'
import { ApiClient } from '@twurple/api'
import { AppTokenAuthProvider } from '@twurple/auth'
import { Request as ExpressRequest, Response } from 'express'
import log4js from 'log4js'
import { ParsedQs } from 'qs'

import BadRequest from 'vogapi/errors/BadRequest'
import CacheService from 'vogapi/services/CacheService'
import DateUtils from 'vogapi/utils/DateUtils'
import RestControler, { GET, SwaggerDocs } from 'vogapi/utils/RestControler'
import Strings from 'vogapi/utils/Strings'

const twurpleLogger = log4js.getLogger('twurple')
const logger: Partial<LoggerOptions> = {
  custom(level, message) {
    switch (level) {
      case LogLevel.TRACE:
        return twurpleLogger.trace(message)
      case LogLevel.DEBUG:
        return twurpleLogger.debug(message)
      case LogLevel.INFO:
        return twurpleLogger.info(message)
      case LogLevel.WARNING:
        return twurpleLogger.warn(message)
      case LogLevel.ERROR:
        return twurpleLogger.error(message)
      case LogLevel.CRITICAL:
        return twurpleLogger.fatal(message)
    }
  }
}

type Request<Params = Record<string, string>, Query = ParsedQs> = ExpressRequest<Params, any, any, Query>
export default class TwitchController extends RestControler {
  private readonly _apiClient: ApiClient

  constructor() {
    super()
    const authProvider = new AppTokenAuthProvider(process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET)
    this._apiClient = new ApiClient({ authProvider, logger })
  }

  /* ============================================================================================ */

  private async _getUserId(userName: string): Promise<string> {
    try {
      const cachedUserId = await CacheService.getFromCache(`username::${userName}`)
      if (cachedUserId == null) {
        throw new Error("User id can't be founded in cache")
      }

      return cachedUserId
    } catch (e) {
      const userInfo = await this._apiClient.users.getUserByName(userName)
      await CacheService.setInCache(`username::${userName}`, userInfo.id)

      return userInfo.id
    }
  }

  private async _getGameId(gameName: string): Promise<string> {
    try {
      const cachedUserId = await CacheService.getFromCache(`gamename::${gameName}`)
      if (cachedUserId == null) {
        throw new Error("Game id can't be founded in cache")
      }

      return cachedUserId
    } catch (e) {
      const gameInfo = await this._apiClient.games.getGameByName(gameName)
      await CacheService.setInCache(`gamename::${gameName}`, gameInfo.id)

      return gameInfo.id
    }
  }

  private async _getTeamId(teamName: string): Promise<string> {
    try {
      const cachedUserId = await CacheService.getFromCache(`teamname::${teamName}`)
      if (cachedUserId == null) {
        throw new Error("Team id can't be founded in cache")
      }

      return cachedUserId
    } catch (e) {
      const teamInfo = await this._apiClient.teams.getTeamByName(teamName)
      await CacheService.setInCache(`teamname::${teamName}`, teamInfo.id)

      return teamInfo.id
    }
  }

  private _sendRawString(res: Response, content: string): void {
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Length', content.length)
    res.send(content)
  }

  /* ============================================================================================ */

  @GET('/channel/emotes/:channelName')
  @SwaggerDocs({ summary: "Returns channel's emotes names.", tags: ['twitch/channel'] })
  public async getChannelEmotes(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const userId = await this._getUserId(channelName)
    const channelEmotes = await this._apiClient.chat.getChannelEmotes(userId)
    this._sendRawString(res, (channelEmotes ?? []).map((emote) => emote.name).join(' '))
  }

  @GET('/channel/followcount/:channelName')
  @SwaggerDocs({ summary: "Returns channel's followers count.", tags: ['twitch/channel'] })
  public async getChannelFollowCount(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const userId = await this._getUserId(channelName)
    const followersCount = await this._apiClient.channels.getChannelFollowerCount(userId)
    this._sendRawString(res, String(followersCount))
  }

  @GET('/channel/randomclip/:channelName')
  @SwaggerDocs({ summary: "Returns channel's random clip url.", tags: ['twitch/channel'] })
  public async getChannelRandomClip(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const userId = await this._getUserId(channelName)
    const { data: clipsInfo } = await this._apiClient.clips.getClipsForBroadcaster(userId)
    const randomIndex = Math.floor(Math.random() * clipsInfo.length)
    this._sendRawString(res, `https://clips.twitch.tv/${clipsInfo[randomIndex].id}`)
  }

  @GET('/channel/streamgame/:channelName')
  @SwaggerDocs({ summary: "Returns channel's last stream game name.", tags: ['twitch/channel'] })
  public async getChannelStreamGame(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const userId = await this._getUserId(channelName)
    const channelInfo = await this._apiClient.channels.getChannelInfoById(userId)
    this._sendRawString(res, channelInfo.gameName)
  }

  @GET('/channel/streamtitle/:channelName')
  @SwaggerDocs({ summary: "Returns channel's last stream title.", tags: ['twitch/channel'] })
  public async getChannelStreamTitle(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const userId = await this._getUserId(channelName)
    const channelInfo = await this._apiClient.channels.getChannelInfoById(userId)
    this._sendRawString(res, channelInfo.title)
  }

  @GET('/channel/streamuptime/:channelName')
  @SwaggerDocs({ summary: "Returns channel's current stream uptime.", tags: ['twitch/channel'] })
  public async getChannelStreamUptime(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const streamInfo = await this._apiClient.streams.getStreamByUserName(channelName)
    this._sendRawString(res, DateUtils.betweenString(streamInfo.startDate, new Date()))
  }

  @GET('/channel/streamviwerscount/:channelName')
  @SwaggerDocs({ summary: "Returns channel's current stream viwers count.", tags: ['twitch/channel'] })
  public async getChannelStreamViwersCount(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const streamInfo = await this._apiClient.streams.getStreamByUserName(channelName)
    this._sendRawString(res, String(streamInfo.viewers))
  }

  /* ============================================================================================ */

  @GET('/game/id/:gameName')
  @SwaggerDocs({ summary: 'Returns game id.', tags: ['twitch/game'] })
  public async getGameId(req: Request<{ gameName: string }, never>, res: Response): Promise<void> {
    const { gameName } = req.params
    if (Strings.isNullOrEmpty(gameName)) {
      throw new BadRequest('Missing or invalid gameName')
    }

    const gameId = await this._getGameId(gameName)
    this._sendRawString(res, gameId)
  }

  @GET('/game/boxart/:gameName')
  @SwaggerDocs({ summary: 'Returns game box art url.', tags: ['twitch/game'] })
  public async getGameBoxArt(req: Request<{ gameName: string }, never>, res: Response): Promise<void> {
    const { gameName } = req.params
    if (Strings.isNullOrEmpty(gameName)) {
      throw new BadRequest('Missing or invalid gameName')
    }

    const gameId = await this._getGameId(gameName)
    this._sendRawString(res, `https://static-cdn.jtvnw.net/ttv-boxart/${gameId}.jpg`)
  }

  /* ============================================================================================ */

  @GET('/team/avatar/:teamName')
  @SwaggerDocs({ summary: 'Returns team avatar url.', tags: ['twitch/team'] })
  public async getTeamAvatar(req: Request<{ teamName: string }, never>, res: Response): Promise<void> {
    const { teamName } = req.params
    if (Strings.isInvalidTwitchUserName(teamName)) {
      throw new BadRequest('Missing or invalid teamName')
    }

    const teamInfo = await this._apiClient.teams.getTeamByName(teamName)
    this._sendRawString(res, teamInfo.logoThumbnailUrl)
  }

  @GET('/team/id/:teamName')
  @SwaggerDocs({ summary: 'Returns team id.', tags: ['twitch/team'] })
  public async getTeamId(req: Request<{ teamName: string }, never>, res: Response): Promise<void> {
    const { teamName } = req.params
    if (Strings.isInvalidTwitchUserName(teamName)) {
      throw new BadRequest('Missing or invalid teamName')
    }

    const teamId = await this._getTeamId(teamName)
    this._sendRawString(res, teamId)
  }

  @GET('/team/members/:teamName')
  @SwaggerDocs({ summary: 'Returns team members.', tags: ['twitch/team'] })
  public async getTeamMembers(req: Request<{ teamName: string }, never>, res: Response): Promise<void> {
    const { teamName } = req.params
    if (Strings.isInvalidTwitchUserName(teamName)) {
      throw new BadRequest('Missing or invalid teamName')
    }

    const teamInfo = await this._apiClient.teams.getTeamByName(teamName)
    this._sendRawString(res, teamInfo.userRelations.map((user) => user.name).join(' '))
  }

  /* ============================================================================================ */

  @GET('/user/accountage/:userName')
  @SwaggerDocs({ summary: 'Returns user account age.', tags: ['twitch/user'] })
  public async getUserAccountAge(req: Request<{ userName: string }, never>, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequest('Missing or invalid userName')
    }

    const userInfo = await this._apiClient.users.getUserByName(userName)
    this._sendRawString(res, DateUtils.betweenString(userInfo.creationDate, new Date()))
  }

  @GET('/user/avatar/:userName')
  @SwaggerDocs({ summary: 'Returns user account avatar url.', tags: ['twitch/user'] })
  public async getUserAvatar(req: Request<{ userName: string }, never>, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequest('Missing or invalid userName')
    }

    const userInfo = await this._apiClient.users.getUserByName(userName)
    this._sendRawString(res, userInfo.profilePictureUrl)
  }

  @GET('/user/creation/:userName')
  @SwaggerDocs({ summary: 'Returns user account creation date.', tags: ['twitch/user'] })
  public async getUserCreationDate(req: Request<{ userName: string }, never>, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequest('Missing or invalid userName')
    }

    const userInfo = await this._apiClient.users.getUserByName(userName)
    this._sendRawString(res, userInfo.creationDate.toUTCString())
  }

  @GET('/user/id/:userName')
  @SwaggerDocs({ summary: 'Returns user account id.', tags: ['twitch/user'] })
  public async getUserId(req: Request<{ userName: string }, never>, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequest('Missing or invalid userName')
    }

    const userId = await this._getUserId(userName)
    this._sendRawString(res, userId)
  }

  /* ============================================================================================ */
}
