import { LogLevel, LoggerOptions } from '@d-fischer/logger'
import { ApiClient } from '@twurple/api'
import { AppTokenAuthProvider } from '@twurple/auth'
import { Request as ExpressRequest, Response } from 'express'
import log4js from 'log4js'
import { ParsedQs } from 'qs'

import BadRequest from 'vogapi/errors/BadRequest'
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

  @GET('/channel/emotes/:channelName')
  @SwaggerDocs({ summary: "Returns channel's emotes names.", tags: ['twitch/channel'] })
  public async getChannelEmotes(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const userInfo = await this._apiClient.users.getUserByName(channelName)
    const channelEmotes = await this._apiClient.chat.getChannelEmotes(userInfo.id)
    res.send((channelEmotes ?? []).map((emote) => emote.name).join(' '))
  }

  @GET('/channel/followcount/:channelName')
  @SwaggerDocs({ summary: "Returns channel's followers count.", tags: ['twitch/channel'] })
  public async getChannelFollowCount(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const userInfo = await this._apiClient.users.getUserByName(channelName)
    const followersCount = await this._apiClient.channels.getChannelFollowerCount(userInfo.id)
    res.send(String(followersCount))
  }

  @GET('/channel/randomclip/:channelName')
  @SwaggerDocs({ summary: "Returns channel's random clip.", tags: ['twitch/channel'] })
  public async getChannelRandomClip(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const userInfo = await this._apiClient.users.getUserByName(channelName)
    const { data: clipsInfo } = await this._apiClient.clips.getClipsForBroadcaster(userInfo.id)
    const randomIndex = Math.floor(Math.random() * clipsInfo.length)
    res.send(`https://clips.twitch.tv/${clipsInfo[randomIndex].id}`)
  }

  @GET('/channel/streamgame/:channelName')
  @SwaggerDocs({ summary: "Returns channel's last stream game name.", tags: ['twitch/channel'] })
  public async getChannelStreamGame(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const userInfo = await this._apiClient.users.getUserByName(channelName)
    const channelInfo = await this._apiClient.channels.getChannelInfoById(userInfo.id)
    res.send(channelInfo.gameName)
  }

  @GET('/channel/streamtitle/:channelName')
  @SwaggerDocs({ summary: "Returns channel's last stream title.", tags: ['twitch/channel'] })
  public async getChannelStreamTitle(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const userInfo = await this._apiClient.users.getUserByName(channelName)
    const channelInfo = await this._apiClient.channels.getChannelInfoById(userInfo.id)
    res.send(channelInfo.title)
  }

  @GET('/channel/streamuptime/:channelName')
  @SwaggerDocs({ summary: "Returns channel's current stream uptime.", tags: ['twitch/channel'] })
  public async getChannelStreamUptime(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const streamInfo = await this._apiClient.streams.getStreamByUserName(channelName)
    res.send(DateUtils.betweenString(streamInfo.startDate, new Date()))
  }

  @GET('/channel/streamviwerscount/:channelName')
  @SwaggerDocs({ summary: "Returns channel's current stream viwers count.", tags: ['twitch/channel'] })
  public async getChannelStreamViwersCount(req: Request<{ channelName: string }, never>, res: Response): Promise<void> {
    const { channelName } = req.params
    if (Strings.isInvalidTwitchUserName(channelName)) {
      throw new BadRequest('Missing or invalid channelName')
    }

    const streamInfo = await this._apiClient.streams.getStreamByUserName(channelName)
    res.send(String(streamInfo.viewers))
  }

  /* ============================================================================================ */

  @GET('/game/id/:gameName')
  @SwaggerDocs({ summary: 'Returns game id.', tags: ['twitch/game'] })
  public async getGameId(req: Request<{ gameName: string }, never>, res: Response): Promise<void> {
    const { gameName } = req.params
    if (Strings.isNullOrEmpty(gameName)) {
      throw new BadRequest('Missing or invalid gameName')
    }

    const gameInfo = await this._apiClient.games.getGameByName(gameName)
    res.send(gameInfo.id)
  }

  @GET('/game/boxart/:gameName')
  @SwaggerDocs({ summary: 'Returns game box art url.', tags: ['twitch/game'] })
  public async getGameBoxArt(req: Request<{ gameName: string }, never>, res: Response): Promise<void> {
    const { gameName } = req.params
    if (Strings.isNullOrEmpty(gameName)) {
      throw new BadRequest('Missing or invalid gameName')
    }

    const gameInfo = await this._apiClient.games.getGameByName(gameName)
    res.send(`https://static-cdn.jtvnw.net/ttv-boxart/${gameInfo.id}.jpg`)
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
    res.send(teamInfo.logoThumbnailUrl)
  }

  @GET('/team/id/:teamName')
  @SwaggerDocs({ summary: 'Returns team id.', tags: ['twitch/team'] })
  public async getTeamId(req: Request<{ teamName: string }, never>, res: Response): Promise<void> {
    const { teamName } = req.params
    if (Strings.isInvalidTwitchUserName(teamName)) {
      throw new BadRequest('Missing or invalid teamName')
    }

    const teamInfo = await this._apiClient.teams.getTeamByName(teamName)
    res.send(teamInfo.id)
  }

  @GET('/team/members/:teamName')
  @SwaggerDocs({ summary: 'Returns team members.', tags: ['twitch/team'] })
  public async getTeamMembers(req: Request<{ teamName: string }, never>, res: Response): Promise<void> {
    const { teamName } = req.params
    if (Strings.isInvalidTwitchUserName(teamName)) {
      throw new BadRequest('Missing or invalid teamName')
    }

    const teamInfo = await this._apiClient.teams.getTeamByName(teamName)
    res.send(teamInfo.userRelations.map((user) => user.name).join(' '))
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
    res.send(DateUtils.betweenString(userInfo.creationDate, new Date()))
  }

  @GET('/user/avatar/:userName')
  @SwaggerDocs({ summary: 'Returns user account avatar url.', tags: ['twitch/user'] })
  public async getUserAvatar(req: Request<{ userName: string }, never>, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequest('Missing or invalid userName')
    }

    const userInfo = await this._apiClient.users.getUserByName(userName)
    res.send(userInfo.profilePictureUrl)
  }

  @GET('/user/creation/:userName')
  @SwaggerDocs({ summary: 'Returns user account creation date.', tags: ['twitch/user'] })
  public async getUserCreationDate(req: Request<{ userName: string }, never>, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequest('Missing or invalid userName')
    }

    const userInfo = await this._apiClient.users.getUserByName(userName)
    res.send(userInfo.creationDate.toUTCString())
  }

  @GET('/user/id/:userName')
  @SwaggerDocs({ summary: 'Returns user account id.', tags: ['twitch/user'] })
  public async getUserId(req: Request<{ userName: string }, never>, res: Response): Promise<void> {
    const { userName } = req.params
    if (Strings.isInvalidTwitchUserName(userName)) {
      throw new BadRequest('Missing or invalid userName')
    }

    const userInfo = await this._apiClient.users.getUserByName(userName)
    res.send(userInfo.id)
  }

  /* ============================================================================================ */
}
