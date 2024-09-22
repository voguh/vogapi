export default abstract class BaseHTTPError extends Error {
  private readonly _statusCode: number

  get statusCode(): number {
    return this._statusCode
  }

  /**
   *
   * @param {number} statusCode HTTP status code see [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
   * @param {string} errorMessage Error message
   */
  constructor(statusCode: number, errorMessage: string) {
    super(errorMessage)
    this._statusCode = statusCode
  }
}
