import { createClient } from 'redis'

export default class CacheService {
  private static readonly _cache = createClient({ url: process.env.CACHE_DATABASE_URL })

  public static async init(): Promise<void> {
    await this._cache.connect()
  }

  public static async getFromCache(key: string): Promise<string> {
    return this._cache.get(key)
  }

  public static async setInCache(key: string, value: string, ttl?: number): Promise<string> {
    await this._cache.set(key, value, { EX: ttl ?? 2592000 })

    return value
  }
}
