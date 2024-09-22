import TwurpleApiClient from 'vogapi/services/TwurpleApiClient'
import RestController from 'vogapi/utils/RestController'

export default abstract class TwitchBaseController extends RestController {
  protected readonly _apiClient: TwurpleApiClient

  constructor(apiClient: TwurpleApiClient) {
    super()

    this._apiClient = apiClient
  }
}
