# Security

## Scope

WebOS Magic Caster is intended for **private home networks**. It runs a local HTTP server and controls the TV over the LAN. It is **not** designed to be exposed to the public internet without additional hardening.

## Reporting a vulnerability

Please report security issues **privately** so we can address them before public disclosure:

- Open a [GitHub Security Advisory](https://github.com/ummugulsunn/webos-magic-caster/security/advisories/new) for this repository, **or**
- Email the maintainer if that option is listed on their GitHub profile.

Include: affected version/commit, steps to reproduce, and impact if known.

## Operational precautions

- Run the server only on trusted networks; do not port-forward it without authentication and TLS.
- `tv-key.json` stores TV pairing data — keep it private and do not commit it (it is listed in `.gitignore`).
- Keep Node.js and dependencies updated (`npm audit`).
