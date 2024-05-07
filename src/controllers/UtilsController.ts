import fs from 'node:fs'
import path from 'node:path'

import { Request, Response } from 'express'

import { PUBLIC_PATH, ROOT_PATH } from 'vogapi/utils/constants'
import RestControler, { GET, SwaggerPath } from 'vogapi/utils/RestControler'

export default class UtilsController extends RestControler {
  private _getFileData(res: Response, filePath: string): string {
    const rawContent = fs.readFileSync(filePath)
    res.setHeader('Content-Type', filePath.endsWith('.html') ? 'text/html' : 'text/plain')
    res.setHeader('Content-Length', rawContent.length)

    return rawContent.toString()
  }

  @GET('/')
  @SwaggerPath({ summary: 'Returns a HTML with home page' })
  public async getIndex(req: Request, res: Response): Promise<void> {
    const filePath = path.resolve(PUBLIC_PATH, 'index.html')
    const rawContent = this._getFileData(res, filePath)
    res.send(rawContent)
  }

  @GET('/privacy-policy')
  @SwaggerPath({ summary: 'Returns a HTML with privacy policy page' })
  public async getPrivacyPolice(req: Request, res: Response): Promise<void> {
    const privacyPolicy = fs.readFileSync(path.resolve(ROOT_PATH, 'privacy-policy.md'), 'utf-8')

    const filePath = path.resolve(PUBLIC_PATH, 'privacy-policy.html')
    let rawContent = this._getFileData(res, filePath)
    rawContent = rawContent.replaceAll(`{{PRIVACY_POLICY}}`, privacyPolicy)
    res.send(rawContent)
  }

  @GET('/license')
  @SwaggerPath({ summary: 'Returns a HTML with license page' })
  public async getLicense(req: Request, res: Response): Promise<void> {
    const pkgJson = JSON.parse(fs.readFileSync(path.resolve(ROOT_PATH, 'package.json'), 'utf-8'))
    const licenseBody = fs.readFileSync(path.resolve(ROOT_PATH, 'LICENSE'), 'utf-8')

    const filePath = path.resolve(PUBLIC_PATH, 'license.html')
    let rawContent = this._getFileData(res, filePath)
    rawContent = rawContent.replaceAll('{{LICENSE_NAME}}', pkgJson.license)
    rawContent = rawContent.replaceAll('{{LICENSE_BODY}}', licenseBody)
    res.send(rawContent)
  }
}
