import BaseHTTPError from 'vogapi/errors/BaseHTTPError'

export default class BadRequestError extends BaseHTTPError {
  constructor(errorMessage: string) {
    super(400, errorMessage)
  }
}
