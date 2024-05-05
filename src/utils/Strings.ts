export default class Strings {
  public static isNullOrEmpty(str: string): boolean {
    return str == null || str.trim() === ''
  }

  public static isInvalidTwitchUserName(str: string): boolean {
    if (this.isNullOrEmpty(str) || str.length < 4 || str.length > 25) {
      return true
    }

    return !/^[a-zA-Z0-9_]+$/.test(str)
  }
}
