import Serverless, { Options } from 'serverless'
import * as process from 'process'
import * as child from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import AdmZip from 'adm-zip'
import { buildSteps } from './template'

interface Custom {
  dockerImage: string
  dockerTag: string
  dockerPath: string
  libPath: string
}

class DartPlugin {
  private readonly runtime = 'dart'
  private readonly sanitizedRuntime = 'provided.al2'

  public servicePath: string
  public hooks: { [index: string]: unknown }
  public custom: Custom
  public srcPath: string
  public buildPath: string
  public stagePath: string

  constructor(public serverless: Serverless, public options: Options) {
    this.servicePath = this.serverless.config.servicePath || ''
    this.hooks = {
      'before:package:createDeploymentArtifacts': this.build.bind(this),
      'before:deploy:function:packageFunction': this.build.bind(this),
      'before:offline:start': this.build.bind(this),
      'before:offline:start:init': this.build.bind(this)
    }
    this.custom = {
      ...{ dockerImage: 'google/dart', dockerTag: '2', libPath: 'lib' },
      ...this.serverless.service?.custom?.dart
    }

    this.srcPath = path.resolve(this.custom.dockerPath || this.servicePath)
    this.buildPath = path.resolve(this.srcPath, 'target')
    this.stagePath = path.resolve(this.buildPath, this.options.stage || 'dev')

    const service = this.serverless.service as any
    service.package.excludeDevDependencies = false
  }

  public funcs() {
    return this.options.function
      ? [this.options.function]
      : this.serverless.service.getAllFunctions()
  }

  public dockerBuildArgs(script: string) {
    const defaultArgs = [
      'run',
      '-v',
      `${this.srcPath}:/app`,
      '-v',
      `${this.stagePath}:/target`,
      '-i'
    ]
    const imageArgs = [
      `${this.custom.dockerImage}:${this.custom.dockerTag}`,
      'sh',
      '-c',
      buildSteps({ ...this.custom, ...{ script } })
    ]

    return [...defaultArgs, ...imageArgs]
  }

  public dockerBuild(script: string) {
    const cli = process.env['SLS_DOCKER_CLI'] || 'docker'
    const args = [...this.dockerBuildArgs(script)]

    this.serverless.cli.log(`Running containerized build ...`)

    return child.spawnSync(cli, args, {
      stdio: ['ignore', process.stdout, process.stderr]
    })
  }

  public cleanup() {
    return fs.rmdirSync(this.stagePath, { recursive: true })
  }

  public mkdir() {
    return fs.mkdirSync(this.stagePath, { recursive: true })
  }

  public run() {
    const service = this.serverless.service

    this.cleanup() // first clean-up
    this.mkdir() // mkdir

    return this.funcs().reduce((prev, curr) => {
      const func = service.getFunction(curr)
      const [script] = func.handler.split('.')
      const runtime = func.runtime || service.provider.runtime
      const bootstrap = path.resolve(this.stagePath, `${script}`)
      const artifact = path.resolve(this.stagePath, `${script}.zip`)

      if (runtime != this.runtime) {
        return prev || false
      }

      this.serverless.cli.log(`Building Dart ${func.handler} func...`)

      if (!fs.existsSync(artifact)) {
        const { error, status } = this.dockerBuild(script)
        if (error || (status && status > 0)) {
          this.serverless.cli.log(
            `Dart build encountered an error: ${error} ${status}.`
          )
          throw error
        }

        try {
          this.package(bootstrap, artifact)
        } catch (err) {
          this.serverless.cli.log(`Error zipping artifact ${err}`)

          throw new Error(err)
        }
      }

      func.package = func.package || {}
      func.package.artifact = artifact

      return true
    }, false)
  }

  public package(bootstrap: string, target: string) {
    const zip = new AdmZip()
    zip.addFile('bootstrap', fs.readFileSync(bootstrap), '', 755)

    return fs.writeFileSync(target, zip.toBuffer())
  }

  public build() {
    const service = this.serverless.service

    if (service.provider.name != 'aws') {
      return
    }

    if (!this.run()) {
      throw new Error(
        `Error: no Dart functions found. Use 'runtime: ${this.runtime}' in global or function configuration to use this plugin`
      )
    }

    if (service.provider.runtime === this.runtime) {
      service.provider.runtime = this.sanitizedRuntime
    }
  }
}

module.exports = DartPlugin
