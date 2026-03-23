# Contributing

Thanks for your interest in improving WebOS Magic Caster.

## How to contribute

1. **Issues first** — Open an [issue](https://github.com/ummugulsunn/webos-magic-caster/issues) to describe the bug or feature before large changes, unless it is a trivial fix (typo, obvious bug).
2. **Fork & branch** — Create a branch from `main` with a short descriptive name (e.g. `fix-volume-sync`, `docs-readme-troubleshooting`).
3. **Keep changes focused** — One logical change per pull request makes review and history easier.
4. **Test locally** — Run `npm install`, `npm start`, and confirm the remote UI and TV actions you touched still work on your network.

## Development setup

```bash
git clone https://github.com/ummugulsunn/webos-magic-caster.git
cd webos-magic-caster
npm install
TV_IP=192.168.x.x npm start
```

Use `TV_IP` for your LG TV’s LAN address. The web UI is served on port `3333` by default (override with `PORT`).

## Code style

- Match the existing style in `server.js` (CommonJS, same naming and structure).
- Avoid committing secrets, API keys, or personal TV IPs. `tv-key.json` is already gitignored.

## Pull requests

- Describe **what** changed and **why** in the PR description.
- Link related issues with `Fixes #123` when applicable.

## Security

If you find a security problem, please see [SECURITY.md](SECURITY.md) instead of opening a public issue.
