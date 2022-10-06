import express, { NextFunction, Request, Response, Router } from 'express'
import Logger, { ILogLevel } from 'js-logger'

import { log } from './logger'
import { proxy } from './proxy'

export type HawtioBackendOptions = {
  /**
   * Log level
   */
  logLevel: ILogLevel | string
}

const defaultOptions: HawtioBackendOptions = {
  logLevel: Logger.INFO,
}

export function hawtioBackend(
  options: HawtioBackendOptions = defaultOptions
): Router {
  if (typeof options.logLevel === 'string') {
    log.setLevel(
      (Logger as unknown as { [key: string]: ILogLevel })[
        options.logLevel.toUpperCase()
      ]
    )
  } else {
    log.setLevel(options.logLevel)
  }

  const backend = express.Router()

  backend.param(
    'proto',
    (_req: Request, res: Response, next: NextFunction, proto: string) => {
      log.debug('requesting proto:', proto)
      switch (proto.toLowerCase()) {
        case 'http':
        case 'https':
          next()
          break
        default:
          res.status(406).send(`Invalid protocol: ${proto}`)
      }
    }
  )

  backend.param(
    'hostname',
    (_req: Request, _res: Response, next: NextFunction, hostname: string) => {
      log.debug('requesting hostname:', hostname)
      next()
    }
  )

  backend.param(
    'port',
    (_req: Request, res: Response, next: NextFunction, port: string) => {
      log.debug('requesting port:', port)
      const portNumber = parseInt(port)
      log.debug('parsed port number:', portNumber)
      if (isNaN(portNumber)) {
        res.status(406).send(`Invalid port number: ${port}`)
      } else {
        next()
      }
    }
  )

  backend.use('/', (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '') {
      res.status(200).end()
    } else {
      next()
    }
  })

  backend.use('/:proto/:hostname/:port/', (req: Request, res: Response) => {
    const uri = getTargetURI({
      proto: req.params.proto,
      hostname: req.params.hostname,
      port: req.params.port,
      path: req.path,
      query: req.query,
    })
    proxy(uri, req, res)
  })

  return backend
}

type URIOptions = {
  proto: string
  username?: string
  password?: string
  hostname: string
  port: string
  path: string
  query: qs.ParsedQs
}

function getTargetURI(options: URIOptions): string {
  let uri = ''
  if (options.username && options.password) {
    uri = `${options.proto}://${options.username}:${options.password}@${options.hostname}:${options.port}${options.path}`
  } else {
    uri = `${options.proto}://${options.hostname}:${options.port}${options.path}`
  }
  if (options.query) {
    uri += '?' + options.query.toString()
  }
  log.debug('Target URL:', uri)
  return uri
}
