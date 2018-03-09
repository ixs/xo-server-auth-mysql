# xo-server-auth-mysql

> MySQL authentication plugin for XO-Server

This plugin allows MySQL users to authenticate to Xen-Orchestra.

The first time a user signs in, XO will create a new XO user with the
same identifier.

## Install

Installation of the npm package:

```
> npm install --global xo-server-auth-mysql
```

## Usage

Like all other xo-server plugins, it can be configured directly via
the web interface, see [the plugin documentation](https://xen-orchestra.com/docs/plugins.html).

If you have issues, you can use the provided CLI to gather more
information:

```
> xo-server-auth-mysql
? hostname database.example.com
? credentials > username ro_query
? fill optional credentials > password? Yes
? credentials > password ********
? database users
? query SELECT Account AS username, DESPasswort AS password, ACLs AS permission FROM Users AS U WHERE A.Account = ?
? crypto_schema DES
? fill optional insecureAuth? Yes
? insecureAuth Yes
configuration saved in ./mysql.cache.conf
? Username jdoe
? Password [hidden]
0 entries found
Expected one entry, got 0 entries. Not authenticated jdoe.
```

## Development

```
# Install dependencies
> npm install

# Run the tests
> npm test

# Continuously compile
> npm run dev

# Continuously run the tests
> npm run dev-test

# Build for production (automatically called by npm install)
> npm run build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/ixs/xo-server-auth-mysql/issues)
  you've encountered;
- fork and create a pull request.

## License

Based on [xo-server-auth-ldap](https://github.com/vatesfr/xen-orchestra/tree/master/packages/xo-server-auth-ldap)
AGPL3 © Andreas Thienemann
