const path = require('node:path')

const { compilerOptions } = require('./tsconfig.json')

const alias = Object.entries(compilerOptions.paths)
  .map(([key, values]) => [key.replace('/*', ''), values[0].replace('/*', '')])
  .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }], ['@babel/preset-typescript']],
  plugins: [
    ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
    ['module-resolver', { cwd: path.resolve(__dirname), alias }]
  ],
  ignore: ['**/*.d.ts']
}
