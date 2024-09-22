import BaseHTTPError from 'vogapi/errors/BaseHTTPError'

export default class NotFoundError extends BaseHTTPError {
  constructor(errorMessage: string) {
    super(404, errorMessage)
  }
}
