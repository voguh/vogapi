import NodeCache from 'node-cache'

export default class CacheService {
  private static readonly _cache = new NodeCache({ stdTTL: 2592000 })

  public static getFromCache(key: string): string {
    return this._cache.get(key)
  }

  public static setInCache(key: string, value: string): void {
    this._cache.set(key, value)
  }

  public static deleteFromCache(key: string): void {
    this._cache.del(key)
  }
}
