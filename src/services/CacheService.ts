import { createClient } from 'redis'

export default class CacheService {
  private static readonly _cache = createClient({ url: process.env.CACHE_DATABASE_URL })

  public static async init(): Promise<void> {
    await this._cache.connect()
  }

  public static async getFromCache(key: string): Promise<string> {
    return this._cache.get(key)
  }

  public static async setInCache(key: string, value: string): Promise<void> {
    await this._cache.set(key, value, { EX: 2592000 })
  }

  public static async deleteFromCache(key: string): Promise<void> {
    await this._cache.del(key)
  }
}
