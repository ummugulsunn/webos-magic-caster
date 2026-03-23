# Contributing

1. Open an [issue](https://github.com/ummugulsunn/webos-magic-caster/issues) for non-trivial changes.
2. Branch from `main`, keep PRs focused, match existing style in `server.js`.
3. Run `npm install` and test against your TV on the LAN.

```bash
TV_IP=192.168.x.x npm start   # optional: PORT=3333
```

Do not commit `tv-key.json`, secrets, or `node_modules`. Update `package-lock.json` when dependencies change.

Security reports: [SECURITY.md](./SECURITY.md).
