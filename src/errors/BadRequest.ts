import BaseHTTPError from 'vogapi/errors/BaseHTTPError'

export default class BadRequest extends BaseHTTPError {
  constructor(errorMessage: string) {
    super(400, errorMessage)
  }
}
