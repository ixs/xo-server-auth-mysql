/* eslint no-throw-literal: 0 */

import { bind, noop } from 'lodash'
import mysql from 'promise-mysql'
import crypt from 'unix-crypt-td-js'

// ===================================================================

export const configurationSchema = {
  type: 'object',
  properties: {
    hostname: {
      description: 'Hostname of the MySQL server',
      type: 'string',
    },
    credentials: {
      description: 'Credentials to connect to MySQL server',
      type: 'object',
      properties: {
        username: {
          description: 'Username',
          type: 'string',
        },
        password: {
          description: 'Password',
          type: 'string',
        },
      },
      required: ['username'],
    },
    database: {
      description: 'Datebase to use',
      type: 'string',
    },
    query: {
      description: `
SQL Query to fetch the password from the database.

A typical examples would look like the following:
- \`SELECT password FROM users WHERE username = ?;\`
- \`SELECT pwd AS password FROM users WHERE acl IN ('admin', 'superuser') AND username = ?;\`

The \`?\` character is part of the query string and will
be replaced with the username at authentication time.

Exactly one row is expected to be returned. If the database would return
the same account multiple times, using the DISTINCT keyword might help.

If multiple columns are returned, the password is expected to be returned as \`password\`.
`.trim(),
      type: 'string',
    },
    crypto_schema: {
      enum: ['None', 'DES'],
      default: 'None',
      enumNames: [
        'None (No encrypted password storage)',
        'DES (Traditional DES-based password hash with salt)',
      ],
      description: 'Encryption scheme of stored passwords in the database',
    },
    insecureAuth: {
      description:
        'Use insecure authentication method for older database servers',
      type: 'boolean',
      default: false,
    },
  },
  required: ['hostname', 'credentials', 'database', 'query', 'crypto_schema'],
}

export const testSchema = {
  type: 'object',
  properties: {
    username: {
      description: 'MySQL username',
      type: 'string',
    },
    password: {
      description: 'MySQL password',
      type: 'string',
    },
  },
  required: ['username', 'password'],
}

// ===================================================================

class AuthMySQL {
  constructor (xo) {
    this._xo = xo

    this._authenticate = bind(this._authenticate, this)
  }

  async configure (conf) {
    const dbConf = {
      host: conf.hostname,
      user: conf.credentials.username,
      password: conf.credentials.password,
      database: conf.database,
      insecureAuth: conf.insecureAuth,
    }

    this._dbConf = dbConf
    this._dbQuery = conf.query
    this._dbQrypt = conf.crypto_schema
  }

  load () {
    this._xo.registerAuthenticationProvider(this._authenticate)
  }

  unload () {
    this._xo.unregisterAuthenticationProvider(this._authenticate)
  }

  test ({ username, password }) {
    return this._authenticate({
      username,
      password,
    }).then(result => {
      if (result === null) {
        throw new Error('could not authenticate user')
      }
    })
  }

  async _authenticate ({ username, password }, logger = noop) {
    if (username === undefined || password === undefined) {
      logger('require `username` and `password` to authenticate!')

      return null
    }

    const connection = await mysql.createConnection(this._dbConf)
    try {
      // Connect to DB and fetch results
      const entries = await connection.query(this._dbQuery, [username])

      logger(`${entries.length} entries found`)

      if (entries.length !== 1) {
        logger(
          `Expected one entry, got ${
            entries.length
          } entries. Not authenticated ${username}.`
        )

        return null
      }

      let encPassword
      switch (this._dbCrypt) {
        case 'None':
          encPassword = password
          break
        case 'DES':
          encPassword = await crypt(password, entries[0].password)
          break
        default:
          logger(`Unknown storage type $(this._dbCrypt)`)
          return null
      }

      if (encPassword === entries[0].password) {
        logger(`Password match for ${username} => authenticated`)
        return { username }
      }

      logger(`could not authenticate ${username}`)
      return null
    } finally {
      await connection.end()
    }
  }
}

// ===================================================================

export default ({ xo }) => new AuthMySQL(xo)
