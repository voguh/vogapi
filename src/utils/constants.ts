import path from 'node:path'

export const ROOT_PATH = path.resolve(__dirname, '..', '..')
export const LOGS_PATH = path.resolve(ROOT_PATH, 'logs')
export const LIB_PATH = path.resolve(__dirname, '..')
export const PUBLIC_PATH = path.resolve(ROOT_PATH, 'public')

export enum Errors {
  ERR_MISSING_OR_INVALID_USER_NAME = 'ERR_MISSING_OR_INVALID_USER_NAME',
  ERR_MISSING_OR_INVALID_TEAM_NAME = 'ERR_MISSING_OR_INVALID_TEAM_NAME',
  ERR_MISSING_OR_INVALID_GAME_NAME = 'ERR_MISSING_OR_INVALID_GAME_NAME',

  ERR_USER_NOT_FOUND = 'ERR_USER_NOT_FOUND',
  ERR_GAME_NOT_FOUND = 'ERR_GAME_NOT_FOUND',
  ERR_TEAM_NOT_FOUND = 'ERR_TEAM_NOT_FOUND',
  ERR_STREAM_OFFLINE = 'ERR_STREAM_OFFLINE',

  ERR_UNKNWON_ERROR = 'ERR_UNKNWON_ERROR'
}
