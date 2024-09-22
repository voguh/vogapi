import type { Request as ExpressRequest, Response } from 'express'
import type { ParsedQs } from 'qs'

import TwitchBaseController from 'vogapi/controllers/twitch/TwitchBaseController'
import BadRequestError from 'vogapi/errors/BadRequestError'
import NotFoundError from 'vogapi/errors/NotFoundError'
import CacheService from 'vogapi/services/CacheService'
import { Errors } from 'vogapi/utils/constants'
import { GET, SwaggerPath, SwaggerResponse } from 'vogapi/utils/RestController'
import Strings from 'vogapi/utils/Strings'

type Request = ExpressRequest<{ teamName: string }, any, any, ParsedQs>
export default class TwitchTeamController extends TwitchBaseController {
  private async _getTeamId(teamName: string): Promise<string> {
    const key = `team:${teamName}:id`

    const cachedId = await CacheService.getFromCache(key)
    if (cachedId == null) {
      const teamInfo = await this._apiClient.teams.getTeamByName(teamName)
      if (teamInfo == null) {
        throw new NotFoundError(Errors.ERR_TEAM_NOT_FOUND)
      }

      return CacheService.setInCache(key, teamInfo.id)
    }

    return cachedId
  }

  private async _getTeamProfilePictureUrl(teamName: string): Promise<string> {
    const key = `team:${teamName}:thumbnailUrl`

    const cachedThumbnailUrl = await CacheService.getFromCache(key)
    if (cachedThumbnailUrl == null) {
      const teamInfo = await this._apiClient.teams.getTeamByName(teamName)
      if (teamInfo == null) {
        throw new NotFoundError(Errors.ERR_TEAM_NOT_FOUND)
      }

      return CacheService.setInCache(key, teamInfo.logoThumbnailUrl, 3600)
    }

    return cachedThumbnailUrl
  }

  /* ============================================================================================ */

  @GET('/avatar/:teamName')
  @SwaggerPath({ summary: 'Returns team avatar url.', tags: ['twitch/team'] })
  @SwaggerResponse(200, 'Team avatar url.')
  @SwaggerResponse(400, 'Team name is invalid.')
  @SwaggerResponse(404, 'Team not found.')
  public async getTeamAvatar(req: Request, res: Response): Promise<void> {
    const { teamName } = req.params
    if (Strings.isInvalidTwitchUserName(teamName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_TEAM_NAME)
    }

    const teamLogoThumbnailUrl = await this._getTeamProfilePictureUrl(teamName)
    this._sendRawString(res, teamLogoThumbnailUrl)
  }

  @GET('/id/:teamName')
  @SwaggerPath({ summary: 'Returns team id.', tags: ['twitch/team'] })
  @SwaggerResponse(200, 'Team id.')
  @SwaggerResponse(400, 'Team name is invalid.')
  @SwaggerResponse(404, 'Team not found.')
  public async getTeamId(req: Request, res: Response): Promise<void> {
    const { teamName } = req.params
    if (Strings.isInvalidTwitchUserName(teamName)) {
      throw new BadRequestError(Errors.ERR_MISSING_OR_INVALID_TEAM_NAME)
    }

    const teamId = await this._getTeamId(teamName)
    this._sendRawString(res, teamId)
  }

  @GET('/members/:teamName')
  @SwaggerPath({ summary: 'Returns team members.', tags: ['twitch/team'] })
  @SwaggerResponse(200, 'Team members separated by spaces.')
  @SwaggerResponse(400, 'Team name is invalid.')
  @SwaggerResponse(404, 'Team not found.')
  public async getTeamMembers(req: Request, res: Response): Promise<void> {
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
}
