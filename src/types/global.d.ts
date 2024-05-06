declare namespace NodeJS {
  interface ProcessEnv {
    readonly LOG_LEVEL: string
    readonly CACHE_DATABASE_URL: string
    readonly TWITCH_CLIENT_ID: string
    readonly TWITCH_CLIENT_SECRET: string
  }
}
